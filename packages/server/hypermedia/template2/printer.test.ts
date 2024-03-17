import { expect, test } from "bun:test";
import { parseSource, printHtml } from ".";

const source1 = `
<div>
    <h1>love peace joy</h1>
</div>
`;

const target1 = "<div><h1>love peace joy</h1></div>";

test("print trimmed", () => {
    const ast = parseSource(source1);
    expect(printHtml(ast, { trim: true })).toBe(target1);
});
