import { describe, expect, it } from "bun:test";
import {
    AttributeName,
    CloseDoubleQuote,
    CloseSingleQuote,
    Comment,
    DoubleQuoteText,
    Equals,
    ExpressionEnd,
    ExpressionStart,
    ExpressionText,
    OpaqueTagEnd,
    OpaqueTagStart,
    OpaqueTagStartClose,
    OpaqueTagStartSelfClose,
    OpaqueText,
    OpenDoubleQuote,
    OpenSingleQuote,
    SingleQuoteText,
    TagEnd,
    TagStart,
    TagStartClose,
    TagStartSelfClose,
    Text,
    WhiteSpace,
    lex,
} from "./lexer";

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
        expect(tokens.map((t) => [t.tokenType, t.image])).toEqual([
            [TagStart, "<div"],
            [TagStartClose, ">"],
            [TagEnd, "</div>"],
        ]);
    });

    it("should lex simple HTML tags with digits in them", () => {
        const { tokens } = lex("<h1></h1>");
        expect(tokens.map((t) => [t.tokenType, t.image])).toEqual([
            [TagStart, "<h1"],
            [TagStartClose, ">"],
            [TagEnd, "</h1>"],
        ]);
    });

    it("should lex HTML tags with attributes", () => {
        const { tokens } = lex('<div class="test" id="main"></div>');
        expect(tokens.map((t) => [t.tokenType, t.image])).toEqual([
            [TagStart, "<div"],
            [WhiteSpace, " "],
            [AttributeName, "class"],
            [Equals, "="],
            [OpenDoubleQuote, '"'],
            [DoubleQuoteText, "test"],
            [CloseDoubleQuote, '"'],
            [WhiteSpace, " "],
            [AttributeName, "id"],
            [Equals, "="],
            [OpenDoubleQuote, '"'],
            [DoubleQuoteText, "main"],
            [CloseDoubleQuote, '"'],
            [TagStartClose, ">"],
            [TagEnd, "</div>"],
        ]);
    });

    it("should lex self-closing tags", () => {
        const { tokens } = lex("<img src='test.jpg' />");
        expect(tokens.map((t) => [t.tokenType, t.image])).toEqual([
            [TagStart, "<img"],
            [WhiteSpace, " "],
            [AttributeName, "src"],
            [Equals, "="],
            [OpenSingleQuote, "'"],
            [SingleQuoteText, "test.jpg"],
            [CloseSingleQuote, "'"],
            [WhiteSpace, " "],
            [TagStartSelfClose, "/>"],
        ]);
    });

    it("should lex comments", () => {
        const { tokens } = lex("<!-- This is a comment -->");
        expect(tokens.map((t) => [t.tokenType, t.image])).toEqual([[Comment, "<!-- This is a comment -->"]]);
    });

    it("should lex nested HTML tags", () => {
        const { tokens } = lex("<div><span>Content</span></div>");
        expect(tokens.map((t) => [t.tokenType, t.image])).toEqual([
            [TagStart, "<div"],
            [TagStartClose, ">"],
            [TagStart, "<span"],
            [TagStartClose, ">"],
            [Text, "Content"],
            [TagEnd, "</span>"],
            [TagEnd, "</div>"],
        ]);
    });

    it("should lex HTML with comments", () => {
        const { tokens } = lex("<div><!-- Comment --><span>Content</span></div>");
        expect(tokens.map((t) => [t.tokenType, t.image])).toEqual([
            [TagStart, "<div"],
            [TagStartClose, ">"],
            [Comment, "<!-- Comment -->"],
            [TagStart, "<span"],
            [TagStartClose, ">"],
            [Text, "Content"],
            [TagEnd, "</span>"],
            [TagEnd, "</div>"],
        ]);
    });

    it("should lex text nodes", () => {
        const { tokens } = lex("<div>Hello, World!</div>");
        expect(tokens.map((t) => [t.tokenType, t.image])).toEqual([
            [TagStart, "<div"],
            [TagStartClose, ">"],
            [Text, "Hello, World!"],
            [TagEnd, "</div>"],
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
        expect(tokens.map((t) => [t.tokenType, t.image])).toEqual([
            [Text, "\n            "],
            [TagStart, "<html"],
            [TagStartClose, ">"],
            [Text, "\n            "],
            [TagStart, "<head"],
            [TagStartClose, ">"],
            [Text, "\n                "],
            [TagStart, "<title"],
            [TagStartClose, ">"],
            [Text, "Page Title"],
            [TagEnd, "</title>"],
            [Text, "\n            "],
            [TagEnd, "</head>"],
            [Text, "\n            "],
            [TagStart, "<body"],
            [TagStartClose, ">"],
            [Text, "\n                "],
            [TagStart, "<h1"],
            [TagStartClose, ">"],
            [Text, "This is a Heading"],
            [TagEnd, "</h1>"],
            [Text, "\n                "],
            [TagStart, "<p"],
            [TagStartClose, ">"],
            [Text, "This is a paragraph."],
            [TagEnd, "</p>"],
            [Text, "\n                "],
            [TagStart, "<a"],
            [WhiteSpace, " "],
            [AttributeName, "href"],
            [Equals, "="],
            [OpenDoubleQuote, '"'],
            [DoubleQuoteText, "#"],
            [CloseDoubleQuote, '"'],
            [TagStartClose, ">"],
            [Text, "This is a link"],
            [TagEnd, "</a>"],
            [Text, "\n            "],
            [TagEnd, "</body>"],
            [Text, "\n            "],
            [TagEnd, "</html>"],
            [Text, "\n        "],
        ]);
    });

    it("should lex expression in attributes", () => {
        // XXX: This will not parse, however.
        const { tokens } = lex("<div {expression}></div>");
        expect(tokens.map((t) => [t.tokenType, t.image])).toEqual([
            [TagStart, "<div"],
            [WhiteSpace, " "],
            [ExpressionStart, "{"],
            [ExpressionText, "expression"],
            [ExpressionEnd, "}"],
            [TagStartClose, ">"],
            [TagEnd, "</div>"],
        ]);
    });

    it("should lex expression within attribute value", () => {
        const { tokens } = lex('<a href="url/{expression}/page"></a>');
        expect(tokens.map((t) => [t.tokenType, t.image])).toEqual([
            [TagStart, "<a"],
            [WhiteSpace, " "],
            [AttributeName, "href"],
            [Equals, "="],
            [OpenDoubleQuote, '"'],
            [DoubleQuoteText, "url/"],
            [ExpressionStart, "{"],
            [ExpressionText, "expression"],
            [ExpressionEnd, "}"],
            [DoubleQuoteText, "/page"],
            [CloseDoubleQuote, '"'],
            [TagStartClose, ">"],
            [TagEnd, "</a>"],
        ]);
    });

    it("should lex expression in text content", () => {
        const { tokens } = lex("<p>Text before {expression} text after</p>");
        expect(tokens.map((t) => [t.tokenType, t.image])).toEqual([
            [TagStart, "<p"],
            [TagStartClose, ">"],
            [Text, "Text before "],
            [ExpressionStart, "{"],
            [ExpressionText, "expression"],
            [ExpressionEnd, "}"],
            [Text, " text after"],
            [TagEnd, "</p>"],
        ]);
    });

    it("should lex multiple expressions in different positions", () => {
        const { tokens } = lex('<div id={id} class="{class}">Text {expression} more text</div>');
        expect(tokens.map((t) => [t.tokenType, t.image])).toEqual([
            [TagStart, "<div"],
            [WhiteSpace, " "],
            [AttributeName, "id"],
            [Equals, "="],
            [ExpressionStart, "{"],
            [ExpressionText, "id"],
            [ExpressionEnd, "}"],
            [WhiteSpace, " "],
            [AttributeName, "class"],
            [Equals, "="],
            [OpenDoubleQuote, '"'],
            [ExpressionStart, "{"],
            [ExpressionText, "class"],
            [ExpressionEnd, "}"],
            [CloseDoubleQuote, '"'],
            [TagStartClose, ">"],
            [Text, "Text "],
            [ExpressionStart, "{"],
            [ExpressionText, "expression"],
            [ExpressionEnd, "}"],
            [Text, " more text"],
            [TagEnd, "</div>"],
        ]);
    });

    it("should lex nested expressions", () => {
        const { tokens } = lex("<p>{{ a: 1, b: (x: number) => { return x; }}['b']()}</p>");
        expect(tokens.map((t) => [t.tokenType, t.image])).toEqual([
            [TagStart, "<p"],
            [TagStartClose, ">"],
            [ExpressionStart, "{"],
            [ExpressionStart, "{"],
            [ExpressionText, " a: 1, b: (x: number) => "],
            [ExpressionStart, "{"],
            [ExpressionText, " return x; "],
            [ExpressionEnd, "}"],
            [ExpressionEnd, "}"],
            [ExpressionText, "['b']()"],
            [ExpressionEnd, "}"],
            [TagEnd, "</p>"],
        ]);
    });

    it("should lex code blocks", () => {
        const { tokens } = lex("<code>{code}</code>");
        expect(tokens.map((t) => [t.tokenType, t.image])).toEqual([
            [OpaqueTagStart, "<code"],
            [OpaqueTagStartClose, ">"],
            [OpaqueText, "{code}"],
            [OpaqueTagEnd, "</code>"],
        ]);
    });

    it("should lex newlines in code blocks", () => {
        const { tokens } = lex(`
            <pre><code>bunx @niarada/remedy
            </code></pre>
        `);
        expect(tokens.map((t) => [t.tokenType, t.image])).toEqual([
            [Text, "\n            "],
            [TagStart, "<pre"],
            [TagStartClose, ">"],
            [OpaqueTagStart, "<code"],
            [OpaqueTagStartClose, ">"],
            [OpaqueText, "bunx @niarada/remedy\n            "],
            [OpaqueTagEnd, "</code>"],
            [TagEnd, "</pre>"],
            [Text, "\n        "],
        ]);
    });

    it("should lex script blocks", () => {
        const { tokens } = lex("<script>function foo() {}</script>");
        expect(tokens.map((t) => [t.tokenType, t.image])).toEqual([
            [OpaqueTagStart, "<script"],
            [OpaqueTagStartClose, ">"],
            [OpaqueText, "function foo() {}"],
            [OpaqueTagEnd, "</script>"],
        ]);
    });

    it("should lex script with attribute", () => {
        const { tokens } = lex(`<script src="foo.js" />`);
        expect(tokens.map((t) => [t.tokenType, t.image])).toEqual([
            [OpaqueTagStart, "<script"],
            [WhiteSpace, " "],
            [AttributeName, "src"],
            [Equals, "="],
            [OpenDoubleQuote, '"'],
            [DoubleQuoteText, "foo.js"],
            [CloseDoubleQuote, '"'],
            [WhiteSpace, " "],
            [OpaqueTagStartSelfClose, "/>"],
        ]);
    });

    it("should lex self-closing tag properly", () => {
        const { tokens } = lex(`
            <div>
                <slot><div /></slot>
            </div>
        `);
        expect(tokens.map((t) => [t.tokenType, t.image])).toEqual([
            [Text, "\n            "],
            [TagStart, "<div"],
            [TagStartClose, ">"],
            [Text, "\n                "],
            [TagStart, "<slot"],
            [TagStartClose, ">"],
            [TagStart, "<div"],
            [WhiteSpace, " "],
            [TagStartSelfClose, "/>"],
            [TagEnd, "</slot>"],
            [Text, "\n            "],
            [TagEnd, "</div>"],
            [Text, "\n        "],
        ]);
    });
});
