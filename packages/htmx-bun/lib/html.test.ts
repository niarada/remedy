import { expect, test } from "bun:test";
import {
    HtmlParent,
    parseHtml,
    printHtmlSyntaxTree,
    transformHtml,
} from "./html";

test("parse and print", async () => {
    const html = `<div>\n    <h1 class="monk">Test</h1>\n    <p>Test</p>\n</div>\n`;
    const root = parseHtml(html);
    const printed = await printHtmlSyntaxTree(root);
    expect(printed).toBe(html);
});

test("embedded fragment", async () => {
    const a = "<div></div>";
    const b = "<span></span>";
    const aa = parseHtml(a);
    const bb = parseHtml(b);
    (aa.children[0] as HtmlParent).children.push(bb);
    expect(await printHtmlSyntaxTree(aa)).toBe("<div><span></span></div>\n");
});

// test("transform", async () => {
//     const html = `<div><h1 class="monk">Monk</h1></div>`;
//     const root = parseHtml(html);
//     await transformHtmlSyntaxTree(root, (node) => {
//         if (node.type === "element" && node.tag === "h1") {
//             node.attrs[0].value = "priest";
//         }
//         if (node.type === "text" && node.content === "Monk") {
//             node.content = "Priest";
//         }
//         return node;
//     });
//     const printed = await printHtmlSyntaxTree(root);
//     expect(printed).toBe(`<div><h1 class="priest">Priest</h1></div>\n`);
// });

test("transform", async () => {
    const html = `<div><h1 class="monk">Monk</h1></div>`;
    const root = parseHtml(html);
    await transformHtml(root, async (node, { visitEachChild }) => {
        if (node.type === "element" && node.tag === "h1") {
            node.attrs[0].value = "priest";
        }
        if (node.type === "text" && node.content === "Monk") {
            node.content = "Priest";
        }
        await visitEachChild(node);
        return node;
    });
    const printed = await printHtmlSyntaxTree(root);
    expect(printed).toBe(`<div><h1 class="priest">Priest</h1></div>\n`);
});
