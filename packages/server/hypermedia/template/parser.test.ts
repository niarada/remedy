import { describe, expect, it } from "bun:test";
import { getNode, getTokenImage } from ".";
import { parse } from "./parser";

describe("parser", () => {
    it("should parse an empty document", () => {
        const { errors } = parse("");
        expect(errors).toEqual([]);
    });

    it("should parse code contents as text", () => {
        const { document } = parse("<div><code>{foo}</code></div>");
        const node = getNode(document, "fragment", "element", "fragment", "code");
        const text = getTokenImage(node, "CodeText");
        expect(text).toBe("{foo}");
    });
});
