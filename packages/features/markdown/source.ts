import { Source } from "@niarada/remedy";
import Markdown from "markdown-it";

export class MarkdownSource extends Source {
    readonly kind = "markdown";
    #html!: string;

    constructor(
        text: string,
        path: string | undefined,
        private markdown: Markdown,
    ) {
        super(text, path);
    }

    override get template() {
        return JSON.stringify(this.#html);
    }

    compile() {
        this.#html = this.markdown.render(this.text);
    }
}
