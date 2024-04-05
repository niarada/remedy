import { HtmlElement, HtmlNode, Scope, createHtmlText, simpleTransformHtml } from "@niarada/remedy-template";
import { AttributeTypes, Attributes } from "./artifact";

class ExpressionError extends Error {
    constructor(
        message: string,
        public expression: string,
        public wrappedError: Error,
    ) {
        super(message);
        this.name = "ExpressionError";
        this.expression = expression;
    }
}

/**
 * Evaluates an expression with a given scope.
 *
 * @param scope - The scope to evaluate the expression with.
 * @param expression - The expression to evaluate.
 * @returns The result of evaluating the expression.
 */
export function express(scope: Scope, expression: string): unknown {
    const expressFn = new Function("$scope", `return ${expression.slice(1, -1)}`);
    try {
        return expressFn(scope);
    } catch (e) {
        expression = expression.replace(/\$scope\./g, "");
        throw new ExpressionError(`Error evaluating expression ${expression}`, expression, e as Error);
    }
}

/**
 * Evaluates all the expressions in a html ast coercing expressed results into strings.
 *
 * @param scope - The scope to evaluate the expression with.
 * @param template - The HtmlFragment root.
 */
export function transformExpressionsIntoStrings(node: HtmlNode) {
    simpleTransformHtml(node, (node) => {
        if (node.type === "element") {
            node.attrs = node.attrs
                .map((attr) => {
                    if (attr.name.startsWith("x-")) {
                        attr.value = attr.value.map((value) => {
                            if (value.type === "text") {
                                return value;
                            }
                            return {
                                type: "text",
                                content: value.content,
                            };
                        });
                        return attr;
                    }
                    attr.value = attr.value.map((value) => {
                        if (value.type === "text") {
                            return value;
                        }
                        try {
                            const result = express(node.scope, value.content);
                            return {
                                type: "text",
                                content: String(result),
                            };
                        } catch (error) {
                            if (error instanceof ExpressionError) {
                                console.error(error.message);
                                return {
                                    type: "text",
                                    content: error.expression,
                                };
                            }
                            throw error;
                        }
                    });
                    if (attr.name === "rx-content") {
                        node.children.push(createHtmlText(node, attr.value[0].content));
                        return null;
                    }
                    if (attr.name === "class") {
                        for (const value of attr.value) {
                            value.content = value.content
                                .replace(/¢(\w+)/g, (_, placeholder) => {
                                    if (node.scope[placeholder]) {
                                        return placeholder;
                                    }
                                    return "";
                                })
                                .trim();
                        }
                    }
                    return attr;
                })
                .filter((it) => it);
        }
        if (node.type === "expression") {
            try {
                const result = express(node.scope, node.content);
                return createHtmlText(node.parent, String(result));
            } catch (error) {
                if (error instanceof ExpressionError) {
                    console.error(error.message);
                    return createHtmlText(node.parent, error.expression);
                }
                throw error;
            }
        }
        return node;
    });
}

/**
 * Retrieves the expressed value of a node attribute.  If the attribute
 * has multiple values, only the first is returned;
 * @param node The node to extract the attribute from
 * @param name The name of the attribute to express
 * @returns The expressed value, or undefined.
 */
export function expressAttributeFirstValue(node: HtmlElement, name: string): unknown {
    for (const attr of node.attrs) {
        if (attr.name !== name) continue;
        if (attr.value.length === 0) continue;
        if (attr.value[0].type === "expression") {
            return express(node.scope, attr.value[0].content);
        }
        return attr.value[0].content;
    }
    return undefined;
}

export function expressDefinedAttributesToStrings(node: HtmlElement, types: AttributeTypes) {
    const attributes = {} as Attributes;
    for (const attr of node.attrs) {
        const type = types[attr.name];
        const values = [];
        if (type) {
            for (const v of attr.value) {
                if (v.type === "expression") {
                    values.push(String(express(node.scope, v.content)));
                } else {
                    values.push(v.content);
                }
            }
        }
        attributes[attr.name] = values.join("");
    }
    return attributes;
}

export function expressFlattenedAttributes(node: HtmlElement) {
    const attributes: Record<string, string> = {};
    for (const attr of node.attrs) {
        const values = [];
        for (const v of attr.value) {
            if (v.type === "expression") {
                values.push(String(express(node.scope, v.content)));
            } else {
                values.push(v.content);
            }
        }
        attributes[attr.name] = values.join("");
    }
    return attributes;
}
