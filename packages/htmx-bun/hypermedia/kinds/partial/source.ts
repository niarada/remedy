import * as ts from "typescript";
import { AttributeTypeString, AttributeTypes, Source } from "~/hypermedia";
import {
    HtmlFragment,
    htmlStartIndex,
    parseSource,
    printHtml,
    walkHtml,
} from "~/hypermedia/template";

/**
 * A `.part` source file composed of an upper code section (action) and
 * a subsequent html section (template).  Both are optional.
 */
export class PartialSource extends Source {
    readonly kind = "partial";

    #template!: HtmlFragment;
    #action!: ts.SourceFile;
    #attributes?: ts.InterfaceDeclaration;

    /**
     * Compile the partial source into TypeScript that can be loaded as a module by the loader plugin.
     * @returns The TypeScript source code for the partial.
     */
    compile() {
        this.#template = parseSource(this.text);
        this.#action = ts.createSourceFile(
            "",
            this.text.slice(0, htmlStartIndex(this.text)),
            ts.ScriptTarget.Latest,
            true,
        );
        this.transformExpressions();
        this.tranformAction();
    }

    get action() {
        return ts.createPrinter().printFile(this.#action);
    }

    get attributes() {
        const attributes: AttributeTypes = {};
        if (this.#attributes) {
            for (const member of this.#attributes.members) {
                if (ts.isPropertySignature(member) && member.type) {
                    attributes[member.name.getText()] =
                        member.type.getText() as AttributeTypeString;
                }
            }
        }
        return JSON.stringify(attributes);
    }

    get template() {
        return JSON.stringify(printHtml(this.#template));
    }

    private transformExpressions() {
        walkHtml(this.#template, (node, { visitEachChild }) => {
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
                        if (ts.isConditionalExpression(node.parent)) {
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
     * that information at runtime.  We also stub the $context local that will be passed
     * to the function that encloses the partial code.
     */
    private tranformAction() {
        const locals: string[] = ["$context"];
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
                                ts.factory.createTypeReferenceNode(
                                    ts.factory.createIdentifier("Context"),
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
        const result = ts.transform(this.#action, [transformer]);
        this.#action = result.transformed[0];
    }
}
