import { parsePartial } from "../partial/parser.ts";
import { View } from "../register.ts";
import { MarkdownTemplate } from "./template.ts";

export class MarkdownView implements View {
    #template: MarkdownTemplate;

    constructor(template: MarkdownTemplate) {
        this.#template = template;
    }

    get children() {
        return parsePartial(this.#template.html).children;
    }

    async render(): Promise<string> {
        return this.#template.html;
    }

    async assemble() {}
}
