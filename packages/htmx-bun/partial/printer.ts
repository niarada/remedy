import { HtmlElementAttribute, HtmlNode } from "./ast";
import { parsePartial } from "./parser";
import { walkHtml } from "./transform";

export function printHtml(htmlOrNode: string | HtmlNode): string {
    const html =
        typeof htmlOrNode === "string"
            ? parsePartial(htmlOrNode)
            : structuredClone(htmlOrNode);
    const text: string[] = [];
    walkHtml(html, (node, { visitEachChild }) => {
        if (node.type === "fragment") {
            visitEachChild(node);
            return;
        }
        if (node.type === "element") {
            // Remove the checked attribute on inputs if their value is "false"
            if (node.tag === "input") {
                node.attrs = node.attrs.filter((attr) =>
                    attr.name === "checked" &&
                    concatAttributeValue(attr) === "false"
                        ? undefined
                        : attr,
                );
            }
            text.push("<");
            text.push(node.tag);
            for (const attr of node.attrs) {
                if (attr.value.length === 0) {
                    text.push(` ${attr.name}`);
                    continue;
                }
                let value = `"${concatAttributeValue(attr)}"`;
                if (
                    attr.value.length === 1 &&
                    attr.value[0].type === "expression"
                ) {
                    value = value.slice(1, -1);
                }
                text.push(` ${attr.name}=${value}`);
            }
            text.push(">");
            visitEachChild(node);
            if (!node.void) {
                text.push(`</${node.tag}>`);
            }
            return;
        }
        if (node.type === "text") {
            text.push(node.content);
            return;
        }
        if (node.type === "expression") {
            text.push(`{${node.content}}`);
            return;
        }
    });
    return `${text.join("").trim()}\n`;
}

export function concatAttributeValue(attr: HtmlElementAttribute) {
    return attr.value
        .map((value) => {
            if (value.type === "text") {
                return value.content;
            }
            return `{${value.content}}`;
        })
        .join("");
}
