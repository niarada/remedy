import { Glob } from "bun";
import { resolve } from "path";
import { error, warn } from "~/lib/log";
import { MarkdownModule, MarkdownTemplate } from "./markdown/template";
import { HtmlNode } from "./partial/ast";
import { PartialModule, PartialTemplate } from "./partial/template";

export interface Template {
    register: Register;
    tag: string;
    path: string;
    present: (subview?: View) => View;
}

export interface View {
    render: () => Promise<string>;
    assemble: (attributes?: Record<string, unknown>) => Promise<void>;
    get children(): HtmlNode[];
}

/**
 * The register class manages a directory of templates.
 */
export class Register {
    templates: Record<string, Template> = {};

    constructor(
        // Base path for loading templates.
        public base: string,
    ) {}

    async initialize() {
        for await (const path of new Glob("**/*.{part,md}").scan(this.base)) {
            const tag = tagFromPath(path);
            if (this.templates[tag]) {
                warn(
                    "register",
                    `Duplicate tag '${tag}' defined in '${this.base}/${path}'`,
                );
                warn(
                    "register",
                    `Using '${this.base}/${this.templates[tag].path}'`,
                );
                continue;
            }
            await this.load(path);
        }
    }

    async load(path: string) {
        const tag = tagFromPath(path);
        const absoluteFilePath = resolve(`${this.base}/${path}`);
        if (this.templates[tag]) {
            delete require.cache[absoluteFilePath];
        }
        try {
            if (path.endsWith(".part")) {
                const module = (await import(
                    absoluteFilePath
                )) as PartialModule;
                this.templates[tag] = new PartialTemplate(
                    this,
                    tag,
                    path,
                    module,
                );
            }
            if (path.endsWith(".md")) {
                const module = (await import(
                    absoluteFilePath
                )) as MarkdownModule;
                this.templates[tag] = new MarkdownTemplate(
                    this,
                    tag,
                    path,
                    module,
                );
            }
        } catch (e) {
            error("register", `Failed to load '${path}'`);
            // @ts-ignore
            const cause = e.cause?.toString();
            if (cause) {
                console.log(cause);
            } else {
                console.log(e);
            }
            return;
        }
        return this.templates[tag];
    }

    /**
     * Use this for testing only.
     * @param tag
     * @returns
     */
    async _present(tag: string) {
        return (
            (await this.load(pathFromTag(tag)))! as PartialTemplate
        ).present();
    }

    get(tag: string): Template | undefined {
        return this.templates[tag];
    }
}

function tagFromPath(path: string) {
    let tag = path
        .split("/")
        .filter((it) => !/^\(.*\)$/.test(it))
        .join("-")
        .replace(/\.(part|md)/g, "");
    if (tag === "index") {
        tag = "root";
    }
    if (tag.endsWith("-index")) {
        tag = tag.replace(/-index$/, "");
    }
    return tag;
}

/**
 * Testing use only
 */
function pathFromTag(tag: string) {
    return `${tag.replace(/-/g, "/")}.part`;
}
