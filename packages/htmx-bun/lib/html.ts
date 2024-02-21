import format from "html-format";
import { SAXParser } from "parse5-sax-parser";

const voidTags = [
    "area",
    "base",
    "br",
    "col",
    "embed",
    "hr",
    "img",
    "input",
    "link",
    "meta",
    "param",
    "source",
    "track",
    "wbr",
];

interface Doctype {
    type: "doctype";
}

interface Root {
    type: "root";
    content: Node[];
}

export interface Element {
    type: "element";
    tag: string;
    attrs: Record<string, string>;
    content: Node[];
    append: (
        tag: string,
        attrs: Record<string, string>,
        ...content: (Element | Text)[]
    ) => Element;
}

function createElement(
    tag: string,
    attrs: Record<string, string> = {},
    ...content: (Element | Text)[]
): Element {
    return {
        type: "element",
        tag,
        attrs,
        content,
        append(tag, attrs = {}, ...content) {
            const element = createElement(tag, attrs, ...content);
            this.content.push(element);
            return element;
        },
    };
}

interface Text {
    type: "text";
    content: string;
}

type Parent = Root | Element;
type Node = Parent | Text | Doctype;

export function parseHtml(html: string): Root {
    const stack: Node[] = [
        {
            type: "root",
            content: [],
        },
    ];

    const parser = new SAXParser();

    parser.on("doctype", (doctype) => {
        const parent = stack[stack.length - 1] as Parent;
        parent.content.push({
            type: "doctype",
        });
    });

    parser.on("startTag", (tag) => {
        const parent = stack[stack.length - 1] as Parent;
        const attrs = Object.fromEntries(
            tag.attrs.map((attr) => [attr.name, attr.value]),
        );
        const node = createElement(tag.tagName, attrs);
        parent.content.push(node);
        if (!tag.selfClosing && !voidTags.includes(tag.tagName)) {
            stack.push(node);
        }
    });

    parser.on("text", (text) => {
        const parent = stack[stack.length - 1] as Parent;
        parent.content.push({
            type: "text",
            content: text.text,
        } as Text);
    });

    parser.on("endTag", (tag) => {
        stack.pop();
    });

    parser.write(html);
    return stack[0] as Root;
}

export function serializeHtml(node: Node): string {
    switch (node.type) {
        case "doctype":
            return "<!DOCTYPE html>";
        case "root":
            return format(node.content.map(serializeHtml).join(""), "    ");
        case "element":
            return `<${node.tag}${Object.entries(node.attrs)
                .map(([key, value]) => ` ${key}="${value}"`)
                .join("")}>${node.content.map(serializeHtml).join("")}${
                voidTags.includes(node.tag) ? "" : `</${node.tag}>`
            }`;
        case "text":
            return node.content;
    }
}

export function walkHtml(
    input: Element | string,
    callback: (node: Element) => void,
): Parent | string {
    const node = typeof input === "string" ? parseHtml(input) : input;
    for (const child of node.content) {
        if (child.type === "element") {
            callback(child);
            walkHtml(child, callback);
        }
    }
    if (typeof input === "string") {
        return serializeHtml(node);
    }
    return node;
}

// XXX: Put in unit test
// const html = `
//     <div>
//         <link rel="stylesheet" href="/_tailwind">
//         <foo />
//         <bar />
//         <baz>
//             <bam>Foo</bam>
//         </baz>
//     </div>
// `;

// const root = parseHtml(html);
// console.log(serializeHtml(root));
