import { expect, test } from "bun:test";
import { cloneHtml, parseSource, printHtml, simpleTransformHtml, walkHtml } from ".";

const source1 = `<div><p id="joy">χαρά</p></div>\n`;

test("void transform", () => {
    const { ast } = parseSource(source1);
    simpleTransformHtml(ast, (node) => {
        return node;
    });
    expect(printHtml(ast)).toBe(source1);
});

const target1 = `<div><p id="love">ἀγαπάω</p></div>\n`;

test("simple transform", () => {
    const { ast } = parseSource(source1);
    simpleTransformHtml(ast, (node) => {
        if (node.type === "element" && node.tag === "p") {
            node.attrs[0].value[0].content = "love";
        }
        if (node.type === "text" && node.content === "χαρά") {
            node.content = "ἀγαπάω";
        }
        return node;
    });
    expect(printHtml(ast)).toBe(target1);
});

const target2 = "<div></div>\n";

test("delete element", () => {
    const { ast } = parseSource(source1);
    simpleTransformHtml(ast, (node) => {
        if (node.type === "element" && node.tag === "p") {
            return;
        }
        return node;
    });
    expect(printHtml(ast)).toBe(target2);
});

const target3 = `<div><p id="joy">χαρά</p><p id="joy">χαρά</p><p id="joy">χαρά</p></div>\n`;

test("duplicate element", () => {
    const { ast } = parseSource(source1);
    simpleTransformHtml(ast, (node) => {
        if (node.type === "element" && node.tag === "p") {
            return [node, structuredClone(node), structuredClone(node)];
        }
        return node;
    });
    expect(printHtml(ast)).toBe(target3);
});

test("clone ast", () => {
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
