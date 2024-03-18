import { describe, expect, it } from "bun:test";
import { CstChildrenDictionary, CstNode, IToken } from "chevrotain";
import { htmlVoidTags } from ".";
import { parse } from "./parser";
import {
    BaseTemplateVisitorWithDefaults,
    getNode,
    getNodes,
    getToken,
    getTokenImage,
    getTokens,
    orderedFlatChildren,
    orderedFlatNodeChildren,
    visit,
    visitEach,
} from "./visitor";

describe("visitor", () => {
    it("should parse an empty document", () => {
        parseAndCompare("");
    });

    it("should parse a variety of simple items", () => {
        parseAndCompare(`
            foobar
            <!-- comment -->
            <div></div>
        `);
    });

    it("should parse an element with attributes", () => {
        parseAndCompare(`
            <div class="test" id="main"></div>
        `);
    });

    it("should parse self-closing elements", () => {
        parseAndCompare(`
            <div class="test" id="main" />
            <div />
            <h1/>
        `);
    });

    it("should parse nested HTML tags", () => {
        parseAndCompare("<div><span>Content</span></div>");
    });

    it("should parse HTML with comments", () => {
        parseAndCompare("<div><!-- Comment --><span>Content</span></div>");
    });

    it("should parse complex document structure", () => {
        parseAndCompare(`
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
    });

    it("should parse expression within attribute value", () => {
        parseAndCompare('<a href="url/{expression}/page"></a>');
    });

    it("should parse expression in text content", () => {
        parseAndCompare("<p>Text before {expression} text after</p>");
    });

    it("should parse multiple expressions in different positions", () => {
        parseAndCompare('<div id={id} class="{class}">Text {expression} more text</div>');
    });

    it("should parse void tags", () => {
        parseAndCompare(`
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        `);
    });
});

function parseAndCompare(source: string) {
    const { document, errors } = parse(source);
    expect(errors).toEqual([]);
    const visitor = new PrintVisitor();
    visitor.visit(document);
    expect(visitor.output).toEqual(source);
}

class PrintVisitor extends BaseTemplateVisitorWithDefaults {
    #output: string[] = [];

    constructor() {
        super();
        this.validateVisitor();
    }

    document(context: CstChildrenDictionary) {
        visit(this, context.fragment);
    }

    fragment(context: CstChildrenDictionary) {
        visitEach(this, orderedFlatNodeChildren(context));
    }

    comment(context: CstChildrenDictionary) {
        this.#output.push(getTokenImage(context, "Comment")!);
    }

    element(context: CstChildrenDictionary) {
        const tagStart = context.tagStart[0];
        const tagStartIdentifier = getTokenImage(tagStart, "Identifier");
        const tagEnd = context.tagEnd?.[0];
        const tagEndIdentifier = tagEnd && getTokenImage(tagEnd, "Identifier");
        if (getToken(tagStart, "Slash") && tagEnd) {
            console.error(`Unexpected closing tag: ${tagEndIdentifier}`);
        }
        this.#output.push(`<${tagStartIdentifier}`);
        for (const attribute of getNodes(tagStart, "attribute")) {
            this.visit(attribute as CstNode);
        }
        const whitespace = getToken(tagStart, "WhiteSpace");
        if (whitespace) {
            this.#output.push(whitespace.image);
        }
        if (getToken(tagStart, "Slash")) {
            this.#output.push("/>");
        } else if (htmlVoidTags.includes(tagStartIdentifier)) {
            this.#output.push(">");
        } else {
            this.#output.push(">");
            if (context.fragment) {
                this.visit(context.fragment as CstNode[]);
            }
            this.#output.push(`</${tagEndIdentifier}>`);
        }
    }

    attribute(context: CstChildrenDictionary) {
        this.#output.push(getTokenImage(context, "WhiteSpace")!);
        this.#output.push(getTokenImage(context, "Identifier")!);
        this.#output.push(getTokenImage(context, "Equals")!);
        visit(this, context.attributeValue);
    }

    attributeValue(context: CstChildrenDictionary) {
        const open =
            getToken(context, "OpenSingleQuote") ||
            getToken(context, "OpenDoubleQuote") ||
            getToken(context, "OpenBacktickQuote");
        if (!open) {
            const expression = getNode(context, "expression");
            visit(this, expression);
            return;
        }
        const close =
            getToken(context, "CloseSingleQuote") ||
            getToken(context, "CloseDoubleQuote") ||
            getToken(context, "CloseBacktickQuote");
        this.#output.push(open.image);
        const children = orderedFlatChildren(context);
        children.shift();
        children.pop();
        for (const child of children) {
            if ((child as IToken).image) {
                this.#output.push((child as IToken).image);
            } else {
                visit(this, child as CstNode);
            }
        }
        this.#output.push(close.image);
    }

    expression(context: CstChildrenDictionary) {
        for (const part of getTokens(context, "ExpressionPart")) {
            this.#output.push(part.image);
        }
    }

    text(context: Record<string, IToken[]>) {
        this.#output.push(context.Text[0].image);
    }

    get output() {
        return this.#output.join("");
    }
}
