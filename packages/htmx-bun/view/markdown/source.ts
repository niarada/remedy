import markdown from "markdown-it";

export class MarkdownSource {
    #text: string;

    /**
     * Creates a new instance of the MarkdownSource class from a string.
     * @param path The path of the source.
     */
    constructor(text: string) {
        this.#text = text;
    }

    /**
     * Creates a new instance of the MarkdownSource class from a path.
     * @param path The path of the source.
     */
    static async fromPath(path: string) {
        return new MarkdownSource(await Bun.file(path).text());
    }

    /**
     * Compile the source into TypeScript that can be loaded as a module by the loader plugin.
     * @returns The TypeScript source code.
     */
    async compile() {
        const html = markdown().render(this.#text);
        return `export const html = ${JSON.stringify(html)};`;
    }
}
