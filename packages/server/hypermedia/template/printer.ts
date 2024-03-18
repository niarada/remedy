import { HtmlElementAttribute, HtmlNode, parseSource, walkHtml } from ".";

export interface PrintHtmlOptions {
    trim: boolean;
}

export function printHtml(htmlOrNode: string | HtmlNode, options: Partial<PrintHtmlOptions> = {}): string {
    const { trim } = Object.assign({ trim: false }, options);
    const html = typeof htmlOrNode === "string" ? parseSource(htmlOrNode) : htmlOrNode;
    let text: string[] = [];
    walkHtml(html, (node, { visitEachChild }) => {
        if (node.type === "fragment") {
            visitEachChild(node);
            return;
        }
        if (node.type === "element") {
            text.push("<");
            text.push(node.tag);
            for (let i = 0; i < node.attrs.length; i++) {
                text.push(node.spaces[i]);
                const attr = node.attrs[i];
                if (attr.value.length === 1 && attr.value[0].type === "expression") {
                    text.push(`${attr.name}=${attr.value[0].content}`);
                } else {
                    // XXX: Need to use the original quote marks here
                    text.push(`${attr.name}=${attr.quote}${concatAttributeValue(attr)}${attr.quote}`);
                }
            }
            // XXX: There might be some final spacing here.
            text.push(">");
            visitEachChild(node);
            if (!node.void) {
                text.push(`</${node.tag}>`);
            }
            return;
        }
        if (node.type === "text") {
            text.push(trim ? node.content.trim() : node.content);
            return;
        }
        if (node.type === "expression") {
            text.push(`${node.content}`);
            return;
        }
    });
    text = [text.join("").trim()];
    if (!trim) {
        text.push("\n");
    }
    return text.join("");
}

export function concatAttributeValue(attr: HtmlElementAttribute) {
    return attr.value.map((value) => value.content).join("");
}
