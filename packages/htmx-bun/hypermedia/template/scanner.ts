import { htmlVoidTags } from ".";

// XXX: Scanner tokens aren't all capturing full values.
//      Serializing the token values should produce the exact text that was read.
//      Specifically, text attribute quotes are going missing.

export enum TokenType {
    Whitespace = "Whitespace",
    TagName = "TagName",
    AttributeName = "AttributeName",
    OpenAngleBracket = "OpenAngleBracket",
    CloseAngleBracket = "CloseAngleBracket",
    Slash = "Slash",
    Equal = "Equal",
    Expression = "Expression",
    Text = "Text",
    Comment = "Comment",
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

export function htmlStartIndex(source: string) {
    return source.search(/^<\w+/m);
}

class Scanner {
    source = "";
    position = 0;
    tokens: Token[] = [];

    scan(source: string): Token[] {
        this.source = source;
        this.position = htmlStartIndex(source);
        if (this.position === -1) {
            return [];
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
        this.tokens.push(token);
    }

    get ultimate(): Token | undefined {
        return this.tokens[this.tokens.length - 1];
    }

    get penultimate(): Token | undefined {
        return this.tokens[this.tokens.length - 2];
    }

    private matchNext() {
        this.matchComment();
        this.matchElement();
        this.matchText();
    }

    private matchElement() {
        if (this.peekString("</") || !this.matchCharacterType(TokenType.OpenAngleBracket, "<")) {
            return;
        }
        if (!this.matchTagName()) {
            this.error("Expected tag name");
        }
        const tag = this.ultimate!.value;
        this.matchWhitespace();
        this.matchAttributes();
        let selfClosing = false;
        if (this.matchCharacterType(TokenType.Slash, "/")) {
            selfClosing = true;
        }
        if (!this.matchCharacterType(TokenType.CloseAngleBracket, ">")) {
            this.error("Expected closing brace");
        }
        if (htmlVoidTags.includes(tag) || selfClosing) {
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
            this.matchTagName() &&
            this.ultimate!.value === tag &&
            this.matchCharacterType(TokenType.CloseAngleBracket, ">")
        );
    }

    private matchTagName() {
        const position = this.position;
        const match = this.source.slice(this.position).match(/^[a-z][a-z0-9]*(-[a-z]+)*/);
        if (match) {
            this.position += match[0].length;
            this.token(TokenType.TagName, position);
            return true;
        }
    }

    private matchAttributes() {
        while (!this.peekAnyCharacter("/>")) {
            this.matchAttribute();
            this.matchWhitespace();
        }
    }

    private matchAttribute() {
        if (!this.matchAttributeName()) {
            this.error("Expected attribute name");
        }
        if (!this.matchCharacterType(TokenType.Equal, "=")) {
            return;
        }
        if (!this.matchAttributeValue()) {
            this.error("Expected attribute value");
        }
    }

    private matchAttributeName() {
        const position = this.position;
        const match = this.source.slice(this.position).match(/^[a-z]+((:|::|-)[a-z]+)*/);
        if (match) {
            this.position += match[0].length;
            this.token(TokenType.AttributeName, position);
            return true;
        }
    }

    private matchAttributeValue() {
        if (this.matchExpression()) {
            return true;
        }
        if (!this.peekAnyCharacter('"')) {
            return;
        }
        this.position++;
        const position = this.position;
        this.matchAttributeText();
        if (!this.peekAnyCharacter('"')) {
            this.error("Expected closing quote");
            return;
        }
        this.position++;
        return true;
    }

    private matchAttributeText(): true | undefined {
        const position = this.position;
        while (!this.peekAnyCharacter('{"') && this.position < this.source.length) {
            this.position++;
        }
        if (position !== this.position) {
            this.token(TokenType.Text, position);
        }
        if (this.peekAnyCharacter("{")) {
            this.matchExpression();
            return this.matchAttributeText();
        }
        if (position === this.position) {
            return;
        }
        return true;
    }

    private matchContent() {
        while (this.position < this.source.length && !this.peekString("</")) {
            if (this.penultimate?.value === "code") {
                this.matchCodeText();
            }
            this.matchComment();
            this.matchText();
            this.matchElement();
        }
    }

    private matchText(): true | undefined {
        const position = this.position;
        while (!this.peekAnyCharacter("{<") && this.position < this.source.length) {
            this.position++;
        }
        if (position !== this.position) {
            this.token(TokenType.Text, position);
        }
        if (this.peekAnyCharacter("{")) {
            this.matchExpression();
            return this.matchText();
        }
        if (this.peekAnyCharacter("<") && !this.peekString("</")) {
            this.matchComment();
            this.matchElement();
            return this.matchText();
        }
        if (position === this.position) {
            return;
        }
        return true;
    }

    private matchCodeText(): true | undefined {
        const position = this.position;
        while (!this.peekString("</code>") && this.position < this.source.length) {
            this.position++;
        }
        if (position === this.position) {
            return;
        }
        this.token(TokenType.Text, position);
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

    private matchComment() {
        const position = this.position;
        if (!this.peekString("<!--")) {
            return;
        }
        this.position += 4;
        while (!this.peekString("-->")) {
            this.position++;
        }
        this.position += 3;
        this.token(TokenType.Comment, position);
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

    private peekAnyCharacter(chars: string) {
        if (chars.split("").includes(this.source[this.position])) {
            return this.source[this.position];
        }
    }

    private peekString(str: string) {
        return this.source.slice(this.position, this.position + str.length) === str;
    }

    private error(message: string) {
        const line = this.source.slice(0, this.position).split("\n").length;
        const column = this.position - this.source.lastIndexOf("\n", this.position);
        throw new Error(`Syntax Error: ${message} at line ${line}, column ${column}: ${this.source[this.position]}\n`);
    }
}
