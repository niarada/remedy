import { Context } from "~/server/context";
import { Director } from "./director";
import { Presentation } from "./presentation";
import {
    HtmlFragment,
    Scope,
    cloneHtml,
    createHtmlFragment,
    parseSource,
} from "./template";

export type AttributeType = string | boolean | number;
export type AttributeTypeString = "string" | "boolean" | "number";
export type AttributeTypes = Record<string, AttributeTypeString>;
export type Attributes = Record<string, AttributeType>;

export type ArtifactKind = "partial" | "markdown";

/**
 * The representation's source code.
 */
export abstract class Source {
    private compiled = false;

    /**
     * @param text The text content of the source.
     */
    constructor(
        protected readonly text: string,
        readonly path?: string,
    ) {}
    abstract readonly kind: ArtifactKind;

    /**
     * The source code for the action function.
     */
    get action() {
        return "export async function action() { return {}; }\n";
    }

    /**
     * The attribute types as a JSON string.
     */
    get attributes() {
        return "{}";
    }

    /**
     * The template as an html string.
     */
    get template() {
        return "";
    }

    /**
     * Implementors will fullfill whatever they needs here to be able to present their
     * action, attributes, and template to the code getter.
     */
    protected abstract compile(): void;

    get code(): string {
        if (!this.compiled) {
            this.compile();
            this.compiled = true;
        }
        return [
            `export const attributes = ${this.attributes};`,
            `export const template = ${this.template};`,
            this.action,
        ].join("\n");
    }
}

/**
 * An imported source module.
 */
export interface Artifact {
    kind: ArtifactKind;
    attributes: AttributeTypes;
    action($context: Context): Promise<Scope>;
    template: string;
}

/**
 * The representation of an imported source artifact.
 *
 * The representation precedes the presentation.  Only one representation instance of a of a source
 * artifact will be loaded at any time and serve as the prototype for presentations, which are
 * instantiated throught the `present` method.
 */
export class Representation {
    protected template: HtmlFragment;

    constructor(
        readonly director: Director,
        readonly tag: string,
        readonly artifact: Artifact,
        readonly path?: string,
    ) {
        this.template = this.artifact.template
            ? parseSource(this.artifact.template)
            : createHtmlFragment();
    }

    /**
     * A presentation of a representation.
     * @param context The server context
     * @param attributes The attribute values passed into this presentation instance.
     * @returns
     */
    present(context: Context): Presentation {
        const template = cloneHtml(this.template) as HtmlFragment;
        if (this instanceof VariableRepresentation) {
            return new Presentation(
                this.director,
                this,
                template,
                context.withAttributes(this.variables),
            );
        }
        return new Presentation(this.director, this, template, context);
    }
}

export class VariableRepresentation extends Representation {
    constructor(
        representation: Representation,
        readonly variables: Record<string, string>,
    ) {
        super(
            representation.director,
            representation.tag,
            representation.artifact,
            representation.path,
        );
    }
}
