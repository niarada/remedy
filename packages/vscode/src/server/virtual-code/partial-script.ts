import type { CodeMapping, VirtualCode } from "@volar/language-core";
import type { IScriptSnapshot } from "typescript";
import * as ts from "typescript";
import { TokenType, htmlStartIndex, scanPartial } from "../template/scanner";

export class PartialScriptVirtualCode implements VirtualCode {
    languageId = "typescript";
    snapshot: IScriptSnapshot;
    mappings: CodeMapping[];
    embeddedCodes = [];

    constructor(
        public id: string,
        text: string,
    ) {
        const htmlIndex = htmlStartIndex(text);
        let htmlAdditions = { prefix: "", suffix: "" };
        try {
            htmlAdditions = redactHtml(text);
        } catch (e) {}
        text = text.slice(0, htmlIndex);
        let codeAdditions = { prefix: "", suffix: "" };
        try {
            codeAdditions = generateCodeAdditions(text);
        } catch (e) {}
        const prefix = codeAdditions.prefix + htmlAdditions.prefix;
        const suffix = htmlAdditions.suffix + codeAdditions.suffix;
        const full = `${prefix}${text}${suffix}`;
        this.snapshot = {
            getText: (start, end) => full.slice(start, end),
            getLength: () => full.length,
            getChangeRange: () => undefined,
        };
        this.mappings = [
            {
                sourceOffsets: [0],
                generatedOffsets: [prefix.length],
                lengths: [full.length],
                data: {
                    completion: true,
                    format: false,
                    navigation: true,
                    semantic: true,
                    structure: true,
                    verification: true,
                },
            },
        ];
    }
}

function generateCodeAdditions(text) {
    const prefix: string[] = [];
    const suffix: string[] = [];

    prefix.push(`
        import { Context } from "htmx-bun/server/context";
        const $context = {} as Context<Attributes>;
    `);

    const transformer: ts.TransformerFactory<ts.SourceFile> = (context) => {
        return (root) => {
            const visit: ts.Visitor = (node) => {
                // console.log("VISIT", ts.SyntaxKind[node.kind]);
                ts.visitEachChild(node, visit, context);
                // if (
                //     ts.isPropertySignature(node) &&
                //     ts.isInterfaceDeclaration(node.parent) &&
                //     node.parent.name.text === "Attributes"
                // ) {
                //     console.log(
                //         "Attribute",
                //         node.name.getText(),
                //         node.type?.getText(),
                //     );
                // }
                // if (
                //     ts.isVariableDeclaration(node) &&
                //     node.parent.parent.parent === root
                // ) {
                //     suffix.push(`${node.name.getText()};\n`);
                // }
                return node;
            };
            ts.visitNode(root, visit);
            return root;
        };
    };
    ts.transform(ts.createSourceFile("", text, ts.ScriptTarget.Latest, true), [
        transformer,
    ]);
    return {
        prefix: prefix.join(""),
        suffix: suffix.join(""),
    };
}

function redactHtml(html: string) {
    const prefix: string[] = [];
    const suffix: string[] = [];
    const tokens = scanPartial(html);
    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        if (token.type === TokenType.Whitespace) {
            // suffix.push(" ".repeat(token.value.length));
            suffix.push(token.value);
            continue;
        }
        if (token.type === TokenType.Text) {
            if (tokens[i - 1]?.type === TokenType.Equal) {
                suffix.push(" ".repeat(token.value.length + 2));
            } else {
                suffix.push(token.value.replace(/[^\n]/g, " "));
            }

            continue;
        }
        if (token.type === TokenType.Expression) {
            suffix.push(` ${token.value.slice(1, -1)};`);
            continue;
        }
        suffix.push(" ".repeat(token.value.length));
    }
    return {
        prefix: prefix.join(""),
        suffix: suffix.join(""),
    };
}
