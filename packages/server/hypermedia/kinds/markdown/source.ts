import Shiki from "@shikijs/markdown-it";
import Markdown from "markdown-it";
import { Source } from "~/hypermedia/source";
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

// XXX: Theme stuff should be done in user apps.

markdown.use(
    await Shiki({
        themes: {
            light: require("./themes/monochrome-red.json"),
            dark: require("./themes/monochrome-red.json"),
        },
        langs: ["ts", "sh", require("./langs/remedy-partial.json")],
    }),
);
