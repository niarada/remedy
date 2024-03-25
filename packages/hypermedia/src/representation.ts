import { HtmlFragment, cloneHtml, createHtmlFragment, parseSource } from "@niarada/remedy-template";
import { Context } from "../../runtime/src/context";
import { Artifact } from "./artifact";
import { Director } from "./director";
import { Presentation } from "./presentation";

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
        if (this.artifact.template) {
            const { ast } = parseSource(this.artifact.template);
            this.template = ast;
        } else {
            this.template = createHtmlFragment();
        }
    }

    /**
     * A presentation of a representation.
     * @param context The server context
     * @param attributes The attribute values passed into this presentation instance.
     * @returns
     */
    present(context: Context): Presentation {
        // console.log(this, this.template);
        const template = cloneHtml(this.template) as HtmlFragment;
        if (this instanceof VariableRepresentation) {
            return new Presentation(this.director, this, template, context.withAttributes(this.variables));
        }
        return new Presentation(this.director, this, template, context);
    }
}

export class VariableRepresentation extends Representation {
    constructor(
        representation: Representation,
        readonly variables: Record<string, string>,
    ) {
        super(representation.director, representation.tag, representation.artifact, representation.path);
    }
}
