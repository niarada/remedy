import { CstChildrenDictionary, CstNode, IToken, TokenType } from "chevrotain";

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

export function getTokens(element: unknown, type: string | TokenType) {
    if (typeof type === "string") {
        return (getChildren(element)[type] || []) as IToken[];
    }
    return (getChildren(element)[type.name] || []) as IToken[];
}

export function getNode(element: unknown, name: string, ...rest: string[]) {
    const node = getNodes(element, name)[0] as CstNode | undefined;
    if (rest.length) {
        return getNode(node, rest[0], ...rest.slice(1));
    }
    return node;
}

export function getToken(element: unknown, type: string | TokenType) {
    if (typeof type === "string") {
        return getTokens(element, type)[0] || undefined;
    }
    return getTokens(element, type.name)[0] || undefined;
}

export function getTokenImage(element: unknown, type: string | TokenType) {
    return getToken(element, type)?.image;
}

interface SimpleAstNode {
    v: string;
    c?: SimpleAstNode[];
}

export function getSimpleAst(node: CstNode, parent?: SimpleAstNode) {
    const snode = { v: node.name } as SimpleAstNode;
    if (parent) {
        if (!parent.c) {
            parent.c = [];
        }
        parent.c.push(snode);
    }
    for (const child of orderedFlatChildren(node)) {
        if (Object.hasOwn(child, "children")) {
            getSimpleAst(child as CstNode, snode);
        } else {
            if (!snode.c) {
                snode.c = [];
            }
            snode.c.push({ v: (child as IToken).image });
        }
    }
    return snode;
}

export function printSimpleAst(node: CstNode | SimpleAstNode, indent = 0) {
    const ast = Object.hasOwn(node, "name") ? getSimpleAst(node as CstNode) : (node as SimpleAstNode);
    console.log(" ".repeat(indent), JSON.stringify(ast.v));
    for (const child of ast.c ?? []) {
        printSimpleAst(child, indent + 2);
    }
}
