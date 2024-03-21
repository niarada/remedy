import { describe, expect, it } from "bun:test";
import { Director } from "~/hypermedia/director";
import { MarkdownSource } from "./source";

const director = new Director();

describe("markdown presentation", () => {
    it("should present", async () => {
        await director.prepare("joy", new MarkdownSource("# Joy"));
        const rep = await director.represent("joy");
        expect(rep!.artifact.template).toBe("<h1>Joy</h1>\n");
    });
});
