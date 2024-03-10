import { warn } from "~/lib/log";
import { expressAttributeFirstValue } from "./expressor";
import {
    HtmlElement,
    HtmlNode,
    cloneHtml,
    simpleTransformHtml,
} from "./template";

/**
 * Transforms an html ast by looking for `mx-each` attributes,
 * evaluating that attribute, and duplicating the element by
 * its array length.  If `mx-as` is present, each item will be
 * passed to the childrens scope under that name.
 * @param scope The scope to use for evaluating expressions.
 * @param node The ast to apply the each transform on.
 */
export function transformFlowEach(node: HtmlNode) {
    simpleTransformHtml(node, (node) => {
        if (node.type === "element") {
            const each = expressAttributeFirstValue(
                node,
                "mx-each",
            ) as unknown[];
            if (!each) {
                return node;
            }
            const as = expressAttributeFirstValue(node, "mx-as") as string;
            if (!Array.isArray(each)) {
                warn(
                    "flow",
                    `Invalid 'mx-each' attribute for ${node.tag}, not an Array`,
                );
                return;
            }
            node.attrs = node.attrs.filter(
                (attr) => !["mx-each", "mx-as"].includes(attr.name),
            );
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
