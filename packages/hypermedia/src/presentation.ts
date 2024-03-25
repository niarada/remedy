import { warn } from "@niarada/remedy-common";
import {
    HtmlElement,
    HtmlFragment,
    HtmlNode,
    HtmlSimpleAsyncTransformVisitor,
    HtmlSimpleTransformVisitor,
    PrintHtmlOptions,
    htmlTags,
    printHtml,
    simpleAsyncTransformHtml,
    simpleTransformHtml,
    simpleWalkHtml,
} from "@niarada/remedy-template";
import { Context } from "../../runtime/src/context";
import { Director } from "./director";
import { expressDefinedAttributesToStrings, transformExpressionsIntoStrings } from "./expressor";
import { transformFlowEach, transformFlowWhen } from "./flow";
import { Representation } from "./representation";

interface ActivationOptions {
    applyFormToAttributes?: boolean;
}

export class Presentation {
    constructor(
        private readonly director: Director,
        protected readonly representation: Representation,
        readonly template: HtmlFragment,
        readonly context: Context,
    ) {}

    /**
     * Execute the action tied to this presentation with the contained server context
     * and the attributes passed into this presentation instance.
     */
    async activate(options: ActivationOptions = {}): Promise<void> {
        if (options.applyFormToAttributes) {
            this.context.applyFormAttributes(this.representation.artifact.attributes);
        }
        this.context.coerceAttributes(this.representation.artifact.attributes);
        const actionResult =
            (await this.representation.artifact.action(
                this.context,
                ...this.context.definedAttributeValues(this.representation.artifact.attributes),
            )) ?? {};
        Object.assign(this.template.scope, this.context.attributes, actionResult);
    }

    async compose() {
        transformFlowWhen(this.template);
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
    async transform(visit: HtmlSimpleTransformVisitor | HtmlSimpleAsyncTransformVisitor) {
        await simpleAsyncTransformHtml(this.template, visit as HtmlSimpleAsyncTransformVisitor);
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
            if (node.type === "element" && node.tag !== "slot" && !htmlTags.includes(node.tag)) {
                candidates.push(node);
            }
        });
        for (const node of candidates) {
            const rep = await this.director.represent(node.tag);
            if (!rep) {
                warn("presentation", `No representation found for '${node.tag}'`);
                continue;
            }
            const attributes = expressDefinedAttributesToStrings(node, rep.artifact.attributes);
            const presentation = rep.present(this.context.withAttributes(attributes));
            await presentation.activate();
            await presentation.compose();
            presentation.replaceSlotWith(node.children);
            node.parent.children.splice(node.parent.children.indexOf(node), 1, ...presentation.template.children);
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
}
