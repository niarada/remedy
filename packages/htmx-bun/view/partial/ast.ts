/**
 * An array of void tag names.
 * Void tags are HTML tags that do not require a closing tag.
 */
export const voids = [
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

export type HtmlText = {
    type: "text";
    parent: HtmlParent;
    content: string;
};

export type HtmlExpression = {
    type: "expression";
    parent: HtmlParent;
    content: string;
};

export type HtmlElement = {
    type: "element";
    parent: HtmlParent;
    children: HtmlNode[];
    tag: string;
    void: boolean;
    attrs: HtmlElementAttribute[];
};

export type HtmlElementAttribute = {
    name: string;
    value: HtmlElementAttributeValue[];
};

export type HtmlElementAttributeText = {
    type: "text";
    content: string;
};

export type HtmlElementAttributeExpression = {
    type: "expression";
    content: string;
};

export type HtmlNode = HtmlFragment | HtmlElement | HtmlText | HtmlExpression;
export type HtmlParent = HtmlFragment | HtmlElement;
export type HtmlElementAttributeValue =
    | HtmlElementAttributeText
    | HtmlElementAttributeExpression;

export const createHtmlFragment = (
    parent?: HtmlParent,
    ...children: HtmlNode[]
): HtmlFragment => ({
    type: "fragment",
    parent,
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
    void: voids.includes(tag),
    attrs: Array.isArray(attrs)
        ? attrs
        : Object.entries(attrs).map(([name, value]) => ({
              name,
              value: [{ type: "text", content: String(value) }],
          })),
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
