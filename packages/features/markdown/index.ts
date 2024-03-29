import { RemedyFeatureFactory } from "@niarada/remedy";
import Shiki from "@shikijs/markdown-it";
import yaml from "js-yaml";
import Markdown from "markdown-it";
import markdownAnchor from "markdown-it-anchor";
import markdownAttrs from "markdown-it-attrs";
import markdownToc from "markdown-it-toc-done-right";
import { existsSync, readFileSync } from "node:fs";
import { BundledLanguage, LanguageInput, ThemeRegistration } from "shiki";
import markdownRegexp from "./regexp";
import { MarkdownSource } from "./source";

export interface MarkdownOptions {
    theme?: string;
    languages?: BundledLanguage[];
}

export default function (options: MarkdownOptions = {}): RemedyFeatureFactory {
    return async () => {
        const markdown = new Markdown();
        const languages: BundledLanguage[] = options.languages || [];
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
        let theme: ThemeRegistration | undefined;

        if (options.theme && existsSync(options.theme)) {
            if (options.theme.endsWith(".yaml") || options.theme.endsWith(".yml")) {
                theme = readYaml(options.theme);
            }
            if (options.theme.endsWith(".json")) {
                theme = JSON.parse(readFileSync(options.theme, "utf-8")) as ThemeRegistration;
            }
        }

        const remedyLanguage = {
            name: "rx",
            ...readYaml(require.resolve("./langs/remedy.tmLanguage.yaml")),
        } as LanguageInput;
        const remedyTemplateLanguage = readYaml(require.resolve("./langs/template.tmLanguage.yaml")) as LanguageInput;

        markdown.use(
            await Shiki({
                themes: {
                    light: theme,
                    dark: theme,
                },
                langs: [...languages, remedyTemplateLanguage, remedyLanguage],
            }),
        );

        markdown.use(markdownAttrs);
        markdown.use(markdownAnchor);
        markdown.use(markdownToc);

        return {
            name: "markdown",
            extension: "md",
            source(text: string, path?: string) {
                return new MarkdownSource(text, path, markdown);
            },
        };
    };
}

function readYaml(path: string) {
    return yaml.load(readFileSync(path, "utf-8")) as Record<string, unknown>;
}
