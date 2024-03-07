import { Context } from "../../server/context";
import { Register, Template, View } from "../register";
import { Attributes } from "./source";
import { PartialView } from "./view";

/**
 * Wraps an imported partial module.
 */
export interface PartialModule {
    attributes: Attributes;
    html: string;
    default: (
        context: Context,
        attributes: Record<string, unknown>,
    ) => Record<string, unknown>;
}

export class PartialTemplate implements Template {
    constructor(
        public register: Register,
        public tag: string,
        public path: string,
        public module: PartialModule,
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
    async run(context: Context, attributes: Record<string, unknown>) {
        const fn = this.module.default;
        const result = await fn(context, attributes);
        return result;
    }

    /**
     * Creates a new view using this template.
     * @param subview An optional subview, which will be slotted.
     * @returns The created view.
     */
    present(context: Context, subview?: View): PartialView {
        return new PartialView(this, context, subview);
    }
}
