import { describe, expect, it } from "bun:test";
import { parseSource, printHtml } from ".";

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
});
