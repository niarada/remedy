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
     * Interpolates the specified name in the template using the provided environment.
     * @param name - The name to interpolate.
     * @param env - The environment object.
     * @returns The interpolated string.
     */
    // interpolate(name: string, env: Record<string, unknown>) {
    //     const fn = this.module[name] as (
    //         env: Record<string, unknown>,
    //     ) => string;
    //     if (fn) {
    //         return fn(env);
    //     }
    //     // XXX: Raise error
    //     error(`No interpolation function found for ${name}`);
    //     return "";
    // }

    /**
     * Creates a new view using this template.
     * @returns The created view.
     */
    present() {
        return new View(this);
    }

    /**
     * Discovers and extracts the interpolation functions from the template module.
     * @returns An array of extract objects.
     */
    // extracts(): Extract[] {
    //     const results = [];
    //     const extRe = /\$ext\d+/g;
    //     let match: RegExpExecArray | null;
    //     while ((match = extRe.exec(this.module.html)) !== null) {
    //         results.push({
    //             name: match[0],
    //             fn: this.module[match[0]],
    //         } as Extract);
    //     }
    //     return results;
    // }
}

/**
 * Represents an extracted template interpolation.
 * @interface Extract
 */
// interface Extract {
//     name: string;
//     fn: () => unknown;
// }
