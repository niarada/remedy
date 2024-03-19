// Adapted from https://github.com/tylingsoft/markdown-it-regex

import Markdown, { Token } from "markdown-it";
import StateCore from "markdown-it/lib/rules_core/state_core";

interface MarkdownRegexpOptions {
    name: string;
    regexp: RegExp;
    replace: (match: string) => string;
}

export const rendererRule = (tokens: Token[], idx: number, options: MarkdownRegexpOptions) => {
    return options.replace(tokens[idx].content);
};

export const coreRuler = (state: StateCore, options: MarkdownRegexpOptions) => {
    for (let i = 0; i < state.tokens.length; i++) {
        if (state.tokens[i].type !== "inline") {
            continue;
        }
        let tokens = state.tokens[i].children ?? [];
        for (let j = tokens.length - 1; j >= 0; j--) {
            const token = tokens[j];
            if (token.type === "text" && options.regexp.test(token.content)) {
                const newTokens = token.content
                    .split(options.regexp)
                    .map((item, index) => ({ type: index % 2 === 0 ? "text" : options.name, content: item }))
                    .filter((item) => item.content.length > 0)
                    .map((item) => {
                        const newToken = new state.Token(item.type, "", 0);
                        newToken.content = item.content;
                        return newToken;
                    });
                state.tokens[i].children = tokens = [...tokens.slice(0, j), ...newTokens, ...tokens.slice(j + 1)];
            }
        }
    }
};

const regexPlugin = (md: Markdown, options: MarkdownRegexpOptions) => {
    md.renderer.rules[options.name] = (tokens, idx) => {
        return rendererRule(tokens, idx, options);
    };

    md.core.ruler.push(options.name, (state) => {
        coreRuler(state, options);
    });
};

export default function (md: Markdown, options: MarkdownRegexpOptions) {
    md.use(regexPlugin, options);
}
