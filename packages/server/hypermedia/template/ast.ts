import { htmlVoidTags } from ".";
export type Scope = Record<string, unknown>;

export type HtmlFragment = {
    type: "fragment";
    parent?: HtmlParent;
    children: HtmlNode[];
    scope: Scope;
};

export type HtmlText = {
    type: "text";
    parent: HtmlParent;
    content: string;
    scope: Scope;
};

export type HtmlExpression = {
    type: "expression";
    parent: HtmlParent;
    content: string;
    scope: Scope;
};

export type HtmlElement = {
    type: "element";
    parent: HtmlParent;
    children: HtmlNode[];
    tag: string;
    void: boolean;
    attrs: HtmlElementAttribute[];
    scope: Scope;
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
    scope: Object.create(parent?.scope || null),
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
    void: htmlVoidTags.includes(tag),
    attrs: Array.isArray(attrs)
        ? attrs
        : Object.entries(attrs).map(([name, value]) => ({
              name,
              value: [{ type: "text", content: String(value) }],
          })),
    children,
    scope: Object.create(parent.scope),
});

export const createHtmlText = (
    parent: HtmlParent,
    content: string,
): HtmlText => ({
    type: "text",
    parent,
    content,
    scope: Object.create(parent.scope),
});

export const createHtmlExpression = (
    parent: HtmlParent,
    content: string,
): HtmlExpression => ({
    type: "expression",
    parent,
    content,
    scope: Object.create(parent.scope),
});
