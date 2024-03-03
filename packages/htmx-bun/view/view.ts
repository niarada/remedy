import {
    HtmlFragment,
    HtmlTransformer,
    attributesToObject,
    parseHtml,
    printHtmlSyntaxTree,
    transformHtml,
} from "../lib/html";
import { Helper } from "./helper";
import { Template } from "./template";

export class View {
    #assembled = false;
    #html: HtmlFragment;
    #locals: Record<string, unknown> = {};
    #helper: Helper;
    #attributes: Record<string, unknown> = {};

    constructor(public template: Template) {
        this.#html = parseHtml(template.html);
        this.#helper = new Helper();
    }

    get helper() {
        return this.#helper;
    }

    async render(attributes: Record<string, unknown> = {}): Promise<string> {
        if (!this.#assembled) {
            await this.assemble(attributes);
        }
        return await printHtmlSyntaxTree(this.#html);
    }

    async assemble(attributes: Record<string, unknown> = {}) {
        this.#assembled = true;
        this.#attributes = this.coerceAttributes(attributes);
        this.#locals = await this.template.run(this.#helper, attributes);
        await transformHtml(
            this.#html,
            async (node, { visitEachChild, visitNode }) => {
                if (node.type === "element") {
                    // Handling the 'for' attribute
                    const iterator = node.attrs.find(
                        (attr) => attr.name === "for",
                    );
                    if (iterator) {
                        // Matches something like "item of items"
                        const match = iterator.value.match(
                            /([^\s]+)\s+of\s+([^\s]+)/,
                        );
                        if (match) {
                            const list = this.#locals[match[2]] as unknown[];
                            const children = [];
                            for (const item of list) {
                                const child = structuredClone(node);
                                child.attrs = child.attrs.filter(
                                    (attr) => attr.name !== "for",
                                );
                                for (const attr of child.attrs) {
                                    attr.value = this.interpolate(attr.value, {
                                        [match[1]]: item,
                                    });
                                }
                                children.push(await visitNode(child));
                            }
                            return children.flat();
                        }
                    }
                    const subtemplate = this.template.register.get(node.tag);
                    if (subtemplate) {
                        const subview = subtemplate.present();
                        await subview.assemble(attributesToObject(node.attrs));
                        return subview.children;
                    }
                    for (const attr of node.attrs) {
                        attr.value = this.interpolate(attr.value);
                    }
                } else if (node.type === "text") {
                    node.content = this.interpolate(node.content);
                }
                return await visitEachChild(node);
            },
        );
    }

    private interpolate(text: string, env: Record<string, unknown> = {}) {
        return text.replace(/\$exp\d+/g, (match) => {
            try {
                const value = this.interpolationValue(match, env);
                return (value as object).toString();
            } catch (e) {
                // error(
                //     `Error interpolating ${match}:`,
                //     this.#locals[match]!.toString(),
                // );
                return "";
            }
        });
    }

    private interpolationValue(
        exp: string,
        env: Record<string, unknown> = {},
    ): unknown {
        const expression = this.#locals[exp];
        if (expression) {
            return (expression as (env: Record<string, unknown>) => unknown)(
                Object.assign({}, this.#attributes, this.#locals, env),
            );
        }
    }

    private get children() {
        return this.#html.children;
    }

    async transform(transformer: HtmlTransformer) {
        await transformHtml(
            this.#html,
            async (node, { visitEachChild, visitNode }) => {
                const results = await transformer(node, {
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

    coerceAttributes(attributes: Record<string, unknown>) {
        for (const attribute of this.template.attributes) {
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
}
