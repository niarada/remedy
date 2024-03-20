import { describe, expect, it } from "bun:test";
import { AttributeTypes } from ".";
import {
    express,
    expressAttributeFirstValue,
    expressDefinedAttributesToStrings,
    transformExpressionsIntoStrings,
} from "./expressor";
import { HtmlElement, parseSource, printHtml } from "./template";

describe("expressor", () => {
    it("express", () => {
        expect(express({ value: "Joy" }, "{$scope.value}")).toBe("Joy");
    });

    it("express template to strings", () => {
        const scope = {
            gifts: ["Love", "Joy", "Peace"],
        };
        const { ast } = parseSource("<h1 name={$scope.gifts[0]}>{$scope.gifts[1]} {$scope.gifts[2]}</h1>", scope);
        transformExpressionsIntoStrings(ast);
        expect(printHtml(ast)).toBe(`<h1 name="Love">Joy Peace</h1>\n`);
    });

    it("express attribute", () => {
        const scope = {
            gifts: ["Love", "Joy", "Peace"],
        };
        const { ast } = parseSource("<hr gifts={$scope.gifts}>", scope);
        expect(expressAttributeFirstValue(ast.children[0] as HtmlElement, "gifts")).toBe(scope.gifts);
    });

    it("express defined attributes to strings", () => {
        const types = {
            gift: "string",
            chapter: "number",
            both: "string",
        } as AttributeTypes;
        const { ast } = parseSource(`<hr gift="joy" chapter={5} both="{$scope.gift} {$scope.chapter}">`);
        ast.scope.gift = "joy";
        ast.scope.chapter = 5;
        expect(expressDefinedAttributesToStrings(ast.children[0] as HtmlElement, types)).toEqual({
            gift: "joy",
            chapter: "5",
            both: "joy 5",
        });
    });

    it("should express class name variables", () => {
        const { ast } = parseSource(`<div class="¢foo bar ¢baz" />`);
        ast.scope.foo = true;
        ast.scope.baz = false;
        transformExpressionsIntoStrings(ast);
        expect(printHtml(ast)).toBe(`<div class="foo bar"></div>\n`);
    });
});
