import { error, HtmlFragment, htmlStartIndex, parseSource, printHtml, Source, transformHtml } from "@niarada/remedy";
import * as ts from "typescript";

/**
 * A `.part` source file composed of an upper code section (action) and
 * a subsequent html section (template).  Both are optional.
 */
export class TemplateSource extends Source {
    #template!: HtmlFragment;
    #action!: ts.SourceFile;
    #attributes: Record<string, ts.TypeNode> = {};
    #locals: string[] = ["$context"];

    /**
     * Compile the partial source into TypeScript that can be loaded as a module by the loader plugin.
     * @returns The TypeScript source code for the partial.
     */
    compile() {
        // XXX: We will do this elsewhere
        // Parse route params (i.e. [id]) out of the path into locals
        // this.#locals.push(...(this.path?.match(/(?<=\[).+?(?=\])/g) || []));
        const htmlIndex = htmlStartIndex(this.text);
        const { ast, errors } = parseSource(this.text, {}, this.path);
        if (errors.length) {
            error("partial", `failed to parse '${this.path}'`);
            error("partial", errors[0].message);
            error(
                "partial",
                `  on line ${
                    errors[0].token.startLine! + (this.text.slice(0, htmlIndex).match(/\n/g)?.length ?? 0)
                } at column ${errors[0].token.startColumn}`,
            );
        }
        this.#template = ast;
        this.#action = ts.createSourceFile("", this.text.slice(0, htmlIndex), ts.ScriptTarget.Latest, true);
        this.tranformAction();
        this.transformTemplate();
    }

    override get action() {
        return ts.createPrinter().printFile(this.#action);
    }

    override get attributes() {
        return JSON.stringify(Object.fromEntries(Object.entries(this.#attributes).map(([k, v]) => [k, v.getText()])));
    }

    override get template() {
        return JSON.stringify(printHtml(this.#template));
    }

    private scope(others: string[] = []) {
        return [...Object.keys(this.#attributes), ...this.#locals, ...others];
    }

    private transformTemplate() {
        const asStack: string[] = [];
        transformHtml(this.#template, (node, { visitEachChild }) => {
            if (node.type === "fragment") {
                visitEachChild(node);
            }
            if (node.type === "element") {
                let hasAs = false;
                for (const attr of node.attrs) {
                    for (const value of attr.value) {
                        if (value.type === "expression") {
                            value.content = this.transformExpression(value.content, this.scope(asStack));
                        }
                    }
                    if (attr.name === "rx-as") {
                        // XXX: Couple issues:
                        //      - If rx-as is expression, it won't be evaluated at this point
                        //      - Expressions in other attributes on this node won't pick up rx-as
                        asStack.push(attr.value[0].content);
                        hasAs = true;
                    }
                }
                visitEachChild(node);
                if (hasAs) {
                    asStack.pop();
                }
            } else if (node.type === "expression") {
                node.content = this.transformExpression(node.content, this.scope(asStack));
            }
            return node;
        });
    }

    /**
     * Re-scopes expression property accessors to an identifier which will be provided
     * at runtime.
     *
     * @param expression - The expression to transform.
     * @returns The transformed expression.
     */
    private transformExpression(expression: string, locals: string[] = []) {
        const source = ts.createSourceFile("", expression.slice(1, -1), ts.ScriptTarget.Latest, true);

        const transformer: ts.TransformerFactory<ts.Node> = (context) => {
            return (root) => {
                const visit: ts.Visitor = (node) => {
                    if (ts.isIdentifier(node) && locals.includes(node.text.split(".")[0])) {
                        return context.factory.createPropertyAccessExpression(
                            context.factory.createIdentifier("$scope"),
                            node,
                        );
                    }
                    return ts.visitEachChild(node, visit, context);
                };
                return ts.visitNode(root, visit) as ts.Node;
            };
        };

        const result = ts.transform(source, [transformer]);
        const transformed = result.transformed[0] as ts.SourceFile;
        const printer = ts.createPrinter({ omitTrailingSemicolon: true });
        return `{${printer.printNode(ts.EmitHint.Unspecified, transformed.statements[0], source)}}`;
    }

    /**
     * Final transformation of the TypeScript source, figuring out what identifiers need to be
     * pulled into the local scope, that we can then pass to the interpolation functions.
     *
     * We're also extracting out the partials Attributes interface, if it has one, so we can use
     * that information at runtime.  We also stub the $context local that will be passed
     * to the function that encloses the partial code, as well as any attributes.
     */
    private tranformAction() {
        const transformer: ts.TransformerFactory<ts.SourceFile> = (context) => {
            return (root) => {
                const statements: ts.Statement[] = [];
                const visit: ts.Visitor = (node) => {
                    node = ts.visitEachChild(node, visit, context);
                    if (
                        ts.isImportSpecifier(node) &&
                        node.isTypeOnly === false &&
                        node.parent.parent.isTypeOnly === false
                    ) {
                        this.#locals.push(node.name.text);
                    }
                    if (ts.isImportDeclaration(node)) {
                        statements.push(node);
                        return;
                    }
                    if (ts.isInterfaceDeclaration(node) && node.name.text === "Attributes") {
                        // this.#attributes = node;
                        statements.push(node);
                        return;
                    }
                    if (ts.isVariableDeclaration(node) && node.parent.parent.parent === root) {
                        this.#locals.push(node.name.getText());
                    }
                    if (
                        ts.isPropertySignature(node) &&
                        ts.isInterfaceDeclaration(node.parent) &&
                        node.parent.name.text === "Attributes"
                    ) {
                        // attributes.push(node.name.getText());
                        this.#attributes[node.name.getText()] = node.type!;
                    }
                    return node;
                };
                root = ts.visitNode(root, visit) as ts.SourceFile;
                root = context.factory.updateSourceFile(root, [
                    ...statements,
                    ts.factory.createFunctionDeclaration(
                        [
                            ts.factory.createToken(ts.SyntaxKind.ExportKeyword),
                            // ts.factory.createToken(
                            //     ts.SyntaxKind.DefaultKeyword,
                            // ),
                            ts.factory.createToken(ts.SyntaxKind.AsyncKeyword),
                        ],
                        undefined,
                        ts.factory.createIdentifier("action"),
                        undefined,
                        [
                            ts.factory.createParameterDeclaration(
                                undefined,
                                undefined,
                                ts.factory.createIdentifier("$context"),
                                undefined,
                                ts.factory.createTypeReferenceNode(ts.factory.createIdentifier("Context"), undefined),
                                undefined,
                            ),
                            ...Object.entries(this.#attributes).map(([name, type]) => {
                                return ts.factory.createParameterDeclaration(
                                    undefined,
                                    undefined,
                                    ts.factory.createIdentifier(name),
                                    undefined,
                                    type,
                                    undefined,
                                );
                            }),
                        ],
                        undefined,
                        ts.factory.createBlock(
                            [
                                ...root.statements,
                                ts.factory.createReturnStatement(
                                    ts.factory.createObjectLiteralExpression(
                                        this.#locals.map((name) =>
                                            ts.factory.createShorthandPropertyAssignment(
                                                ts.factory.createIdentifier(name),
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
        const result = ts.transform(this.#action, [transformer]);
        this.#action = result.transformed[0];
    }
}
