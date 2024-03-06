import { Attributes } from "~/partial/source";
import { Helper } from "./helper";
import { TemplateRegister } from "./register";
import { View } from "./view";

/**
 * Wraps an imported partial module.
 */
export interface TemplateModule extends Record<string, unknown> {
    attributes: Attributes;
    html: string;
    default: (
        helper: Helper,
        attributes: Record<string, unknown>,
    ) => Record<string, unknown>;
}

/**
 * Represents a template used for rendering views.
 */
export class Template {
    constructor(
        public register: TemplateRegister,
        public tag: string,
        public path: string,
        public module: TemplateModule,
    ) {}

    /**
     * @returns The partial's HTML.
     */
    get html(): string {
        return this.module.html;
    }

    /**
     * @returns The partial's attributes.
     */
    get attributes(): Attributes {
        return this.module.attributes;
    }

    /**
     * Runs the partial's code, with a helper and and any attributes, returning the
     * $scope from whence embedded expressions will evaluation.
     * @param helper The helper to use.
     * @param attributes The attributes to use.
     * @returns The resulting $scope
     */
    async run(helper: Helper, attributes: Record<string, unknown>) {
        const fn = this.module.default;
        const result = await fn(helper, attributes);
        return result;
    }

    /**
     * Creates a new view using this template.
     * @param subview An optional subview, which will be slotted.
     * @returns The created view.
     */
    present(subview?: View): View {
        return new View(this, subview);
    }
}
