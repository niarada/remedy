import { describe, expect, it } from "bun:test";
import { MarkdownSource } from "./source";

describe("markdown source", () => {
    it("compile", () => {
        const source = new MarkdownSource("# Hello");
        expect(source.code).toBe(
            [
                "export const attributes = {};",
                `export const template = "<h1>Hello</h1>\\n";`,
                "export async function action() { return {}; }\n",
            ].join("\n"),
        );
    });
});
