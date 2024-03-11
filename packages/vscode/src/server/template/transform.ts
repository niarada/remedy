import { HtmlNode } from "./ast";

export type HtmlTransformVisitResponse =
    | HtmlNode
    | (HtmlNode | undefined)[]
    | undefined;

export type HtmlTransformVisitNodeFunction = (
    node: HtmlNode,
) => HtmlTransformVisitResponse;
export type HtmlTransformVisitEachChildFunction = (node: HtmlNode) => HtmlNode;

export type HtmlTransformVisitFunctions = {
    visitNode: HtmlTransformVisitNodeFunction;
    visitEachChild: HtmlTransformVisitEachChildFunction;
};

export type HtmlTransformVisitor = (
    node: HtmlNode,
    fns: HtmlTransformVisitFunctions,
) => HtmlTransformVisitResponse;

export type HtmlSimpleTransformVisitor = (
    node: HtmlNode,
) => HtmlTransformVisitResponse;

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
            node.children = replacements
                .flat()
                .filter((it) => it) as HtmlNode[];
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
export function simpleTransformHtml(
    node: HtmlNode,
    visit: HtmlSimpleTransformVisitor,
) {
    transformHtml(node, (node, { visitEachChild, visitNode }) => {
        const results = visit(node);
        const nodes = [results].flat().filter((it) => it) as HtmlNode[];
        for (const node of nodes) {
            visitEachChild(node);
        }
        return nodes;
    });
}

type HtmlWalkVisitFunctions = {
    visitEachChild: (node: HtmlNode) => void;
};

export type HtmlWalkVisitor = (
    node: HtmlNode,
    fns: HtmlWalkVisitFunctions,
) => void;

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

export function cloneHtml(source: HtmlNode): HtmlNode {
    const target = structuredClone(source);
    simpleWalkHtml(target, (node) => {
        if (node.parent) {
            node.scope = Object.assign(
                Object.create(node.parent.scope),
                node.scope,
            );
        }
    });
    return target;
}
