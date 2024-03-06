import { Register, Template } from "../register";
import { MarkdownView } from "./view";

/**
 * Wraps an imported partial module.
 */
export interface MarkdownModule {
    html: string;
}

/**
 * Represents a template used for rendering views.
 */
export class MarkdownTemplate implements Template {
    constructor(
        public register: Register,
        public tag: string,
        public path: string,
        public module: MarkdownModule,
    ) {}

    /**
     * @returns The partial's HTML.
     */
    get html(): string {
        return this.module.html;
    }

    /**
     * Creates a new view using this template.
     * @returns The created view.
     */
    present(): MarkdownView {
        return new MarkdownView(this);
    }
}
