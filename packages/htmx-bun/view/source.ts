import * as ts from "typescript";
import { matchRecursive } from "xregexp";
import { formatTypeScript } from "~/lib/format";
import {
    HtmlFragment,
    HtmlText,
    createHtmlFragment,
    parseHtml,
    printHtmlSyntaxTree,
    transformHtml,
} from "~/lib/html";

export class Source {
    #html!: HtmlFragment;
    #code!: ts.SourceFile;
    #attributes?: ts.InterfaceDeclaration;
    #expressionIndex = 0;

    constructor(public path: string) {}

    async compile() {
        const text = await Bun.file(this.path).text();
        await this.disentangle(text);
        this.transformCode();
        // console.log(await this.code());
        // console.log(await this.html());
        return await formatTypeScript(`
            ${await this.code()}
            export const html = ${JSON.stringify(await this.html())};
            export const code = ${JSON.stringify(await this.code())};
            export const attributes = ${JSON.stringify(this.attributes)};
        `);
    }

    async html() {
        return await printHtmlSyntaxTree(this.#html);
    }

    async code() {
        return ts.createPrinter().printFile(this.#code);
    }

    get attributes() {
        const attributes: Attributes = [];
        if (this.#attributes) {
            for (const member of this.#attributes.members) {
                if (ts.isPropertySignature(member) && member.type) {
                    attributes.push({
                        name: member.name.getText(),
                        type: member.type.getText(),
                    });
                }
            }
        }
        return attributes;
    }

    private async disentangle(text: string) {
        this.#html = parseHtml(text);
        const code: string[] = [];
        await transformHtml(this.#html, async (node, { visitEachChild }) => {
            if (node.type === "element") {
                if (node.tag === "server") {
                    code.push((node.children[0] as HtmlText).content);
                    return createHtmlFragment(node.parent);
                }
                for (const attr of node.attrs) {
                    attr.value = this.matchExpressions(code, attr.value);
                }
            } else if (node.type === "text") {
                node.content = this.matchExpressions(code, node.content);
            }
            await visitEachChild(node);
            return node;
        });
        this.#code = ts.createSourceFile(
            "",
            code.join("\n"),
            ts.ScriptTarget.Latest,
            true,
        );
    }

    private matchExpressions(code: string[], text: string) {
        for (const expression of matchRecursive(text, "\\{", "\\}", "g")) {
            const $exp = `$exp${this.#expressionIndex++}`;
            code.push(
                `const ${$exp} = (env) => (${this.transformExpression(
                    expression,
                )});`,
            );
            text = text.replace(`{${expression}}`, $exp);
        }
        return text;
    }

    private transformExpression(expression: string) {
        const source = ts.createSourceFile(
            "",
            expression,
            ts.ScriptTarget.Latest,
            true,
        );

        const transformer: ts.TransformerFactory<ts.Node> = (context) => {
            return (root) => {
                const visit: ts.Visitor = (node) => {
                    if (ts.isIdentifier(node)) {
                        if (ts.isExpressionStatement(node.parent)) {
                            return context.factory.createPropertyAccessExpression(
                                context.factory.createIdentifier("env"),
                                node,
                            );
                        }
                        if (ts.isPropertyAccessExpression(node.parent)) {
                            if (node.parent.expression === node) {
                                return context.factory.createPropertyAccessExpression(
                                    context.factory.createIdentifier("env"),
                                    node,
                                );
                            }
                        }
                        if (ts.isTypeOfExpression(node.parent)) {
                            return context.factory.createPropertyAccessExpression(
                                context.factory.createIdentifier("env"),
                                node,
                            );
                        }
                    }
                    return ts.visitEachChild(node, visit, context);
                };
                return ts.visitNode(root, visit) as ts.Node;
            };
        };

        const result = ts.transform(source, [transformer]);
        const transformed = result.transformed[0] as ts.SourceFile;
        const printer = ts.createPrinter({ omitTrailingSemicolon: true });
        return printer.printNode(
            ts.EmitHint.Unspecified,
            transformed.statements[0],
            source,
        );
    }

    private transformCode() {
        const locals: string[] = ["Helper", "Attributes"];
        const transformer: ts.TransformerFactory<ts.SourceFile> = (context) => {
            return (root) => {
                const statements: ts.Statement[] = [];
                const visit: ts.Visitor = (node) => {
                    node = ts.visitEachChild(node, visit, context);
                    if (
                        ts.isImportSpecifier(node) &&
                        node.isTypeOnly === false
                    ) {
                        locals.push(node.name.text);
                    }
                    if (ts.isImportDeclaration(node)) {
                        statements.push(node);
                        return;
                    }
                    if (
                        ts.isInterfaceDeclaration(node) &&
                        node.name.text === "Attributes"
                    ) {
                        this.#attributes = node;
                        statements.push(node);
                        return;
                    }
                    if (
                        ts.isVariableDeclaration(node) &&
                        node.parent.parent.parent === root
                    ) {
                        locals.push(node.name.getText());
                    }
                    return node;
                };
                root = ts.visitNode(root, visit) as ts.SourceFile;
                root = context.factory.updateSourceFile(root, [
                    ...statements,
                    ts.factory.createFunctionDeclaration(
                        [
                            ts.factory.createToken(ts.SyntaxKind.ExportKeyword),
                            ts.factory.createToken(ts.SyntaxKind.AsyncKeyword),
                        ],
                        undefined,
                        ts.factory.createIdentifier("$run"),
                        undefined,

                        [
                            ts.factory.createParameterDeclaration(
                                undefined,
                                undefined,
                                ts.factory.createIdentifier("Helper"),
                                undefined,
                                ts.factory.createTypeReferenceNode(
                                    ts.factory.createIdentifier("Helper"),
                                    undefined,
                                ),
                                undefined,
                            ),
                            ts.factory.createParameterDeclaration(
                                undefined,
                                undefined,
                                ts.factory.createIdentifier("Attributes"),
                                undefined,
                                ts.factory.createTypeReferenceNode(
                                    ts.factory.createIdentifier("Attributes"),
                                    undefined,
                                ),
                                undefined,
                            ),
                        ],
                        undefined,
                        ts.factory.createBlock(
                            [
                                ...root.statements,
                                ts.factory.createReturnStatement(
                                    ts.factory.createObjectLiteralExpression(
                                        locals.map((name) =>
                                            ts.factory.createShorthandPropertyAssignment(
                                                ts.factory.createIdentifier(
                                                    name,
                                                ),
                                            ),
                                        ),
                                        false,
                                    ),
                                ),
                            ],
                            true,
                        ),
                    ),
                ]);
                return root;
            };
        };
        const result = ts.transform(this.#code, [transformer]);
        this.#code = result.transformed[0];
    }
}

export interface Attribute {
    name: string;
    type: string;
}

export type Attributes = Attribute[];
