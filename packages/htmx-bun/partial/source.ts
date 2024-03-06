import * as ts from "typescript";
import { HtmlFragment } from "./ast";
import { parsePartial } from "./parser";
import { printHtml } from "./printer";
import { htmlStartIndex } from "./scanner";
import { walkHtml } from "./transform";

/**
 * Represents an attribute for a partia/tag.
 */
export interface Attribute {
    name: string;
    type: string;
}

export type Attributes = Attribute[];

/**
 * The Source class is responsible for reading an htmx-bun partial `.part` file,
 * disentangling into script and html parts, and returning the source code that
 * will be resolved by the loader in `plugins/partial.ts`.
 */
export class Source {
    #text!: string;
    #html!: HtmlFragment;
    #code!: ts.SourceFile;
    #attributes?: ts.InterfaceDeclaration;

    /**
     * Creates a new instance of the Source class from a string.
     * @param path The path of the source.
     */
    constructor(text: string) {
        this.#text = text;
    }

    /**
     * Creates a new instance of the Source class from a path.
     * @param path The path of the source.
     */
    static async fromPath(path: string) {
        return new Source(await Bun.file(path).text());
    }

    /**
     * Compile the partial source into TypeScript that can be loaded as a module by the loader plugin.
     * @returns The TypeScript source code for the partial.
     */
    async compile() {
        const code: string[] = [
            this.#text.slice(0, htmlStartIndex(this.#text)),
        ];
        this.#html = parsePartial(this.#text);
        this.#code = ts.createSourceFile(
            "",
            code.join("\n"),
            ts.ScriptTarget.Latest,
            true,
        );
        this.transformExpressions();
        this.transformCode();
        return [
            `export const attributes = ${JSON.stringify(this.attributes)};`,
            `export const html = \`${this.html}\`;`,
            "",
            this.code,
        ].join("\n");
    }

    /**
     * Prints the internalathe serialized HTML
     * @returns The serialized HTML.
     */
    private get html() {
        return printHtml(this.#html);
    }

    /**
     * Prints the internal TypeScript code.
     * @returns The TypeScript code.
     */
    private get code() {
        return ts.createPrinter().printFile(this.#code);
    }

    private get attributes() {
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

    private transformExpressions() {
        walkHtml(this.#html, (node, { visitEachChild }) => {
            if (node.type === "fragment") {
                visitEachChild(node);
                return;
            }
            if (node.type === "element") {
                for (const attr of node.attrs) {
                    for (const value of attr.value) {
                        if (value.type === "expression") {
                            value.content = this.transformExpression(
                                value.content,
                            );
                        }
                    }
                }
                visitEachChild(node);
                return;
            }
            if (node.type === "expression") {
                node.content = this.transformExpression(node.content);
                return;
            }
        });
    }

    /**
     * Re-scopes expression property accessors to an identifier which will be provided
     * at runtime.
     *
     * @param expression - The expression to transform.
     * @returns The transformed expression.
     */
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
                                context.factory.createIdentifier("$scope"),
                                node,
                            );
                        }
                        if (ts.isPropertyAccessExpression(node.parent)) {
                            if (node.parent.expression === node) {
                                return context.factory.createPropertyAccessExpression(
                                    context.factory.createIdentifier("$scope"),
                                    node,
                                );
                            }
                        }
                        if (ts.isTypeOfExpression(node.parent)) {
                            return context.factory.createPropertyAccessExpression(
                                context.factory.createIdentifier("$scope"),
                                node,
                            );
                        }
                        if (ts.isBinaryExpression(node.parent)) {
                            return context.factory.createPropertyAccessExpression(
                                context.factory.createIdentifier("$scope"),
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

    /**
     * Final transformation of the TypeScript source, figuring out what identifiers need to be
     * pulled into the local scope, that we can then pass to the interpolation functions.
     *
     * We're also extracting out the partials Attributes interface, if it has one, so we can use
     * that information at runtime.  We also stub Attribute and Helper locals, these will be passed
     * to the function that encloses the partial code, provided to it's local namespace.
     * @private
     */
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
                            ts.factory.createToken(
                                ts.SyntaxKind.DefaultKeyword,
                            ),
                            ts.factory.createToken(ts.SyntaxKind.AsyncKeyword),
                        ],
                        undefined,
                        undefined,
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
