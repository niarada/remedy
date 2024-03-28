import { Source, error } from "@niarada/remedy";
import Markdown from "markdown-it";

export class MarkdownSource extends Source {
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
        try {
            this.#html = this.markdown.render(this.text);
        } catch (e) {
            error("markdown", (e as Error).message);
        }
    }
}
