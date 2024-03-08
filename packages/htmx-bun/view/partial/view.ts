import { error, warn } from "~/lib/log";
import { HtmlElement, HtmlFragment, createHtmlText } from "~/view/partial/ast";
import { parsePartial } from "~/view/partial/parser";
import { concatAttributeValue, printHtml } from "~/view/partial/printer";
import {
    HtmlTransformVisitNodeFunction,
    HtmlTransformVisitor,
    transformHtml,
} from "~/view/partial/transform";
import { Context } from "../../server/context";
import { View } from "../register";
import { PartialTemplate } from "./template";

export class PartialView {
    #template: PartialTemplate;
    #subview?: View;
    #assembled = false;
    #html: HtmlFragment;
    #locals: Record<string, unknown> = {};
    #context: Context;
    #attributes: Record<string, unknown> = {};

    constructor(template: PartialTemplate, context: Context, subview?: View) {
        this.#template = template;
        this.#subview = subview;
        this.#html = parsePartial(template.html);
        this.#context = context;
    }

    async render(attributes: Record<string, unknown> = {}): Promise<string> {
        await this.assemble(attributes);
        return printHtml(this.#html);
    }

    /**
     * Final assembly of a view based on its template, attributes, locals, and subview if any.
     * This is where the parial script code is run.
     *
     * @param attributes - The attributes to be used during assembly.
     */
    async assemble(attributes = {}, additionalAssemblyScope = {}) {
        if (this.#assembled) {
            return;
        }
        this.#assembled = true;
        await this.#subview?.assemble();
        this.#attributes = this.coerceAttributes(attributes);
        this.#locals = Object.assign(
            await this.#template.run(this.#context, attributes),
            additionalAssemblyScope,
        );
        await transformHtml(
            this.#html,
            async (node, { visitEachChild, visitNode }, additionalScope) => {
                if (node.type === "element") {
                    if (node.tag === "slot") {
                        if (this.#subview) {
                            return this.#subview.children;
                        }
                        return (
                            (await visitEachChild(
                                node,
                                additionalScope,
                            )) as HtmlElement
                        ).children;
                    }
                    const each = await this.each(
                        node,
                        visitNode,
                        additionalScope,
                    );
                    if (each) {
                        return each;
                    }
                    const subtemplate = this.#template.register.get(node.tag);
                    if (subtemplate) {
                        const subview = subtemplate.present(this.#context);
                        await subview.assemble(
                            this.expressAttributesAsText(node, additionalScope),
                        );
                        return subview.children;
                    }
                    this.interpolateAttributesToString(node, additionalScope);
                } else if (node.type === "expression") {
                    return createHtmlText(
                        node.parent,
                        String(this.express(node.content, additionalScope)),
                    );
                }
                return await visitEachChild(node, additionalScope);
            },
        );
    }

    /**
     * Gets all top level nodes in the html tree.
     */
    get children() {
        return this.#html.children;
    }

    /**
     * Transforms the HTML using the provided visitor.  Used by feature middleware.
     *
     * @param visit - The visitor function to apply to each HTML node.
     */
    async transform(visit: HtmlTransformVisitor) {
        await transformHtml(
            this.#html,
            async (node, { visitEachChild, visitNode }) => {
                const results = await visit(node, {
                    visitEachChild,
                    visitNode,
                });
                const nodes = [results]
                    .flat()
                    .filter((it) => it) as HtmlFragment[];
                for (const node of nodes) {
                    await visitEachChild(node);
                }
                return nodes;
            },
        );
    }

    /**
     * Coerces an object of attributes to the types specified in the template, if any.
     *
     * @param attributes - The attributes to be coerced.
     * @returns The coerced attributes.
     */
    coerceAttributes(attributes: Record<string, unknown>) {
        for (const attribute of this.#template.attributes) {
            if (attribute.type === "string") {
                continue;
            }
            if (attribute.type === "number") {
                attributes[attribute.name] = Number(attributes[attribute.name]);
            } else if (attribute.type === "boolean") {
                attributes[attribute.name] = Boolean(
                    attributes[attribute.name],
                );
            } else {
                attributes[attribute.name] = JSON.parse(
                    attributes[attribute.name] as string,
                );
            }
        }
        return attributes;
    }

    /**
     * Interpolates the attributes of an HTML element.
     * Replaces attribute expressions with their evaluated results
     * coerced to strings.
     *
     * @param node - The HTML element node.
     */
    interpolateAttributesToString(
        node: HtmlElement,
        additionalScope: Record<string, unknown> = {},
    ) {
        for (const attr of node.attrs) {
            for (let i = 0; i < attr.value.length; i++) {
                const value = attr.value[i];
                if (value.type === "expression") {
                    const expressed = this.express(
                        value.content,
                        additionalScope,
                    );
                    attr.value[i] = {
                        type: "text",
                        content:
                            typeof expressed === "object"
                                ? JSON.stringify(expressed)
                                : String(expressed),
                    };
                }
            }
        }
    }

    /**
     * Converts an element's attributes into an object, evaluating expressions in
     * this view's scope.  This is useful for passing attributes to subviews.
     * @param attrs The attributes for an element on this node.
     * @returns An object of the nodes attributes evaluated.
     */
    expressAttributesAsText(
        node: HtmlElement,
        additionalScope: Record<string, unknown> = {},
    ) {
        const obj: Record<string, string> = {};
        const attrs = structuredClone(node.attrs);
        for (const attr of attrs) {
            for (let i = 0; i < attr.value.length; i++) {
                if (attr.value[i].type === "expression") {
                    attr.value[i] = {
                        type: "text",
                        content: String(
                            this.express(
                                attr.value[i].content,
                                additionalScope,
                            ),
                        ),
                    };
                }
            }
            obj[attr.name] = concatAttributeValue(attr) || "true";
        }
        return obj;
    }

    expressAttributeValue(node: HtmlElement, name: string): unknown {
        for (const attr of node.attrs) {
            if (attr.name === name) {
                if (
                    attr.value.length === 1 &&
                    attr.value[0].type === "expression"
                ) {
                    return this.express(attr.value[0].content);
                }
                const copy = structuredClone(attr);
                for (let i = 0; i < copy.value.length; i++) {
                    const value = copy.value[i];
                    if (value.type === "expression") {
                        attr.value[i] = {
                            type: "text",
                            content: String(this.express(value.content)),
                        };
                    }
                }
                return concatAttributeValue(copy) || "true";
            }
        }
    }

    /**
     * Evaluates the given expression in the context of the view.
     *
     * @param expression - The expression to evaluate.
     * @param additionalScope - Additional scope to use when evaluating the expression.
     * @returns The result of evaluating the expression.
     */
    express(
        expression: string,
        additionalScope: Record<string, unknown> = {},
    ): unknown {
        const $scope = Object.assign(
            {},
            this.#attributes,
            this.#locals,
            additionalScope,
        );
        const express = new Function("$scope", `return ${expression}`);
        try {
            return express($scope);
        } catch (e) {
            error(
                "view",
                `Error evaluating expression in '${this.#template.path}': ${expression}`,
            );
            delete $scope.Context;
            delete $scope.Attributes;
            console.log("$scope:", $scope);
            console.log(e);
            return undefined;
        }
    }

    /**
     * Checks if an element has a mx-each and mx-as attributes, and if so returns
     * copies of itself based on the iterated value.
     * @param node The HTML element to check and use as template.
     * @param visitNode Transformer function used on newly cloned children.
     * @returns The array of nodes derived from the iteration.
     */
    async each(
        node: HtmlElement,
        visitNode: HtmlTransformVisitNodeFunction,
        additionalScope: Record<string, unknown> = {},
    ) {
        const each = this.expressAttributeValue(node, "mx-each") as unknown[];
        const as = this.expressAttributeValue(node, "mx-as") as string;
        if (!each) {
            if (as) {
                warn("view", `Unused 'mx-as' attribute for ${node.tag}`);
            }
            return;
        }
        if (!as) {
            warn(
                "view",
                `Missing 'mx-as' attribute in 'mx-each' iterator for ${node.tag}`,
            );
            return;
        }
        if (!Array.isArray(each)) {
            warn(
                "view",
                `Invalid 'mx-each' attribute for ${node.tag}, not an Array`,
            );
            return;
        }
        const children = [];
        for (const item of each) {
            const child = structuredClone(node);
            child.attrs = child.attrs.filter(
                (attr) => !["mx-each", "mx-as"].includes(attr.name),
            );
            this.interpolateAttributesToString(
                child,
                Object.assign({}, additionalScope, {
                    [as]: item,
                }),
            );
            children.push(
                await visitNode(
                    child,
                    Object.assign({}, additionalScope, {
                        [as]: item,
                    }),
                ),
            );
        }
        return children.flat();
    }
}
