import { expect, test } from "bun:test";
import { parsePartial } from "./parser";
import { printHtml } from "./printer";

const source1 = `<item id="1" class={item.class}>{item.name}</item>\n`;
test("parser", () => {
    const ast = parsePartial(source1);
    expect(printHtml(ast)).toBe(source1);
});

const source2 = `<div><input id="i" focus></div>\n`;
test("void tag", () => {
    const ast = parsePartial(source2);
    expect(printHtml(ast)).toBe(source2);
});

const source3 = `<div class="foo {item.cls} baz" id={id}></div>\n`;
test("complex attribute", () => {
    const ast = parsePartial(source3);
    console.log(printHtml(ast));
    expect(printHtml(ast)).toBe(source3);
});
