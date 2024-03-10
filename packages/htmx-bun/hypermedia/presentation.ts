import { warn } from "~/lib/log";
import { Context } from "~/server/context";
import { Attributes, Representation } from ".";
import { Director } from "./director";
import {
    expressDefinedAttributesToStrings,
    transformExpressionsIntoStrings,
} from "./expressor";
import { transformFlowEach } from "./flow";
import {
    HtmlElement,
    HtmlFragment,
    HtmlNode,
    HtmlSimpleTransformVisitor,
    PrintHtmlOptions,
    htmlTags,
    printHtml,
    simpleTransformHtml,
    simpleWalkHtml,
} from "./template";

export class Presentation {
    constructor(
        private readonly director: Director,
        protected readonly representation: Representation,
        readonly template: HtmlFragment,
        protected readonly context: Context,
        protected attributes: Attributes,
    ) {}

    /**
     * Execute the action tied to this presentation with the contained server context
     * and the attributes passed into this presentation instance.
     */
    async activate(): Promise<void> {
        this.coerceAttributes();
        Object.assign(
            this.template.scope,
            this.attributes,
            await this.representation.artifact.action(
                this.context,
                this.attributes,
            ),
        );
    }

    async compose() {
        transformFlowEach(this.template);
        await this.transformComposedHypermedia();
    }

    /**
     * "Flatten" all remaining expressions into strings.
     */
    async flatten() {
        transformExpressionsIntoStrings(this.template);
    }

    /**
     * Transforms the template with the supplied visitor function.
     * @param visit The supplied visitor function.
     */
    transform(visit: HtmlSimpleTransformVisitor) {
        simpleTransformHtml(this.template, visit);
    }

    /**
     * Transforms a copy of the template evaluating all expressions into
     * strings, returning the final html string.
     * @returns
     */
    render(options: Partial<PrintHtmlOptions> = {}) {
        return printHtml(this.template, options);
    }

    /**
     * Walks the html ast and resolves embedded hypermedia tags,
     * replacing them with their composed presentation.
     */
    async transformComposedHypermedia() {
        const candidates: HtmlElement[] = [];
        simpleWalkHtml(this.template, (node) => {
            if (
                node.type === "element" &&
                node.tag !== "slot" &&
                !htmlTags.includes(node.tag)
            ) {
                candidates.push(node);
            }
        });
        for (const node of candidates) {
            const rep = await this.director.represent(node.tag);
            if (!rep) {
                warn(
                    "presentation",
                    `No representation found for '${node.tag}'`,
                );
                return node;
            }
            const attributes = expressDefinedAttributesToStrings(
                node,
                rep.artifact.attributes,
            );
            const presentation = rep.present(this.context, attributes);
            await presentation.activate();
            await presentation.compose();
            presentation.replaceSlotWith(node.children);
            node.parent.children.splice(
                node.parent.children.indexOf(node),
                1,
                ...presentation.template.children,
            );
        }
    }

    replaceSlotWith(nodes: HtmlNode[]) {
        simpleTransformHtml(this.template, (node) => {
            if (node.type === "element" && node.tag === "slot") {
                return nodes;
            }
            return node;
        });
    }

    coerceAttributes() {
        const attributes: Attributes = {};
        for (const [key, type] of Object.entries(
            this.representation.artifact.attributes,
        )) {
            if (type === "number") {
                attributes[key] = Number(this.attributes[key]);
            } else if (type === "boolean") {
                attributes[key] = Boolean(this.attributes[key]);
            } else {
                // warn(
                //     "presentation",
                //     `Unknown attribute type: ${type}`,
                //     this.representation.artifact.attributes,
                // );
                attributes[key] = this.attributes[key];
            }
        }
        this.attributes = attributes;
    }
}
