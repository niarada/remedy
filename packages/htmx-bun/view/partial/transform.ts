import { HtmlNode } from "./ast";

export type HtmlTransformVisitResponse =
    | HtmlNode
    | (HtmlNode | undefined)[]
    | undefined;

export type HtmlTransformVisitNodeFunction = (
    node: HtmlNode,
) => Promise<HtmlTransformVisitResponse>;
export type HtmlTransformVisitEachChildFunction = (
    node: HtmlNode,
) => Promise<HtmlNode>;

export type HtmlTransformVisitFunctions = {
    visitNode: HtmlTransformVisitNodeFunction;
    visitEachChild: HtmlTransformVisitEachChildFunction;
};

export type HtmlTransformVisitor = (
    node: HtmlNode,
    fns: HtmlTransformVisitFunctions,
) => Promise<HtmlTransformVisitResponse>;

export async function transformHtml(
    node: HtmlNode,
    visit: HtmlTransformVisitor,
) {
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

type HtmlWalkVisitFunctions = {
    visitEachChild: (node: HtmlNode) => void;
};

export type HtmlWalkVisitor = (
    node: HtmlNode,
    fns: HtmlWalkVisitFunctions,
) => void;

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
