import { describe, expect, it } from "bun:test";
import { parse } from "./parser";
import { getNode, getTokenImage } from "./util";

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

    it("should properly parse void tags", () => {
        const source = ["<div>", "    <slot><hr></slot>", "</div>\n"].join("\n");
        const { document } = parse(source);
        const slot = getNode(document, "fragment", "element", "fragment", "element");
        expect(() => getNode(slot, "fragment", "text", "Text")).toThrow();
    });

    it("should properly parse self closing tags", () => {
        const source = ["<div>", "    <slot><div /></slot>", "</div>\n"].join("\n");
        const { document } = parse(source);
        const slot = getNode(document, "fragment", "element", "fragment", "element");
        expect(() => getNode(slot, "fragment", "text", "Text")).toThrow();
    });
});
