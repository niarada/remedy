import { Helper } from "./helper";
import { TemplateRegister } from "./register";
import { Attributes } from "./source";
import { View } from "./view";

/**
 * Represents a template module.
 */
export interface TemplateModule extends Record<string, unknown> {
    html: string;
    code: string;
    attributes: Attributes;
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
     * Gets the presentation of the template.
     */
    get html() {
        return this.module.html;
    }

    /**
     * Gets the code of the template.
     * @returns The code of the template.
     */
    get code() {
        return this.module.code;
    }

    get attributes() {
        return this.module.attributes;
    }

    async run(helper: Helper, attributes: Record<string, unknown>) {
        const fn = this.module.$run as (
            helper: Helper,
            attributes: Record<string, unknown>,
        ) => Record<string, unknown>;
        const result = await fn(helper, attributes);
        return result;
    }
    /**
     * Creates a new view using this template.
     * @returns The created view.
     */
    present(subview?: View): View {
        // const subview = subtemplate
        //     ? this.register.get(subtemplate)?.present()
        //     : undefined;
        return new View(this, subview);
    }
}
