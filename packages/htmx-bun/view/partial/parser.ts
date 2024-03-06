import {
    HtmlElement,
    HtmlElementAttributeValue,
    HtmlFragment,
    HtmlNode,
    createHtmlFragment,
    voids,
} from "./ast";
import { Token, TokenType, scanPartial } from "./scanner";

export function parsePartial(source: string) {
    const parser = new Parser(source);
    return parser.parse() as HtmlFragment;
}

class Parser {
    source: string;
    tokens: Token[];
    stack: HtmlNode[];
    position = 0;

    constructor(source: string) {
        this.source = source;
        this.tokens = scanPartial(this.source);
        this.stack = [createHtmlFragment()];
    }

    get top(): HtmlElement {
        return this.stack[this.stack.length - 1] as HtmlElement;
    }

    get token(): Token {
        return this.tokens[this.position];
    }

    offset(offset: number) {
        return this.tokens[this.position + offset];
    }

    offsetTypeIs(offset: number, type: TokenType) {
        return this.offset(offset).type === type;
    }

    parse() {
        while (this.position < this.tokens.length) {
            const position = this.position;
            this.parseNext();
            if (position === this.position) {
                this.error(`Unexpected ${this.token.type}`);
            }
        }
        return this.stack[0];
    }

    parseNext() {
        switch (this.token.type) {
            case TokenType.Whitespace: {
                this.position++;
                break;
            }
            case TokenType.TagName: {
                const element: HtmlElement = {
                    type: "element",
                    parent: this.top,
                    tag: this.token.value,
                    void: voids.includes(this.token.value),
                    attrs: [],
                    children: [],
                };
                this.top.children.push(element);
                this.stack.push(element);
                this.position++;
                break;
            }
            case TokenType.AttributeName: {
                const name = this.token.value;
                if (!this.offsetTypeIs(1, TokenType.Equal)) {
                    this.top.attrs.push({ name, value: [] });
                    this.position++;
                    break;
                }
                this.position += 2;
                const value: HtmlElementAttributeValue[] = [];
                while (true) {
                    const type = this.offset(0).type;
                    if (type === TokenType.Text) {
                        value.push({ type: "text", content: this.token.value });
                    } else if (type === TokenType.Expression) {
                        value.push({
                            type: "expression",
                            content: this.token.value.slice(1, -1),
                        });
                    } else {
                        break;
                    }
                    this.position++;
                }
                this.top.attrs.push({ name, value });
                // this.position++;
                break;
            }
            case TokenType.OpenAngleBracket: {
                this.position++;
                break;
            }
            case TokenType.CloseAngleBracket: {
                if (
                    this.offsetTypeIs(-1, TokenType.Slash) ||
                    (!this.offsetTypeIs(-1, TokenType.TagName) && this.top.void)
                ) {
                    this.stack.pop();
                }
                this.position++;
                break;
            }
            case TokenType.Slash: {
                this.stack.pop();
                this.position += 2;
                break;
            }
            case TokenType.Equal: {
                break;
            }
            case TokenType.Expression: {
                this.top.children.push({
                    parent: this.top,
                    type: "expression",
                    content: this.token.value.slice(1, -1),
                });
                this.position++;
                break;
            }
            case TokenType.Text: {
                this.top.children.push({
                    parent: this.top,
                    type: "text",
                    content: this.token.value,
                });
                this.position++;
                break;
            }
        }
    }

    parseContent() {}

    private error(message: string) {
        const line = this.source
            .slice(0, this.token.position)
            .split("\n").length;
        const column =
            this.position - this.source.lastIndexOf("\n", this.position);
        throw new Error(
            `Parser Error: ${message} at line ${line}, column ${column}: ${this.token.value}\n`,
        );
    }
}
