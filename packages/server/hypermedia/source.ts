import { ArtifactKind } from "./artifact";

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
        return '""';
    }

    /**
     * The script as an empty string.
     */
    get script() {
        return '""';
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
            `export const script = ${this.script};`,
            this.action,
        ].join("\n");
    }
}
