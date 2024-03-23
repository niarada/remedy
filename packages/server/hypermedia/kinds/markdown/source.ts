import Shiki from "@shikijs/markdown-it";
import yaml from "js-yaml";
import Markdown from "markdown-it";
import { readFileSync } from "node:fs";
import { LanguageInput, ThemeRegistration } from "shiki";
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

function readYaml(path: string) {
    return yaml.load(readFileSync(require.resolve(path), "utf-8")) as Record<string, unknown>;
}

const theme = readYaml("./themes/red.yaml") as ThemeRegistration;
const remedyLanguage = { name: "part", ...readYaml("./langs/remedy.tmLanguage.yaml") } as LanguageInput;
const remedyTemplateLanguage = readYaml("./langs/template.tmLanguage.yaml") as LanguageInput;

markdown.use(
    await Shiki({
        themes: {
            light: theme,
            dark: theme,
        },
        langs: ["ts", "sh", remedyTemplateLanguage, remedyLanguage],
    }),
);
