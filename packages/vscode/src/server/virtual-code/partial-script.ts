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
        const htmlAdditions = redactHtml(text);
        text = text.slice(0, htmlIndex);
        const codeAdditions = generateCodeAdditions(text);
        text = `${codeAdditions.prefix}${htmlAdditions.prefix}${text}${htmlAdditions.suffix}${codeAdditions.suffix};`;
        this.snapshot = {
            getText: (start, end) => text.slice(start, end),
            getLength: () => text.length,
            getChangeRange: () => undefined,
        };
        this.mappings = [
            {
                sourceOffsets: [0],
                generatedOffsets: [
                    codeAdditions.prefix.length + htmlAdditions.prefix.length,
                ],
                lengths: [text.length],
                data: {
                    completion: true,
                    format: true,
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
        import { Context as ServerContext } from "htmx-bun/server/context";
        const Context = {} as ServerContext;
    `);

    prefix.push(`
        const Attributes = {} as Attributes;
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
            suffix.push(" ".repeat(token.value.length));
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
