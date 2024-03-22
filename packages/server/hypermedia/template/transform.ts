import {
    HtmlNode,
    HtmlParent,
    createHtmlComment,
    createHtmlElement,
    createHtmlExpression,
    createHtmlFragment,
    createHtmlText,
} from ".";

export type HtmlTransformVisitResponse = HtmlNode | (HtmlNode | undefined)[] | undefined;

export type HtmlTransformVisitNodeFunction = (node: HtmlNode) => HtmlTransformVisitResponse;
export type HtmlTransformVisitEachChildFunction = (node: HtmlNode) => HtmlNode;

export type HtmlTransformVisitFunctions = {
    visitNode: HtmlTransformVisitNodeFunction;
    visitEachChild: HtmlTransformVisitEachChildFunction;
};

export type HtmlTransformVisitor = (node: HtmlNode, fns: HtmlTransformVisitFunctions) => HtmlTransformVisitResponse;
export type HtmlSimpleTransformVisitor = (node: HtmlNode) => HtmlTransformVisitResponse;

export function transformHtml(node: HtmlNode, visit: HtmlTransformVisitor) {
    function visitNode(node: HtmlNode) {
        return visit(node, { visitNode, visitEachChild });
    }

    function visitEachChild(node: HtmlNode) {
        if (node.type === "fragment" || node.type === "element") {
            const replacements = [];
            for (const child of node.children) {
                replacements.push(visit(child, { visitEachChild, visitNode }));
            }
            node.children = replacements.flat().filter((it) => it) as HtmlNode[];
            for (const child of node.children) {
                child.parent = node;
            }
        }
        return node;
    }

    return visitNode(node);
}

/**
 * Transforms the Ast using the provided visitor.  This version does not pass
 * in the other visit functions, so it is implicitly a preorder traversal.
 *
 * @param visit - The visitor function to apply to each HTML node.
 */
export function simpleTransformHtml(node: HtmlNode, visit: HtmlSimpleTransformVisitor) {
    transformHtml(node, (node, { visitEachChild }) => {
        const results = visit(node);
        const nodes = [results].flat().filter((it) => it) as HtmlNode[];
        for (const node of nodes) {
            visitEachChild(node);
        }
        return nodes;
    });
}

export type HtmlAsyncTransformVisitResponse = Promise<HtmlNode | (HtmlNode | undefined)[] | undefined>;

export type HtmlAsyncTransformVisitNodeFunction = (node: HtmlNode) => HtmlAsyncTransformVisitResponse;
export type HtmlAsyncTransformVisitEachChildFunction = (node: HtmlNode) => Promise<HtmlNode>;

export type HtmlAsyncTransformVisitFunctions = {
    visitNode: HtmlAsyncTransformVisitNodeFunction;
    visitEachChild: HtmlAsyncTransformVisitEachChildFunction;
};

export type HtmlAsyncTransformVisitor = (
    node: HtmlNode,
    fns: HtmlAsyncTransformVisitFunctions,
) => HtmlAsyncTransformVisitResponse;
export type HtmlSimpleAsyncTransformVisitor = (node: HtmlNode) => HtmlAsyncTransformVisitResponse;

export async function asyncTransformHtml(node: HtmlNode, visit: HtmlAsyncTransformVisitor) {
    async function visitNode(node: HtmlNode) {
        return await visit(node, { visitNode, visitEachChild });
    }

    async function visitEachChild(node: HtmlNode) {
        if (node.type === "fragment" || node.type === "element") {
            const replacements = [];
            for (const child of node.children) {
                replacements.push(await visit(child, { visitEachChild, visitNode }));
            }
            node.children = replacements.flat().filter((it) => it) as HtmlNode[];
            for (const child of node.children) {
                child.parent = node;
            }
        }
        return node;
    }

    return await visitNode(node);
}

export async function simpleAsyncTransformHtml(node: HtmlNode, visit: HtmlSimpleAsyncTransformVisitor) {
    return await asyncTransformHtml(node, async (node, { visitEachChild }) => {
        const results = await visit(node);
        const nodes = [results].flat().filter((it) => it) as HtmlNode[];
        for (const node of nodes) {
            await visitEachChild(node);
        }
        return nodes;
    });
}

type HtmlWalkVisitFunctions = {
    visitEachChild: (node: HtmlNode) => void;
};

export type HtmlWalkVisitor = (node: HtmlNode, fns: HtmlWalkVisitFunctions) => void;

export type HtmlSimpleWalkVisitor = (node: HtmlNode) => void;

export function walkHtml(node: HtmlNode, visit: HtmlWalkVisitor) {
    function visitEachChild(node: HtmlNode) {
        if (node.type === "fragment" || node.type === "element") {
            for (const child of node.children) {
                visit(child, { visitEachChild });
            }
        }
    }
    visit(node, { visitEachChild });
}

export function simpleWalkHtml(node: HtmlNode, visit: HtmlSimpleWalkVisitor) {
    walkHtml(node, (node, { visitEachChild }) => {
        visit(node);
        visitEachChild(node);
    });
}

export function cloneHtml(node: HtmlNode, parent?: HtmlParent): HtmlNode {
    if (node.type === "fragment") {
        const clone = createHtmlFragment(parent);
        if (!parent) {
            clone.parent = node.parent;
            clone.scope = { ...node.scope };
        }
        clone.children = node.children.map((child) => cloneHtml(child, clone));
        return clone;
    }
    if (!parent) {
        parent = node.parent;
    }
    switch (node.type) {
        case "element": {
            const clone = createHtmlElement(parent, node.tag, structuredClone(node.attrs));
            clone.children = node.children.map((child) => cloneHtml(child, clone));
            clone.postAttributeSpace = node.postAttributeSpace;
            return clone;
        }
        case "text": {
            return createHtmlText(parent, node.content);
        }
        case "expression": {
            return createHtmlExpression(parent, node.content);
        }
        case "comment": {
            return createHtmlComment(parent, node.content);
        }
    }
}
