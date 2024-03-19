import Markdown from "markdown-it";
import { Source } from "~/hypermedia";
import markdownRegexp from "./regexp";

export class MarkdownSource extends Source {
    readonly kind = "markdown";

    #html!: string;

    get attributes() {
        return "{}";
    }

    get template() {
        return JSON.stringify(this.#html);
    }

    compile() {
        this.#html = markdown.render(this.text);
    }
}

const markdown = new Markdown();

markdown.set({
    xhtmlOut: false,
});

markdown.renderer.rules.text = (tokens, idx) => {
    return tokens[idx].content;
};

markdown.disable("entity");

markdownRegexp(markdown, {
    name: "fontawesome",
    regexp: /fa\(([^\)]+)\)/,
    replace: (match) => {
        return `<i class="fa fa-${match}"></i>`;
    },
});
