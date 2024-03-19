import { describe, expect, it } from "bun:test";
import { lex } from "./lexer";

describe("lexer", () => {
    it("should correctly lex empty document", () => {
        const { tokens } = lex("");
        expect(tokens.map((t) => t.image)).toEqual([]);
    });

    it("should lex random text", () => {
        const { tokens } = lex(`
            foobar
        `);
        expect(tokens.map((t) => [t.tokenType.name, t.image])).toEqual([["Text", "\n            foobar\n        "]]);
    });

    it("should lex simple HTML tags", () => {
        const { tokens } = lex("<div></div>");
        expect(tokens.map((t) => [t.tokenType.name, t.image])).toEqual([
            ["OpenAngleBracket", "<"],
            ["Identifier", "div"],
            ["CloseAngleBracket", ">"],
            ["OpenAngleBracketSlash", "</"],
            ["Identifier", "div"],
            ["CloseAngleBracket", ">"],
        ]);
    });

    it("should lex simple HTML tags with digits in them", () => {
        const { tokens } = lex("<h1></h1>");
        expect(tokens.map((t) => [t.tokenType.name, t.image])).toEqual([
            ["OpenAngleBracket", "<"],
            ["Identifier", "h1"],
            ["CloseAngleBracket", ">"],
            ["OpenAngleBracketSlash", "</"],
            ["Identifier", "h1"],
            ["CloseAngleBracket", ">"],
        ]);
    });

    it("should lex HTML tags with attributes", () => {
        const { tokens } = lex('<div class="test" id="main"></div>');
        expect(tokens.map((t) => [t.tokenType.name, t.image])).toEqual([
            ["OpenAngleBracket", "<"],
            ["Identifier", "div"],
            ["WhiteSpace", " "],
            ["Identifier", "class"],
            ["Equals", "="],
            ["OpenDoubleQuote", '"'],
            ["DoubleQuoteText", "test"],
            ["CloseDoubleQuote", '"'],
            ["WhiteSpace", " "],
            ["Identifier", "id"],
            ["Equals", "="],
            ["OpenDoubleQuote", '"'],
            ["DoubleQuoteText", "main"],
            ["CloseDoubleQuote", '"'],
            ["CloseAngleBracket", ">"],
            ["OpenAngleBracketSlash", "</"],
            ["Identifier", "div"],
            ["CloseAngleBracket", ">"],
        ]);
    });

    it("should lex self-closing tags", () => {
        const { tokens } = lex("<img src='test.jpg' />");
        expect(tokens.map((t) => [t.tokenType.name, t.image])).toEqual([
            ["OpenAngleBracket", "<"],
            ["Identifier", "img"],
            ["WhiteSpace", " "],
            ["Identifier", "src"],
            ["Equals", "="],
            ["OpenSingleQuote", "'"],
            ["SingleQuoteText", "test.jpg"],
            ["CloseSingleQuote", "'"],
            ["WhiteSpace", " "],
            ["Slash", "/"],
            ["CloseAngleBracket", ">"],
        ]);
    });

    it("should lex comments", () => {
        const { tokens } = lex("<!-- This is a comment -->");
        expect(tokens.map((t) => [t.tokenType.name, t.image])).toEqual([["Comment", "<!-- This is a comment -->"]]);
    });

    it("should lex nested HTML tags", () => {
        const { tokens } = lex("<div><span>Content</span></div>");
        expect(tokens.map((t) => [t.tokenType.name, t.image])).toEqual([
            ["OpenAngleBracket", "<"],
            ["Identifier", "div"],
            ["CloseAngleBracket", ">"],
            ["OpenAngleBracket", "<"],
            ["Identifier", "span"],
            ["CloseAngleBracket", ">"],
            ["Text", "Content"],
            ["OpenAngleBracketSlash", "</"],
            ["Identifier", "span"],
            ["CloseAngleBracket", ">"],
            ["OpenAngleBracketSlash", "</"],
            ["Identifier", "div"],
            ["CloseAngleBracket", ">"],
        ]);
    });

    it("should lex HTML with comments", () => {
        const { tokens } = lex("<div><!-- Comment --><span>Content</span></div>");
        expect(tokens.map((t) => [t.tokenType.name, t.image])).toEqual([
            ["OpenAngleBracket", "<"],
            ["Identifier", "div"],
            ["CloseAngleBracket", ">"],
            ["Comment", "<!-- Comment -->"],
            ["OpenAngleBracket", "<"],
            ["Identifier", "span"],
            ["CloseAngleBracket", ">"],
            ["Text", "Content"],
            ["OpenAngleBracketSlash", "</"],
            ["Identifier", "span"],
            ["CloseAngleBracket", ">"],
            ["OpenAngleBracketSlash", "</"],
            ["Identifier", "div"],
            ["CloseAngleBracket", ">"],
        ]);
    });

    it("should lex text nodes", () => {
        const { tokens } = lex("<div>Hello, World!</div>");
        expect(tokens.map((t) => [t.tokenType.name, t.image])).toEqual([
            ["OpenAngleBracket", "<"],
            ["Identifier", "div"],
            ["CloseAngleBracket", ">"],
            ["Text", "Hello, World!"],
            ["OpenAngleBracketSlash", "</"],
            ["Identifier", "div"],
            ["CloseAngleBracket", ">"],
        ]);
    });

    it("should lex complex document structure", () => {
        const { tokens } = lex(`
            <html>
            <head>
                <title>Page Title</title>
            </head>
            <body>
                <h1>This is a Heading</h1>
                <p>This is a paragraph.</p>
                <a href="#">This is a link</a>
            </body>
            </html>
        `);
        expect(tokens.map((t) => [t.tokenType.name, t.image])).toEqual([
            ["Text", "\n            "],
            ["OpenAngleBracket", "<"],
            ["Identifier", "html"],
            ["CloseAngleBracket", ">"],
            ["Text", "\n            "],
            ["OpenAngleBracket", "<"],
            ["Identifier", "head"],
            ["CloseAngleBracket", ">"],
            ["Text", "\n                "],
            ["OpenAngleBracket", "<"],
            ["Identifier", "title"],
            ["CloseAngleBracket", ">"],
            ["Text", "Page Title"],
            ["OpenAngleBracketSlash", "</"],
            ["Identifier", "title"],
            ["CloseAngleBracket", ">"],
            ["Text", "\n            "],
            ["OpenAngleBracketSlash", "</"],
            ["Identifier", "head"],
            ["CloseAngleBracket", ">"],
            ["Text", "\n            "],
            ["OpenAngleBracket", "<"],
            ["Identifier", "body"],
            ["CloseAngleBracket", ">"],
            ["Text", "\n                "],
            ["OpenAngleBracket", "<"],
            ["Identifier", "h1"],
            ["CloseAngleBracket", ">"],
            ["Text", "This is a Heading"],
            ["OpenAngleBracketSlash", "</"],
            ["Identifier", "h1"],
            ["CloseAngleBracket", ">"],
            ["Text", "\n                "],
            ["OpenAngleBracket", "<"],
            ["Identifier", "p"],
            ["CloseAngleBracket", ">"],
            ["Text", "This is a paragraph."],
            ["OpenAngleBracketSlash", "</"],
            ["Identifier", "p"],
            ["CloseAngleBracket", ">"],
            ["Text", "\n                "],
            ["OpenAngleBracket", "<"],
            ["Identifier", "a"],
            ["WhiteSpace", " "],
            ["Identifier", "href"],
            ["Equals", "="],
            ["OpenDoubleQuote", '"'],
            ["DoubleQuoteText", "#"],
            ["CloseDoubleQuote", '"'],
            ["CloseAngleBracket", ">"],
            ["Text", "This is a link"],
            ["OpenAngleBracketSlash", "</"],
            ["Identifier", "a"],
            ["CloseAngleBracket", ">"],
            ["Text", "\n            "],
            ["OpenAngleBracketSlash", "</"],
            ["Identifier", "body"],
            ["CloseAngleBracket", ">"],
            ["Text", "\n            "],
            ["OpenAngleBracketSlash", "</"],
            ["Identifier", "html"],
            ["CloseAngleBracket", ">"],
            ["Text", "\n        "],
        ]);
    });

    it("should lex expression in attributes", () => {
        // XXX: This will not parse, however.
        const { tokens } = lex("<div {expression}></div>");
        expect(tokens.map((t) => [t.tokenType.name, t.image])).toEqual([
            ["OpenAngleBracket", "<"],
            ["Identifier", "div"],
            ["WhiteSpace", " "],
            ["OpenBracket", "{"],
            ["BracketedText", "expression"],
            ["CloseBracket", "}"],
            ["CloseAngleBracket", ">"],
            ["OpenAngleBracketSlash", "</"],
            ["Identifier", "div"],
            ["CloseAngleBracket", ">"],
        ]);
    });

    it("should lex expression within attribute value", () => {
        const { tokens } = lex('<a href="url/{expression}/page"></a>');
        expect(tokens.map((t) => [t.tokenType.name, t.image])).toEqual([
            ["OpenAngleBracket", "<"],
            ["Identifier", "a"],
            ["WhiteSpace", " "],
            ["Identifier", "href"],
            ["Equals", "="],
            ["OpenDoubleQuote", '"'],
            ["DoubleQuoteText", "url/"],
            ["OpenBracket", "{"],
            ["BracketedText", "expression"],
            ["CloseBracket", "}"],
            ["DoubleQuoteText", "/page"],
            ["CloseDoubleQuote", '"'],
            ["CloseAngleBracket", ">"],
            ["OpenAngleBracketSlash", "</"],
            ["Identifier", "a"],
            ["CloseAngleBracket", ">"],
        ]);
    });

    it("should lex expression in text content", () => {
        const { tokens } = lex("<p>Text before {expression} text after</p>");
        expect(tokens.map((t) => [t.tokenType.name, t.image])).toEqual([
            ["OpenAngleBracket", "<"],
            ["Identifier", "p"],
            ["CloseAngleBracket", ">"],
            ["Text", "Text before "],
            ["OpenBracket", "{"],
            ["BracketedText", "expression"],
            ["CloseBracket", "}"],
            ["Text", " text after"],
            ["OpenAngleBracketSlash", "</"],
            ["Identifier", "p"],
            ["CloseAngleBracket", ">"],
        ]);
    });

    it("should lex multiple expressions in different positions", () => {
        const { tokens } = lex('<div id={id} class="{class}">Text {expression} more text</div>');
        expect(tokens.map((t) => [t.tokenType.name, t.image])).toEqual([
            ["OpenAngleBracket", "<"],
            ["Identifier", "div"],
            ["WhiteSpace", " "],
            ["Identifier", "id"],
            ["Equals", "="],
            ["OpenBracket", "{"],
            ["BracketedText", "id"],
            ["CloseBracket", "}"],
            ["WhiteSpace", " "],
            ["Identifier", "class"],
            ["Equals", "="],
            ["OpenDoubleQuote", '"'],
            ["OpenBracket", "{"],
            ["BracketedText", "class"],
            ["CloseBracket", "}"],
            ["CloseDoubleQuote", '"'],
            ["CloseAngleBracket", ">"],
            ["Text", "Text "],
            ["OpenBracket", "{"],
            ["BracketedText", "expression"],
            ["CloseBracket", "}"],
            ["Text", " more text"],
            ["OpenAngleBracketSlash", "</"],
            ["Identifier", "div"],
            ["CloseAngleBracket", ">"],
        ]);
    });

    it("should lex code blocks", () => {
        const { tokens } = lex("<code>{code}</code>");
        expect(tokens.map((t) => [t.tokenType.name, t.image])).toEqual([
            ["CodeStart", "<code>"],
            ["CodeText", "{code}"],
            ["CodeEnd", "</code>"],
        ]);
    });

    it("", () => {
        const { tokens } = lex(`
            <pre><code>bunx @niarada/remedy
            </code></pre>

        `);
        expect(tokens.map((t) => [t.tokenType.name, t.image])).toEqual([
            ["Text", "\n            "],
            ["OpenAngleBracket", "<"],
            ["Identifier", "pre"],
            ["CloseAngleBracket", ">"],
            ["CodeStart", "<code>"],
            ["CodeText", "bunx @niarada/remedy\n            "],
            ["CodeEnd", "</code>"],
            ["OpenAngleBracketSlash", "</"],
            ["Identifier", "pre"],
            ["CloseAngleBracket", ">"],
            ["Text", "\n\n        "],
        ]);
    });
});
