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
    htmlVoidTags,
    orderedFlatChildren,
    orderedFlatNodeChildren,
    parse,
    visit,
    visitEach,
} from "../../template";

export class PartialScriptVirtualCode implements VirtualCode {
    languageId = "typescript";
    snapshot: IScriptSnapshot;
    mappings: CodeMapping[];
    embeddedCodes = [];

    constructor(
        public id: string,
        text: string,
    ) {
        const segments: Segment<CodeInformation>[] = [];
        const htmlIndex = text.search(/^<\w+/m);
        let htmlAdditions = { prefix: "", suffix: "" };
        try {
            htmlAdditions = redactHtml(text.slice(htmlIndex));
        } catch (e) {
            console.log(e);
        }
        text = text.slice(0, htmlIndex);
        let codeAdditions = { prefix: "", suffix: "" };
        try {
            codeAdditions = generateCodeAdditions(text);
        } catch (e) {}
        const prefix = (codeAdditions.prefix + htmlAdditions.prefix)
            .split("\n")
            .map((it) => it.trim())
            .join("\n");
        segments.push(prefix);
        const features = {
            verification: true,
            completion: true,
            semantic: true,
            navigation: true,
            structure: true,
            format: false,
        };
        const suffix = htmlAdditions.suffix + codeAdditions.suffix;
        segments.push([text, undefined, 0, features]);
        segments.push([suffix, undefined, text.length, features]);
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
    const prefix: string[] = [];
    const suffix: string[] = [];

    prefix.push(`
        import { Context } from "@niarada/remedy/server/context";
        const $context = {} as Context<Attributes>;
    `);

    const transformer: ts.TransformerFactory<ts.SourceFile> = (context) => {
        return (root) => {
            const visit: ts.Visitor = (node) => {
                ts.visitEachChild(node, visit, context);
                if (
                    ts.isPropertySignature(node) &&
                    ts.isInterfaceDeclaration(node.parent) &&
                    node.parent.name.text === "Attributes"
                ) {
                    prefix.push(`const ${node.name.getText()} = $context.attributes.${node.name.getText()};\n`);
                }
                return node;
            };
            ts.visitNode(root, visit);
            return root;
        };
    };
    ts.transform(ts.createSourceFile("", text, ts.ScriptTarget.Latest, true), [transformer]);
    return {
        prefix: prefix.join(""),
        suffix: suffix.join(""),
    };
}

function redactHtml(source: string) {
    const prefix: string[] = [];
    const suffix: string[] = [];
    const { document, errors } = parse(source);
    const visitor = new RedactVisitor();
    visitor.visit(document);
    return {
        prefix: prefix.join(""),
        suffix: visitor.output,
    };
}

class RedactVisitor extends BaseTemplateVisitorWithDefaults {
    #output: string[] = [];

    constructor() {
        super();
        this.validateVisitor();
    }

    pushSpaces(text: string, space = " ") {
        this.#output.push(text.replace(/\S/g, space));
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
        const tagStart = context.tagStart[0];
        const tagStartIdentifier = getTokenImage(tagStart, "Identifier");
        const tagEnd = context.tagEnd?.[0];
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
            this.#output.push(whitespace.image);
        }
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
        this.#output.push(getTokenImage(context, "WhiteSpace"));
        this.pushSpaces(getTokenImage(context, "Identifier"));
        this.pushSpaces(getTokenImage(context, "Equals"));
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
        this.pushSpaces(open.image);
        const children = orderedFlatChildren(context);
        children.shift();
        children.pop();
        for (const child of children) {
            if ((child as IToken).image) {
                this.pushSpaces((child as IToken).image);
            } else {
                visit(this, child as CstNode);
            }
        }
        this.pushSpaces(close.image);
    }

    expression(context: CstChildrenDictionary) {
        const tokens = getTokens(context, "ExpressionPart");
        tokens.shift();
        tokens.pop();
        for (const part of tokens) {
            this.#output.push(" ");
            this.#output.push(part.image);
            this.#output.push(";");
        }
    }

    text(context: Record<string, IToken[]>) {
        this.pushSpaces(context.Text[0].image);
    }

    get output() {
        return this.#output.join("");
    }
}
