import { describe, expect, it } from "bun:test";
import { parse } from "./parser";
import { getNode, getSimpleAst } from "./util";

describe("parser", () => {
    it("should parse an empty document", () => {
        const { errors } = parse("");
        expect(errors).toEqual([]);
    });

    it("should parse code contents as text", () => {
        const { document, errors } = parse("<div><code>{foo}</code></div>");
        expect(errors).toEqual([]);
        expect(getSimpleAst(document)).toEqual({
            v: "document",
            c: [
                {
                    v: "fragment",
                    c: [
                        {
                            v: "element",
                            c: [
                                { v: "<div" },
                                { v: ">" },
                                {
                                    v: "fragment",
                                    c: [
                                        {
                                            v: "opaque",
                                            c: [{ v: "<code" }, { v: ">" }, { v: "{foo}" }, { v: "</code>" }],
                                        },
                                    ],
                                },
                                { v: "</div>" },
                            ],
                        },
                    ],
                },
            ],
        });
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
