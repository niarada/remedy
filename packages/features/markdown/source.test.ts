import { Director } from "@niarada/remedy";
import { describe, expect, it } from "bun:test";
import { MarkdownSource } from "./source";

const director = new Director();

describe("markdown/source", () => {
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

    it("should present", async () => {
        await director.prepare("joy", new MarkdownSource("# Joy"));
        const rep = await director.represent("joy");
        expect(rep!.artifact.template).toBe("<h1>Joy</h1>\n");
    });
});
