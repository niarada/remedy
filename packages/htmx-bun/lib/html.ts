import { SAXParser } from "parse5-sax-parser";
import { formatHtml } from "~/lib/format";

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
        parent.children.push(createHtmlText(parent, text.text));
    });

    parser.on("endTag", (tag) => {
        stack.pop();
    });

    parser.write(html);
    return stack[0] as HtmlFragment;
}

export async function printHtmlSyntaxTree(node: HtmlNode): Promise<string> {
    node = structuredClone(node);
    function visit(node: HtmlNode): string {
        switch (node.type) {
            case "fragment":
                return node.children.map(visit).join("");
            case "doctype":
                return "<!DOCTYPE html>";
            case "element":
                if (node.tag === "input") {
                    node.attrs = node.attrs.filter((attr) =>
                        attr.name === "checked" && attr.value === "false"
                            ? undefined
                            : attr,
                    );
                }
                return `<${node.tag}${node.attrs
                    .map((attr) => ` ${attr.name}="${attr.value}"`)
                    .join("")}>${node.children.map(visit).join("")}${
                    node.void ? "" : `</${node.tag}>`
                }`;
            case "text":
                return node.content;
        }
    }
    return formatHtml(visit(node));
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
