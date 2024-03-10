import { expect, test } from "bun:test";
import { simpleWalkHtml } from ".";
import { parseSource } from "./parser";
import { printHtml } from "./printer";

const source1 = `<item id="1" class={item.class}>{item.name}</item>\n`;
test("parser", () => {
    const ast = parseSource(source1);
    expect(printHtml(ast)).toBe(source1);
});

const source2 = `<div><input id="i" focus></div>\n`;
test("void tag", () => {
    const ast = parseSource(source2);
    expect(printHtml(ast)).toBe(source2);
});

const source3 = `<div class="foo {item.cls} baz" id={id}></div>\n`;
test("complex attribute", () => {
    const ast = parseSource(source3);
    expect(printHtml(ast)).toBe(source3);
});

const source4 = `<html>
    <head>
        <title>htmx-bun: documenation</title>
    </head>
    <body class="flex flex-col bg-slate-700 text-white p-2">
        <header class="flex justify-between items-center gap-4 pb-2 mb-6 border-b border-b-slate-500">
            <a class="flex items-center gap-4" href="/">
                <img src="/assets/icon-light.png" class="h-8 w-8">
                <div class="font-bold">htmx-bun</div>
            </a>
        </header>
    </body>
</html>
`;
test("void tags in there", () => {
    const ast = parseSource(source4);
    expect(printHtml(ast)).toBe(source4);
});

test("scope", () => {
    const ast = parseSource(source4, { gift: "kindness" });
    simpleWalkHtml(ast, (node) => {
        expect(node.scope.gift).toBe("kindness");
    });
});
