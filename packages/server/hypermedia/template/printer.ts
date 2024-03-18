import { HtmlElementAttribute, HtmlNode, parseSource, walkHtml } from ".";

export interface PrintHtmlOptions {
    trim: boolean;
}

export function printHtml(htmlOrNode: string | HtmlNode, options: Partial<PrintHtmlOptions> = {}): string {
    const { trim } = Object.assign({ trim: false }, options);
    let html: HtmlNode;
    if (typeof htmlOrNode === "string") {
        const { ast } = parseSource(htmlOrNode);
        html = ast;
    } else {
        html = htmlOrNode;
    }
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
                const attr = node.attrs[i];
                text.push(attr.preSpace);
                if (attr.value.length === 1 && attr.value[0].type === "expression") {
                    text.push(`${attr.name}=${attr.value[0].content}`);
                } else {
                    text.push(`${attr.name}=${attr.quote}${concatAttributeValue(attr)}${attr.quote}`);
                }
            }
            if (node.postAttributeSpace.includes("\n")) {
                text.push(node.postAttributeSpace);
            }
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
