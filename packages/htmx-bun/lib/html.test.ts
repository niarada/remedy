import { expect, test } from "bun:test";
import { HtmlParent, formatHtml, parseHtml, transformHtml } from "./html";

test("formatHtml", () => {
    const ugly = `
  <div>
                <span>
      Muppim, Huppim and Ard
      </span>
    </div>
  `;
    const pretty = formatHtml(ugly);
    expect(pretty).toMatchSnapshot();

    // Has some brackets
    const brackets1 = "<div id={id}></div>";
    const brackets2 = `<div id="{id}"></div>\n`;
    expect(formatHtml(brackets1)).toBe(brackets2);
});

test("parse and print", () => {
    const html = `<div>\n    <h1 class="monk">Test</h1>\n    <p>Test</p>\n</div>\n`;
    const root = parseHtml(html);
    const printed = formatHtml(root);
    expect(printed).toMatchSnapshot();
});

test("embedded fragment", () => {
    const a = "<div></div>";
    const b = "<span></span>";
    const aa = parseHtml(a);
    const bb = parseHtml(b);
    (aa.children[0] as HtmlParent).children.push(bb);
    expect(formatHtml(aa)).toMatchSnapshot();
});

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
    const printed = formatHtml(root);
    expect(printed).toMatchSnapshot();
});
