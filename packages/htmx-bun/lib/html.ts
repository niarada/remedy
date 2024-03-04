import { SAXParser } from "parse5-sax-parser";
import { warn } from "./log";

/**
 * An array of void tag names.
 * Void tags are HTML tags that do not require a closing tag.
 */
export const voidTags = [
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

export type HtmlFragment = {
    type: "fragment";
    parent?: HtmlParent;
    children: HtmlNode[];
};

export type HtmlDoctype = {
    type: "doctype";
    parent: HtmlFragment;
};

export type HtmlText = {
    type: "text";
    parent: HtmlParent;
    content: string;
};

export type HtmlElementAttribute = {
    name: string;
    value: string;
};

export type HtmlElement = {
    type: "element";
    parent: HtmlParent;
    children: HtmlNode[];
    tag: string;
    void: boolean;
    attrs: HtmlElementAttribute[];
};

export type HtmlNode = HtmlFragment | HtmlDoctype | HtmlElement | HtmlText;
export type HtmlParent = HtmlFragment | HtmlElement;

export const createHtmlFragment = (
    parent?: HtmlParent,
    ...children: HtmlNode[]
): HtmlFragment => ({
    type: "fragment",
    children,
});

export const createHtmlElement = (
    parent: HtmlParent,
    tag: string,
    attrs: HtmlElementAttribute[] | Record<string, unknown> = [],
    ...children: (HtmlElement | HtmlText)[]
): HtmlElement => ({
    type: "element",
    parent,
    tag,
    void: voidTags.includes(tag),
    attrs: Array.isArray(attrs)
        ? attrs
        : Object.entries(attrs).map(
              ([name, value]) => ({ name, value }) as HtmlElementAttribute,
          ),
    children,
});

export const createHtmlText = (
    parent: HtmlParent,
    content: string,
): HtmlText => ({
    type: "text",
    parent,
    content,
});

export const createHtmlDoctype = (parent: HtmlFragment): HtmlDoctype => ({
    type: "doctype",
    parent,
});

export function parseHtml(html: string): HtmlFragment {
    const stack: HtmlParent[] = [createHtmlFragment()];
    const parser = new SAXParser();

    function parent() {
        return stack[stack.length - 1];
    }

    function addElement(tag: string, attrs: HtmlElementAttribute[] = []) {
        const node = createHtmlElement(parent(), tag, attrs);
        parent().children.push(node);
        return node;
    }

    function addText(content: string) {
        parent().children.push(createHtmlText(parent(), content));
    }

    function addDoctype() {
        const p = parent();
        if (p.type === "fragment") {
            parent().children.push(createHtmlDoctype(p));
        }
    }

    parser.on("doctype", () => {
        addDoctype();
    });

    parser.on("startTag", (tag) => {
        const node = addElement(tag.tagName, tag.attrs);
        if (!tag.selfClosing && !voidTags.includes(tag.tagName)) {
            stack.push(node);
        }
    });

    parser.on("text", (text) => {
        const parent = stack[stack.length - 1] as HtmlParent;
        addText(text.text);
    });

    parser.on("endTag", (tag) => {
        stack.pop();
    });

    parser.write(html);
    return stack[0] as HtmlFragment;
}

export type HtmlVisitResponse = HtmlNode | (HtmlNode | undefined)[] | undefined;

type VisitFunctions = {
    visitNode: (node: HtmlNode) => Promise<HtmlVisitResponse>;
    visitEachChild: (node: HtmlNode) => Promise<HtmlNode>;
};

export type HtmlTransformer = (
    node: HtmlNode,
    fns: VisitFunctions,
) => Promise<HtmlVisitResponse>;

export async function transformHtml(node: HtmlNode, visit: HtmlTransformer) {
    async function visitNode(node: HtmlNode) {
        return await visit(node, { visitNode, visitEachChild });
    }

    async function visitEachChild(node: HtmlNode) {
        if (node.type === "fragment" || node.type === "element") {
            const replacements = [];
            for (const child of node.children) {
                replacements.push(
                    await visit(child, { visitEachChild, visitNode }),
                );
            }
            node.children = replacements
                .flat()
                .filter((it) => it) as HtmlNode[];
            for (const child of node.children) {
                child.parent = node;
            }
        }
        return node;
    }

    return await visitNode(node);
}

export function attributesToObject(attrs: HtmlElementAttribute[]) {
    const obj: Record<string, string> = {};
    for (const attr of attrs) {
        obj[attr.name] = attr.value;
    }
    return obj;
}

export function formatHtml(htmlOrNode: string | HtmlNode): string {
    const html =
        typeof htmlOrNode === "string"
            ? parseHtml(htmlOrNode)
            : structuredClone(htmlOrNode);
    const text: string[] = [];
    let indent = 0;
    function visit(node: HtmlNode) {
        if (
            (node.type === "element" &&
                !["markdown", "pre", "code"].includes(node.tag)) ||
            node.type === "fragment"
        ) {
            node.children = node.children.filter(
                (child) =>
                    !(child.type === "text" && child.content.trim() === ""),
            );
        }
        if (node.type === "fragment") {
            for (const child of node.children) {
                visit(child);
            }
        } else if (node.type === "doctype") {
            text.push("<!DOCTYPE html>");
        } else if (node.type === "element") {
            if (node.tag === "input") {
                node.attrs = node.attrs.filter((attr) =>
                    attr.name === "checked" && attr.value === "false"
                        ? undefined
                        : attr,
                );
            }
            if (node.tag !== "code") {
                text.push(" ".repeat(indent));
            }
            text.push("<");
            text.push(node.tag);
            for (const attr of node.attrs) {
                text.push(` ${attr.name}="${attr.value}"`);
            }
            text.push(">");
            if (
                node.children.length > 0 &&
                !["code", "pre"].includes(node.tag)
            ) {
                text.push("\n");
            }
            indent += 2;
            for (const child of node.children) {
                visit(child);
            }
            indent -= 2;
            if (
                !node.void &&
                node.children.length > 0 &&
                !["code", "pre"].includes(node.tag)
            ) {
                text.push(" ".repeat(indent));
            }
            if (!node.void) {
                text.push(`</${node.tag}>`);
            }
            if (node.tag !== "code") {
                text.push("\n");
            }
        } else if (node.type === "text") {
            const lines = node.content.split("\n");
            if (lines.length === 0) {
                return;
            }
            if (node.parent.type === "element") {
                if (node.parent.tag === "markdown") {
                    let initialIndent = 0;
                    while (lines.length > 0) {
                        // const line = lines.shift()!;
                        if (lines[0].trim() === "") {
                            lines.shift();
                            continue;
                        }
                        initialIndent = lines[0].search(/\S/);
                        break;
                    }
                    while (lines.length > 0) {
                        if (lines[lines.length - 1].trim() === "") {
                            lines.pop();
                            continue;
                        }
                        break;
                    }
                    for (const line of lines) {
                        if (
                            line.trim() !== "" &&
                            line.search(/\S/) < initialIndent
                        ) {
                            warn(
                                "markdown",
                                "All lines must be indented at least the same amount as the first line.",
                            );
                            text.push(`${line}\n`);
                        } else {
                            text.push(`${line.slice(initialIndent)}\n`);
                        }
                    }
                    return;
                }
                if (["pre", "code"].includes(node.parent.tag)) {
                    text.push(node.content.trim());
                    return;
                }
            }
            text.push(`${" ".repeat(indent)}${lines.join("\n").trim()}\n`);
        }
    }
    visit(html);
    return `${text.join("").trim()}\n`;
}
