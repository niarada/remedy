import { HtmlElementAttribute, HtmlNode, parseSource } from "./ast";
import { walkHtml } from "./transform";

export interface PrintHtmlOptions {
    trim: boolean;
    expandSelfClosing: boolean;
}

const defaultOptions: PrintHtmlOptions = {
    trim: false,
    expandSelfClosing: true,
};

export function printHtml(htmlOrNode: string | HtmlNode, options: Partial<PrintHtmlOptions> = {}): string {
    options = Object.assign({}, defaultOptions, options);
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
                    const value = concatAttributeValue(attr);
                    // XXX: Special case for input.checked
                    if (node.tag === "input" && attr.name === "checked") {
                        if (value !== "false") {
                            text.push("checked");
                        }
                    } else {
                        if (value) {
                            text.push(`${attr.name}=${attr.quote}${value}${attr.quote}`);
                        } else {
                            text.push(attr.name);
                        }
                    }
                }
            }
            if (node.postAttributeSpace.includes("\n")) {
                text.push(node.postAttributeSpace);
            }
            if (!node.void && !options.expandSelfClosing && node.children.length === 0) {
                text.push(" /");
            }
            text.push(">");
            visitEachChild(node);
            if (!node.void && (options.expandSelfClosing || node.children.length > 0)) {
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
