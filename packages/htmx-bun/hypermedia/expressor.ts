import { error } from "~/lib/log";
import { AttributeTypes, Attributes } from ".";
import {
    HtmlElement,
    HtmlNode,
    Scope,
    createHtmlText,
    simpleTransformHtml,
} from "./template";

/**
 * Evaluates an expression with a given scope.
 *
 * @param scope - The scope to evaluate the expression with.
 * @param expression - The expression to evaluate.
 * @returns The result of evaluating the expression.
 */
export function express(scope: Scope, expression: string): unknown {
    const express = new Function("$scope", `return ${expression}`);
    try {
        return express(scope);
    } catch (e) {
        error("expressor", `Error evaluating expression '${expression}`);
        console.log("$scope:", scope);
        console.log(e);
        return undefined;
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
            node.attrs = node.attrs.map((attr) => {
                attr.value = attr.value.map((value) =>
                    value.type === "text"
                        ? value
                        : {
                              type: "text",
                              content: String(
                                  express(node.scope, value.content),
                              ),
                          },
                );
                return attr;
            });
        }
        if (node.type === "expression") {
            return createHtmlText(
                node.parent,
                String(express(node.scope, node.content)),
            );
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
export function expressAttributeFirstValue(
    node: HtmlElement,
    name: string,
): unknown {
    for (const attr of node.attrs) {
        if (attr.name !== name) continue;
        if (attr.value.length === 0) continue;
        if (attr.value[0].type === "expression") {
            return express(node.scope, attr.value[0].content);
        }
        return attr.value[0].content;
    }
}

// export function expressAttributeValue(value: HtmlElementAttributeValue) {
//     if (value.type === "text") {
//         return value.content;
//     }
//     return express(node.scope, attr.value[0].content);
// }

// export function expressAttributeValueToString(
//     attribute: HtmlElementAttribute,
//     name: string,
// ) {
//     const values = [];
//     for (const val of attribute.value) {
//     }
//     for (const attr of node.attrs) {
//         if (attr.name !== name) continue;
//         if (attr.value.length === 0) continue;
//         if (attr.value[0].type === "expression") {
//             return express(node.scope, attr.value[0].content);
//         }
//         return attr.value[0].content;
//     }
// }

export function expressDefinedAttributesToStrings(
    node: HtmlElement,
    types: AttributeTypes,
) {
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
