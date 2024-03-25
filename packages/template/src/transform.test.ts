import { describe, expect, it } from "bun:test";
import { parseSource } from "./ast";
import { printHtml } from "./printer";
import { cloneHtml, simpleTransformHtml, walkHtml } from "./transform";

describe("transform", () => {
    it("should be idempotent", () => {
        const source = `<div><p id="joy">χαρά</p></div>\n`;
        const { ast } = parseSource(source);
        simpleTransformHtml(ast, (node) => {
            return node;
        });
        expect(printHtml(ast)).toBe(source);
    });

    it("should transform", () => {
        const { ast } = parseSource(`<div><p id="joy">χαρά</p></div>\n`);
        simpleTransformHtml(ast, (node) => {
            if (node.type === "element" && node.tag === "p") {
                node.attrs[0].value[0].content = "love";
            }
            if (node.type === "text" && node.content === "χαρά") {
                node.content = "ἀγαπάω";
            }
            return node;
        });
        expect(printHtml(ast)).toBe(`<div><p id="love">ἀγαπάω</p></div>\n`);
    });

    it("should allow delete", () => {
        const { ast } = parseSource(`<div><p id="joy">χαρά</p></div>\n`);
        simpleTransformHtml(ast, (node) => {
            if (node.type === "element" && node.tag === "p") {
                return;
            }
            return node;
        });
        expect(printHtml(ast)).toBe("<div></div>\n");
    });

    it("should allow replacement with array", () => {
        const { ast } = parseSource(`<div><p id="joy">χαρά</p></div>\n`);
        simpleTransformHtml(ast, (node) => {
            if (node.type === "element" && node.tag === "p") {
                return [node, structuredClone(node), structuredClone(node)];
            }
            return node;
        });
        expect(printHtml(ast)).toBe(`<div><p id="joy">χαρά</p><p id="joy">χαρά</p><p id="joy">χαρά</p></div>\n`);
    });

    it("should clone ast", () => {
        const text = "<a><a><a foo='bar' baz=`bam`></a></a></a>";
        const { ast } = parseSource(text, {
            gift: "faithfulness",
        });
        const target = cloneHtml(ast);
        target.scope.gift = "temperance";
        walkHtml(target, (node) => {
            expect(node.scope.gift).toBe("temperance");
        });
        expect(printHtml(target, { trim: true })).toBe(text);
    });
});
