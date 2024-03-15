import { expect, test } from "bun:test";
import {
    cloneHtml,
    parseSource,
    printHtml,
    simpleTransformHtml,
    walkHtml,
} from ".";

const source1 = `<div><p id="joy">χαρά</p></div>\n`;

test("void transform", () => {
    const template = parseSource(source1);
    simpleTransformHtml(template, (node) => {
        return node;
    });
    expect(printHtml(template)).toBe(source1);
});

const target1 = `<div><p id="love">ἀγαπάω</p></div>\n`;

test("simple transform", () => {
    const template = parseSource(source1);
    simpleTransformHtml(template, (node) => {
        if (node.type === "element" && node.tag === "p") {
            node.attrs[0].value[0].content = "love";
        }
        if (node.type === "text" && node.content === "χαρά") {
            node.content = "ἀγαπάω";
        }
        return node;
    });
    expect(printHtml(template)).toBe(target1);
});

const target2 = "<div></div>\n";

test("delete element", () => {
    const template = parseSource(source1);
    simpleTransformHtml(template, (node) => {
        if (node.type === "element" && node.tag === "p") {
            return;
        }
        return node;
    });
    expect(printHtml(template)).toBe(target2);
});

const target3 = `<div><p id="joy">χαρά</p><p id="joy">χαρά</p><p id="joy">χαρά</p></div>\n`;

test("duplicate element", () => {
    const template = parseSource(source1);
    simpleTransformHtml(template, (node) => {
        if (node.type === "element" && node.tag === "p") {
            return [node, structuredClone(node), structuredClone(node)];
        }
        return node;
    });
    expect(printHtml(template)).toBe(target3);
});

test("clone ast", () => {
    const source = parseSource("<a><a><a></a></a></a>", {
        gift: "faithfulness",
    });
    const target = cloneHtml(source);
    target.scope.gift = "temperance";
    walkHtml(target, (node) => {
        expect(node.scope.gift).toBe("temperance");
    });
});
