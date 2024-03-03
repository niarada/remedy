import { Glob } from "bun";
import { resolve } from "path";
import { warn } from "~/lib/log";
import { Template, TemplateModule } from "./template";

export class TemplateRegister {
    templates: Record<string, Template> = {};

    constructor(
        // Base path for the view tree
        public base: string,
    ) {}

    async initialize() {
        for await (const path of new Glob("**/*.part").scan(this.base)) {
            let tag = path.replace(/\.part/g, "").replace(/\//g, "-");
            if (tag === "index") {
                tag = "root";
            }
            if (tag.endsWith("-index")) {
                tag = tag.replace(/-index$/, "");
            }
            if (this.templates[tag]) {
                warn(
                    "view",
                    `Duplicate tag '${tag}' defined in '${this.base}/${path}'`,
                );
                warn(
                    "view",
                    `Using '${this.base}/${this.templates[tag].path}'`,
                );
                continue;
            }
            await this.reload(tag);
        }
    }

    async reload(tag: string) {
        const path = tag === "root" ? "index" : tag.replace(/-/g, "/");
        const absoluteFilePath = resolve(`${this.base}/${path}.part`);
        if (this.templates[tag]) {
            delete require.cache[absoluteFilePath];
        }
        const module = (await import(absoluteFilePath)) as TemplateModule;
        const view = new Template(this, tag, path, module);
        this.templates[tag] = view;
    }

    get(tag: string) {
        return this.templates[tag];
    }
}
