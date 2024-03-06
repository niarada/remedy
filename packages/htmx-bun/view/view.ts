import { error, warn } from "~/lib/log";
import { HtmlElement, HtmlFragment, createHtmlText } from "~/partial/ast";
import { parsePartial } from "~/partial/parser";
import { concatAttributeValue, printHtml } from "~/partial/printer";
import { HtmlTransformVisitor, transformHtml } from "~/partial/transform";
import { Helper } from "./helper";
import { Template } from "./template";

export class View {
    #template: Template;
    #subview?: View;
    #assembled = false;
    #html: HtmlFragment;
    #locals: Record<string, unknown> = {};
    #helper: Helper;
    #attributes: Record<string, unknown> = {};

    constructor(template: Template, subview?: View) {
        this.#template = template;
        this.#subview = subview;
        this.#html = parsePartial(template.html);
        this.#helper = new Helper();
    }

    get helper() {
        return this.#helper;
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
    async assemble(attributes: Record<string, unknown> = {}) {
        if (this.#assembled) {
            return;
        }
        this.#assembled = true;
        await this.#subview?.assemble();
        this.#attributes = this.coerceAttributes(attributes);
        this.#locals = await this.#template.run(this.#helper, attributes);
        await transformHtml(
            this.#html,
            async (node, { visitEachChild, visitNode }) => {
                if (node.type === "element") {
                    if (node.tag === "slot") {
                        if (this.#subview) {
                            return this.#subview.children;
                        }
                        return ((await visitEachChild(node)) as HtmlElement)
                            .children;
                    }
                    // Handling the 'each' iterator
                    // XXX: Extract this at some point
                    const each = this.expressAttributeValue(
                        node,
                        "mx-each",
                    ) as unknown[];
                    const as = this.expressAttributeValue(
                        node,
                        "mx-as",
                    ) as string;
                    if (each && !as) {
                        warn(
                            "view",
                            `Missing 'mx-as' attribute in 'mx-each' iterator for ${node.tag}`,
                        );
                    } else if (!each && as) {
                        warn(
                            "view",
                            `Unused 'mx-as' attribute for ${node.tag}`,
                        );
                    } else if (each && !Array.isArray(each)) {
                        warn(
                            "view",
                            `Invalid 'mx-each' attribute for ${node.tag}, not an Array`,
                        );
                    } else if (each) {
                        const children = [];
                        for (const item of each) {
                            const child = structuredClone(node);
                            child.attrs = child.attrs.filter(
                                (attr) =>
                                    !["mx-each", "mx-as"].includes(attr.name),
                            );
                            this.interpolateAttributesToText(child, {
                                [as]: item,
                            });
                            children.push(await visitNode(child));
                        }
                        return children.flat();
                    }
                    const subtemplate = this.#template.register.get(node.tag);
                    if (subtemplate) {
                        const subview = subtemplate.present();
                        await subview.assemble(
                            this.expressAttributesAsText(node),
                        );
                        return subview.children;
                    }
                    this.interpolateAttributesToText(node);
                } else if (node.type === "expression") {
                    return createHtmlText(
                        node.parent,
                        String(this.express(node.content)),
                    );
                }
                return await visitEachChild(node);
            },
        );
    }

    /**
     * Gets all top level nodes in the html tree.
     */
    private get children() {
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
            if (attribute.type === "number") {
                attributes[attribute.name] = Number(attributes[attribute.name]);
            } else if (attribute.type === "boolean") {
                attributes[attribute.name] = Boolean(
                    attributes[attribute.name],
                );
            }
        }
        return attributes;
    }

    /**
     * Interpolates the attributes of an HTML element.
     * Replaces attribute expressions with their evaluated results.
     *
     * @param node - The HTML element node.
     */
    interpolateAttributesToText(
        node: HtmlElement,
        additionalScope: Record<string, unknown> = {},
    ) {
        for (const attr of node.attrs) {
            for (let i = 0; i < attr.value.length; i++) {
                const value = attr.value[i];
                if (value.type === "expression") {
                    attr.value[i] = {
                        type: "text",
                        content: String(
                            this.express(value.content, additionalScope),
                        ),
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
    expressAttributesAsText(node: HtmlElement) {
        const obj: Record<string, string> = {};
        const attrs = structuredClone(node.attrs);
        for (const attr of attrs) {
            for (let i = 0; i < attr.value.length; i++) {
                if (attr.value[i].type === "expression") {
                    attr.value[i] = {
                        type: "text",
                        content: String(this.express(attr.value[i].content)),
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
            console.log("$scope:", $scope);
            console.log(e);
            return undefined;
        }
    }
}
