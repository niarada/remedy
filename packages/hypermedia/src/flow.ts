import { warn } from "@niarada/remedy-common";
import { HtmlElement, HtmlNode, cloneHtml, simpleTransformHtml } from "@niarada/remedy-template";
import { expressAttributeFirstValue } from "./expressor";

/**
 * Transforms an html ast by looking for `rx-each` attributes,
 * evaluating that attribute, and duplicating the element by
 * its array length.  If `rx-as` is present, each item will be
 * passed to the childrens scope under that name.
 * @param node The ast to apply the each transform on.
 */
export function transformFlowEach(node: HtmlNode) {
    simpleTransformHtml(node, (node) => {
        if (node.type === "element") {
            const each = expressAttributeFirstValue(node, "rx-each") as unknown[];
            if (!each) {
                return node;
            }
            const as = expressAttributeFirstValue(node, "rx-as") as string;
            if (!Array.isArray(each)) {
                warn("flow", `Invalid 'rx-each' attribute for ${node.tag}, not an Array`);
                return;
            }
            node.attrs = node.attrs.filter((attr) => !["rx-each", "rx-as"].includes(attr.name));
            const children = [];
            for (const item of each) {
                const child = cloneHtml(node) as HtmlElement;
                if (as) {
                    child.scope[as] = item;
                }
                children.push(child);
            }
            return children;
        }
        return node;
    });
}

/**
 * Removes a node if `rx-when` evaluates not undefined and falsy.
 *
 * @param {HtmlNode} node - The ast.
 */
export function transformFlowWhen(node: HtmlNode) {
    simpleTransformHtml(node, (node) => {
        if (node.type === "element") {
            const when = expressAttributeFirstValue(node, "rx-when");
            if (when !== undefined && !when) {
                return [];
            }
            node.attrs = node.attrs.filter((attr) => !["rx-when"].includes(attr.name));
        }
        return node;
    });
}
