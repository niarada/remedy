import { expect, test } from "bun:test";
import { parsePartial } from "./parser";
import { printHtml } from "./printer";

const source1 = `<item id="1" class={item.class}>{item.name}</item>\n`;
test("parser", () => {
    const ast = parsePartial(source1);
    expect(printHtml(ast)).toBe(source1);
});

const source2 = `<div><input id="i"></div>\n`;
test("void tag", () => {
    const ast = parsePartial(source2);
    expect(printHtml(ast)).toBe(source2);
});
