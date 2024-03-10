import { expect, test } from "bun:test";
import { AttributeTypes } from ".";
import {
    express,
    expressAttributeFirstValue,
    expressDefinedAttributesToStrings,
    transformExpressionsIntoStrings,
} from "./expressor";
import { HtmlElement, parseSource, printHtml } from "./template";

test("express", () => {
    expect(express({ value: "Joy" }, "$scope.value")).toBe("Joy");
});

test("express template to strings", () => {
    const scope = {
        gifts: ["Love", "Joy", "Peace"],
    };
    const template = parseSource(
        "<h1 name={$scope.gifts[0]}>{$scope.gifts[1]} {$scope.gifts[2]}</h1>",
        scope,
    );
    transformExpressionsIntoStrings(template);
    expect(printHtml(template)).toBe(`<h1 name="Love">Joy Peace</h1>\n`);
});

test("express attribute", () => {
    const scope = {
        gifts: ["Love", "Joy", "Peace"],
    };
    const template = parseSource("<hr gifts={$scope.gifts}>", scope);
    expect(
        expressAttributeFirstValue(
            template.children[0] as HtmlElement,
            "gifts",
        ),
    ).toBe(scope.gifts);
});

test("express defined attributes to strings", () => {
    const types = {
        gift: "string",
        chapter: "number",
        both: "string",
    } as AttributeTypes;
    const template = parseSource(
        `<hr gift="joy" chapter={5} both="{$scope.gift} {$scope.chapter}">`,
    );
    template.scope.gift = "joy";
    template.scope.chapter = 5;
    expect(
        expressDefinedAttributesToStrings(
            template.children[0] as HtmlElement,
            types,
        ),
    ).toEqual({ gift: "joy", chapter: "5", both: "joy 5" });
});
