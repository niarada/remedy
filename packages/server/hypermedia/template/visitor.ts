import { CstElement, CstNode, ICstVisitor } from "chevrotain";
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
