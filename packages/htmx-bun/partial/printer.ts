import { HtmlNode } from "./ast";
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
                    attr.value.type === "text" &&
                    attr.value.content === "false"
                        ? undefined
                        : attr,
                );
            }
            text.push("<");
            text.push(node.tag);
            for (const attr of node.attrs) {
                if (attr.value.type === "void") {
                    text.push(` ${attr.name}`);
                    continue;
                }
                const value =
                    attr.value.type === "expression"
                        ? `{${attr.value.content}}`
                        : `"${attr.value.content}"`;
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
