import { Glob } from "bun";
import { resolve } from "path";
import { error, warn } from "~/lib/log";
import { Template, TemplateModule } from "./template";

export class TemplateRegister {
    templates: Record<string, Template> = {};

    constructor(
        // Base path for loading templates.
        public base: string,
    ) {}

    async initialize() {
        for await (const path of new Glob("**/*.part").scan(this.base)) {
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
            // info("register", `registering partial at '${path}'`);
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
            const module = (await import(absoluteFilePath)) as TemplateModule;
            this.templates[tag] = new Template(this, tag, path, module);
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
        return (await this.load(pathFromTag(tag)))!.present();
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
        .replace(/\.part/g, "");
    if (tag === "index") {
        tag = "root";
    }
    if (tag.endsWith("-index")) {
        tag = tag.replace(/-index$/, "");
    }
    return tag;
}

function pathFromTag(tag: string) {
    return `${tag.replace(/-/g, "/")}.part`;
}
