import { CstChildrenDictionary, CstElement, CstNode, ICstVisitor, IToken } from "chevrotain";
import { parser } from "./parser";

export const BaseTemplateVisitorWithDefaults = parser.getBaseCstVisitorConstructorWithDefaults();

export function visit(visitor: ICstVisitor<unknown, unknown>, node: unknown) {
    if (!node) {
        return;
    }
    return visitor.visit(node as CstNode);
}

export function visitEach(visitor: ICstVisitor<unknown, unknown>, nodes: CstElement[]) {
    for (const node of nodes) {
        visit(visitor, node);
    }
}

export function orderedFlatNodeChildren(context: CstChildrenDictionary) {
    return (Object.values(context).flat() as CstNode[]).sort((a, b) => {
        return a.location!.startOffset - b.location!.startOffset;
    });
}

export function orderedFlatChildren(element: unknown) {
    const children = getChildren(element);
    const elements = Object.values(children).flat();
    elements.sort((a, b) => {
        const aOffset = Object.hasOwn(a, "location") ? (a as CstNode).location!.startOffset : (a as IToken).startOffset;
        const bOffset = Object.hasOwn(b, "location") ? (b as CstNode).location!.startOffset : (b as IToken).startOffset;
        return aOffset - bOffset;
    });
    return elements;
}

export function getChildren(element: unknown) {
    return (element as CstNode).children || (element as CstChildrenDictionary);
}

export function getNodes(element: unknown, name: string) {
    return (getChildren(element)[name] || []) as CstNode[];
}

export function getTokens(element: unknown, name: string) {
    return (getChildren(element)[name] || []) as IToken[];
}

export function getNode(element: unknown, name: string, ...rest: string[]) {
    const node = getNodes(element, name)[0] as CstNode | undefined;
    if (rest.length) {
        return getNode(node, rest[0], ...rest.slice(1));
    }
    return node;
}

export function getToken(element: unknown, name: string) {
    return getTokens(element, name)[0] || undefined;
}

export function getTokenImage(element: unknown, name: string) {
    return getToken(element, name)?.image;
}
