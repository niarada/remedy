import { voids } from "./ast";

export enum TokenType {
    Whitespace = "Whitespace",
    Identifier = "Identifier",
    OpenAngleBracket = "OpenAngleBracket",
    CloseAngleBracket = "CloseAngleBracket",
    Slash = "Slash",
    Equal = "Equal",
    String = "String",
    Expression = "Expression",
    Text = "Text",
}

export interface Token {
    type: TokenType;
    position: number;
    value: string;
}

export function scanPartial(source: string): Token[] {
    const scanner = new Scanner();
    return scanner.scan(source);
}

class Scanner {
    source = "";
    position = 0;
    tokens: Token[] = [];

    scan(source: string): Token[] {
        this.source = source;
        this.position = this.source.search(/^<\w+/m);
        if (this.position === -1) {
            throw new Error(
                "Syntax Error: No elements found\nThe html section must begin with an element at the beginning of a line.",
            );
        }
        while (this.position < this.source.length) {
            const start = this.position;
            this.matchNext();
            if (start === this.position) {
                this.error("Unexpected character");
            }
        }
        return this.tokens;
    }

    token(type: TokenType, position: number) {
        const token = {
            type,
            position,
            value: this.source.slice(position, this.position),
        };
        // console.log(token);
        this.tokens.push(token);
    }

    get ultimate(): Token | undefined {
        return this.tokens[this.tokens.length - 1];
    }

    private matchNext() {
        this.matchElement();
        this.matchText();
    }

    private matchElement() {
        if (
            this.peekStringMatch(2, "</") ||
            !this.matchCharacterType(TokenType.OpenAngleBracket, "<")
        ) {
            return;
        }
        if (!this.matchIdentifier()) {
            this.error("Expected tag name");
        }
        const tag = this.ultimate!.value;
        this.matchWhitespace();
        this.matchAttributes();
        if (!this.matchCharacterType(TokenType.CloseAngleBracket, ">")) {
            this.error("Expected closing brace");
        }
        if (voids.includes(tag)) {
            return;
        }
        this.matchContent();
        if (!this.matchCloseTag(tag)) {
            this.error(`Expected closing tag for ${tag}`);
        }
    }

    private matchCloseTag(tag: string) {
        return (
            this.matchCharacterType(TokenType.OpenAngleBracket, "<") &&
            this.matchCharacterType(TokenType.Slash, "/") &&
            this.matchIdentifier() &&
            this.ultimate!.value === tag &&
            this.matchCharacterType(TokenType.CloseAngleBracket, ">")
        );
    }

    private matchAttributes() {
        while (this.source[this.position] !== ">") {
            this.matchAttribute();
            this.matchWhitespace();
        }
    }

    private matchAttribute() {
        if (!this.matchIdentifier()) {
            this.error("Expected attribute name");
        }
        if (!this.matchCharacterType(TokenType.Equal, "=")) {
            this.error("Expected equal sign");
        }
        if (!this.matchString() && !this.matchExpression()) {
            this.error("Expected attribute value");
        }
    }

    private matchIdentifier() {
        const position = this.position;
        const match = this.source
            .slice(this.position)
            .match(/^[a-z]+(-[a-z]+)*/);
        if (match) {
            this.position += match[0].length;
            this.token(TokenType.Identifier, position);
        }
        return true;
    }

    private matchString() {
        const position = this.position;
        if (this.source[this.position] !== '"') {
            return;
        }
        this.position++;
        while (this.source[this.position] !== '"') {
            this.position++;
        }
        this.position++;
        this.token(TokenType.String, position);
        return true;
    }

    private matchContent() {
        while (
            this.position < this.source.length &&
            !this.peekStringMatch(2, "</")
        ) {
            this.matchText();
            this.matchElement();
        }
    }

    private matchText(): true | undefined {
        const position = this.position;
        while (
            !this.peekCharacter("{<") &&
            this.position < this.source.length
        ) {
            this.position++;
        }
        if (position !== this.position) {
            this.token(TokenType.Text, position);
        }
        if (this.peekCharacter("{")) {
            this.matchExpression();
            return this.matchText();
        }
        if (this.peekCharacter("<") && !this.peekStringMatch(2, "</")) {
            this.matchElement();
            return this.matchText();
        }
        if (position === this.position) {
            return;
        }
        return true;
    }

    private matchExpression() {
        const position = this.position;
        if (this.source[this.position] !== "{") {
            return;
        }
        this.position++;
        while (this.source[this.position] !== "}") {
            this.position++;
        }
        this.position++;
        this.token(TokenType.Expression, position);
        return true;
    }

    private matchWhitespace() {
        const position = this.position;
        const match = this.source.slice(this.position).match(/^\s+/);
        if (!match) {
            return;
        }
        this.position += match[0].length;
        this.token(TokenType.Whitespace, position);
        return true;
    }

    private matchCharacterType(type: TokenType, chars: string) {
        const position = this.position;
        if (!chars.split("").includes(this.source[this.position])) {
            return;
        }
        this.position++;
        this.token(type, position);
        return true;
    }

    private peekCharacter(chars: string) {
        if (chars.split("").includes(this.source[this.position])) {
            return this.source[this.position];
        }
    }

    private peekStringMatch(length: number, str: string) {
        return this.source.slice(this.position, this.position + length) === str;
    }

    private error(message: string) {
        const line = this.source.slice(0, this.position).split("\n").length;
        const column =
            this.position - this.source.lastIndexOf("\n", this.position);
        throw new Error(
            `Syntax Error: ${message} at line ${line}, column ${column}: ${
                this.source[this.position]
            }\n`,
        );
    }
}
