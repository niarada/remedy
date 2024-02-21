import { Glob } from "bun";
import { existsSync, mkdir } from "fs";
import { ServerFeature } from ".";
import { debug, error, info, warn } from "../log";
import { ServerOptions } from "../options";
import { watch } from "../watch";

interface Element {
    path: string;
    pathname: string;
    tag: string;
    content?: string;
    template?: (attrs: Record<string, string>) => Promise<string | undefined> | string | undefined;
}

export default async function (options: ServerOptions): Promise<ServerFeature> {
    const elements = await buildElements();
    const elementRegex = new RegExp(
        elements.map((it) => `(<${it.tag}[^-])`).join("|"),
    );
    if (options?.features?.dev) {
        info("view", "watching 'view' directory...");
        watch("view", async (_, path) => {
            const element = elements.find((it) => it.path === path);
            if (element) {
                if (existsSync(`view/${element.path}`)) {
                    reloadElement(element);
                } else {
                    info("view", `unloading 'view/${element.path}' (<${element.tag}>)`);
                    elements.splice(elements.indexOf(element), 1);
                }
            } else {
                buildElement(elements, path);
            }
        })
    }
    // debug("view", "element regexp", elementRegex);
    // A special rewriter is required to facilitate recursion over the rendered view tree.
    const rewriter = new HTMLRewriter();
    rewriter.on("*", {
        async comments(comment) {
            comment.remove();
        },
        async element(el) {
            // debug("view", "start element", el.tagName);
            const element = elements.find((it) => it.tag === el.tagName);
            if (!element) {
                return;
            }
            let content = element.content;

            if (element.template) {
                if (el.selfClosing) {
                    debug("view", "self closing", el.tagName);
                }
                const attrs: Record<string, string> = {};
                for (const [name, value] of el.attributes) {
                    attrs[name] = value;
                }
                try {
                    content = await element.template(attrs);
                } catch (e) {
                    error("view", `Error in template: '${element.tag}'`);
                    console.error(e);
                    // XXX: Figure out how to raise error here to return a 500.
                }
            }
            if (!content) {
                el.remove();
                return;
            }
            const re = new RegExp(`<${element.tag}[^-]`);
            if (content.match(re)) {
                warn("view", `Recursive view: '${element.tag}', removing...`);
                console.log(content);
                el.remove();
                return;
            }
            // console.log(content);
            // el.remove();
            // el.after(content, { html: true });
            el.replace(content, { html: true });
            // debug("view", "end element", el.tagName);
        },
    });
    return {
        async fetch(request) {
            const url = new URL(request.url);
            const pathname = url.pathname === "/" ? "/index" : url.pathname;
            const element = elements.find((it) => it.pathname === pathname);
            if (!element) {
                return;
            }
            const attrs = [];
            for (const [name, value] of url.searchParams) {
                attrs.push(`${name}="${value}"`);
            }
            let content = rewriter.transform(
                `<${element.tag} ${attrs.join(" ")}></${element.tag}>`,
            );
            // console.log(content, elementRegex);
            // debug("view", "pre-recursive content", content);
            while (content.match(elementRegex)) {
                content = rewriter.transform(content);
                // debug("view", "post-recursive content", content);
            }
            return new Response(content, {
                headers: {
                    "Content-Type": "text/html;charset=utf-8",
                },
            });
        },
    };
}

async function buildElements() {
    const elements: Element[] = [];
    if (!existsSync("view")) {
        info("view", "creating 'view' directory")
        mkdir('view', { recursive: true }, () => { })
    }
    for await (const path of new Glob("**/*.{html,ts}").scan("view")) {
        await buildElement(elements, path);
    }
    return elements;
}

async function buildElement(elements: Element[], path: string) {
    const pathname = path.replace(/(\.ts|\.html)/g, "");
    let tag = pathname.replace(/\//g, "-");
    if (tag === "index") {
        tag = "root";
    }
    if (tag.endsWith("-index")) {
        tag = tag.replace(/-index$/, "");
    }
    const existingTag = elements.find((it) => it.tag === tag);
    if (existingTag) {
        warn("view", `Duplicate tag '${tag}' defined in 'view/${path}'`);
        warn("view", `Using 'view/${existingTag.path}'`);
        return;
    }
    const element: Element = {
        path,
        pathname: `/${pathname}`,
        tag,
    };
    await reloadElement(element);
    elements.push(element);
}

async function reloadElement(element: Element) {
    info("view", `(re)-loading 'view/${element.path}' AKA <${element.tag} />`);
    if (element.path.endsWith(".html")) {
        element.content = await Bun.file(`view/${element.path}`).text();
    }
    if (element.path.endsWith(".ts")) {
        element.template = (
            await import(Bun.resolveSync(`./view/${element.path}`, "."))
        ).default;
    }
}
