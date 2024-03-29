import { describe, expect, it } from "bun:test";
import { parseSource } from "./ast";
import { printHtml } from "./printer";

describe("printer", () => {
    it("trims when asked", () => {
        const { ast } = parseSource(`
            <div>
                <h1>love peace joy</h1>
            </div>
        `);
        expect(printHtml(ast, { trim: true })).toBe("<div><h1>love peace joy</h1></div>");
    });

    it("should print code", () => {
        const { ast } = parseSource(`
            <div><pre><code>a {code} block</code></pre></div>
        `);
        expect(printHtml(ast, { trim: true })).toBe("<div><pre><code>a {code} block</code></pre></div>");
    });

    it("should not change this code", () => {
        const source = ["<div>", "    <slot><div /></slot>", "</div>\n"].join("\n");
        const { ast } = parseSource(source);
        expect(printHtml(ast, { expandSelfClosing: false })).toBe(source);
    });

    it("should remove value part of empty attributes", () => {
        const { ast } = parseSource('<div attr="" />');
        expect(printHtml(ast, { trim: true, expandSelfClosing: false })).toBe("<div attr />");
    });
});
