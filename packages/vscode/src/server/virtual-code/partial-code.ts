import {
    CodeInformation,
    CodeMapping,
    Segment,
    VirtualCode,
    buildMappings,
    toString as volarToString,
} from "@volar/language-core";
import { CstChildrenDictionary, CstNode, IToken } from "chevrotain";
import type { IScriptSnapshot } from "typescript";
import * as ts from "typescript";
import {
    BaseTemplateVisitorWithDefaults,
    getNode,
    getNodes,
    getToken,
    getTokenImage,
    getTokens,
    htmlStartIndex,
    htmlVoidTags,
    orderedFlatChildren,
    orderedFlatNodeChildren,
    parse,
    visit,
    visitEach,
} from "../../template";

const features = {
    verification: true,
    completion: true,
    semantic: true,
    navigation: true,
    structure: true,
    format: false,
};

export class PartialCodeVirtualCode implements VirtualCode {
    languageId = "typescript";
    snapshot: IScriptSnapshot;
    mappings: CodeMapping[];
    embeddedCodes = [];

    constructor(
        public id: string,
        text: string,
    ) {
        const segments: Segment<CodeInformation>[] = [];
        const htmlIndex = htmlStartIndex(text);
        const code = text.slice(0, htmlIndex);
        const html = text.slice(htmlIndex);
        let htmlAdditions = { insertions: [], body: "" };
        try {
            htmlAdditions = redactHtml(html);
        } catch (e) {
            console.log(e);
        }
        let codeAdditions = { code: "" };
        try {
            codeAdditions = generateCodeAdditions(text);
        } catch (e) {}
        segments.push(codeAdditions.code);

        const lastImportStatementIndex = code.lastIndexOf("import");
        const nextLineAfterLastImportStatementIndex = code.lastIndexOf("\n", lastImportStatementIndex) + 1;
        if (lastImportStatementIndex !== -1) {
            segments.push(code.slice(0, nextLineAfterLastImportStatementIndex));
            segments.push("function() {\n");
            segments.push(code.slice(nextLineAfterLastImportStatementIndex));
        } else {
            segments.push([code, undefined, 0, features]);
        }

        const { insertions, body } = htmlAdditions;
        let offset = 0;
        for (const insertion of insertions) {
            const chunk = body.slice(offset, insertion.offset);
            segments.push([chunk, undefined, code.length + offset, features]);
            segments.push(insertion.text);
            offset += chunk.length;
        }
        if (offset < body.length) {
            const chunk = body.slice(offset);
            segments.push([chunk, undefined, code.length + offset, features]);
        }
        segments.push("}\n");

        const generated = volarToString(segments);
        this.snapshot = {
            getText: (start, end) => generated.slice(start, end),
            getLength: () => generated.length,
            getChangeRange: () => undefined,
        };
        this.mappings = buildMappings(segments);
    }
}

function generateCodeAdditions(text) {
    const code: string[] = [
        `import { Context } from "@niarada/remedy/server/context";\n`,
        "const $context = {} as Context<Attributes>;\n",
    ];

    const transformer: ts.TransformerFactory<ts.SourceFile> = (context) => {
        return (root) => {
            const visit: ts.Visitor = (node) => {
                ts.visitEachChild(node, visit, context);
                if (
                    ts.isPropertySignature(node) &&
                    ts.isInterfaceDeclaration(node.parent) &&
                    node.parent.name.text === "Attributes"
                ) {
                    code.push(`const ${node.name.getText()} = $context.attributes.${node.name.getText()};\n`);
                }
                return node;
            };
            ts.visitNode(root, visit);
            return root;
        };
    };
    ts.transform(ts.createSourceFile("", text, ts.ScriptTarget.Latest, true), [transformer]);
    return {
        code: code.join(""),
    };
}

function redactHtml(source: string) {
    const { document, errors } = parse(source);
    const visitor = new RedactVisitor();
    visitor.visit(document);
    return {
        insertions: visitor.insertions,
        body: visitor.body,
    };
}

interface Insertion {
    offset: number;
    text: string;
}

class RedactVisitor extends BaseTemplateVisitorWithDefaults {
    insertions: Insertion[] = [];
    #body: string[] = [];

    lastAs?: string;
    lastEach?: string;
    lastExpression?: string;
    lastAttributeExpression?: string;
    lastAttributeString?: string;

    constructor() {
        super();
        this.validateVisitor();
    }

    pushSpaces(text: string, space = " ") {
        this.#body.push(text.replace(/\S/g, space));
    }

    document(context: CstChildrenDictionary) {
        visit(this, context.fragment);
    }

    fragment(context: CstChildrenDictionary) {
        visitEach(this, orderedFlatNodeChildren(context));
    }

    comment(context: CstChildrenDictionary) {
        this.pushSpaces(getTokenImage(context, "Comment")!);
    }

    element(context: CstChildrenDictionary) {
        const tagStart = getNode(context, "tagStart");
        const tagStartIdentifier = getTokenImage(tagStart, "Identifier");
        const tagEnd = getNode(context, "tagEnd");
        const tagEndIdentifier = tagEnd && getTokenImage(tagEnd, "Identifier");
        if (getToken(tagStart, "Slash") && tagEnd) {
            console.error(`Unexpected closing tag: ${tagEndIdentifier}`);
        }
        this.pushSpaces(`<${tagStartIdentifier}`);
        for (const attribute of getNodes(tagStart, "attribute")) {
            this.visit(attribute as CstNode);
        }
        const whitespace = getToken(tagStart, "WhiteSpace");
        if (whitespace) {
            this.#body.push(whitespace.image);
        }
        if (this.lastEach && this.lastAs) {
            this.insertions.push({
                offset: tagStart.location.startOffset,
                text: `{const ${this.lastAs} = ${this.lastEach.slice(1, -1)}[0];`,
            });
            if (tagEnd) {
                this.insertions.push({ offset: tagEnd.location.endOffset, text: "}" });
            } else {
                const token = getToken(context, "CloseAngleBracket");
                this.insertions.push({ offset: token.endOffset, text: "}" });
            }
        }
        this.lastEach = undefined;
        this.lastAs = undefined;
        if (getToken(tagStart, "Slash")) {
            this.pushSpaces("/>");
        } else if (htmlVoidTags.includes(tagStartIdentifier)) {
            this.pushSpaces(">");
        } else {
            this.pushSpaces(">");
            if (context.fragment) {
                this.visit(context.fragment as CstNode[]);
            }
            this.pushSpaces(`</${tagEndIdentifier}>`);
        }
    }

    attribute(context: CstChildrenDictionary) {
        const identifier = getTokenImage(context, "Identifier");
        this.#body.push(getTokenImage(context, "WhiteSpace"));
        this.pushSpaces(identifier);
        const token = getToken(context, "Equals");
        if (token) {
            this.pushSpaces(token.image);
        }
        visit(this, context.attributeValue);
        if (identifier === "mx-each") {
            this.lastEach = this.lastExpression;
        }
        if (identifier === "mx-as") {
            this.lastAs = this.lastAttributeString;
        }
    }

    attributeValue(context: CstChildrenDictionary) {
        const open =
            getToken(context, "OpenSingleQuote") ||
            getToken(context, "OpenDoubleQuote") ||
            getToken(context, "OpenBacktickQuote");
        if (!open) {
            const expression = getNode(context, "expression");
            visit(this, expression);
            this.lastAttributeExpression = this.lastExpression;
            return;
        }
        const close =
            getToken(context, "CloseSingleQuote") ||
            getToken(context, "CloseDoubleQuote") ||
            getToken(context, "CloseBacktickQuote");
        this.pushSpaces(open.image);
        const children = orderedFlatChildren(context);
        children.shift();
        children.pop();
        let value = "";
        for (const child of children) {
            const image = (child as IToken).image;
            if (image) {
                this.pushSpaces(image);
                value += image;
            } else {
                visit(this, child as CstNode);
                value += this.lastExpression;
            }
        }
        this.lastAttributeString = value;
        this.pushSpaces(close.image);
    }

    expression(context: CstChildrenDictionary) {
        const tokens = getTokens(context, "ExpressionPart");
        tokens.shift();
        tokens.pop();
        for (const part of tokens) {
            this.#body.push(" ");
            this.#body.push(part.image);
            this.lastExpression = `{${part.image}}`;
            this.#body.push(";");
        }
    }

    text(context: Record<string, IToken[]>) {
        this.pushSpaces(context.Text[0].image);
    }

    get prefix() {
        return this.insertions.join("");
    }

    get body() {
        return this.#body.join("");
    }
}
