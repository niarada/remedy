import markdown from "markdown-it";
import { Source } from "~/hypermedia";

export class MarkdownSource extends Source {
    readonly kind = "markdown";

    #html!: string;

    get attributes() {
        return "null";
    }

    get template() {
        return JSON.stringify(this.#html);
    }

    compile() {
        this.#html = markdown().render(this.text);
    }
}
