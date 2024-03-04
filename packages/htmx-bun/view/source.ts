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

/**
 * The Source class is responsible for reading an htmx-bun partial `.part` file,
 * disentangling into script and html parts, and returning the source code that
 * will be resolved by the loader in `./plugin.ts`.
 */
export class Source {
    #html!: HtmlFragment;
    #code!: ts.SourceFile;
    #attributes?: ts.InterfaceDeclaration;
    #expressionIndex = 0;

    /**
     * Creates a new instance of the Source class.
     * @param path The path of the source.
     */
    constructor(public path: string) {}

    /**
     * This function encapsulates all the steps
     * for turning raw `.part` source code into TypeScript that will then be loaded
     * as a module by the loader in `./plugin.ts`.
     * @returns The TypeScript source code for the partial.
     */
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

    /**
     * Returns the serialized HTML
     * @returns The serialized HTML.
     */
    private async html() {
        return await printHtmlSyntaxTree(this.#html);
    }

    /**
     * Returns the TypeScript code, minus a few items.
     * @returns The TypeScript code.
     */
    private async code() {
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

    /**
     * Splits the source text in half, parses the HTML, walks the HTML tree looking for expressions,
     * replacing them with generated identifiers, and creates functions to later retrieve their values,
     * for interpolation.
     * @param text - The text to be disentangled.
     * @returns void
     */
    private async disentangle(text: string) {
        const beginHtml = text.search(/^<!?\w+/m);
        const code: string[] = [text.slice(0, beginHtml)];
        this.#html = parseHtml(text.slice(beginHtml));
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

    /**
     * Seeks expressions in the given text and generates functions to later interpolate
     * runtime values.
     *
     * @param code - The array to store the generated code.
     * @param text - The text to search for expressions.
     * @returns The modified text with expressions replaced by generated identifier.
     */
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

    /**
     * Transforms the given expression by replacing identifiers with property access expressions
     * that access the "env" object.  The interpolation functions generated in `matchExpressions`
     * take and `env` object, that is the scope of the partial code.  So we amend the expressions to
     * access the `env` object.
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

/**
 * Represents an attribute for a partia/tag.
 */
export interface Attribute {
    name: string;
    type: string;
}

export type Attributes = Attribute[];
