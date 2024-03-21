import { describe, expect, it } from "bun:test";
import { transformExpressionsIntoStrings } from "./expressor";
import { transformFlowEach } from "./flow";
import { parseSource, printHtml } from "./template";

describe("flow", () => {
    it("simple each", () => {
        const { ast } = parseSource(`
            <hr rx-each={[1,2,3,4]}>
        `);
        transformFlowEach(ast);
        expect(printHtml(ast, { trim: true })).toBe("<hr><hr><hr><hr>");
    });

    it("each that passes additional scope", () => {
        const { ast } = parseSource(`
            <a rx-each={[1,2]} rx-as="i">{$scope.i}</a>
        `);
        transformFlowEach(ast);
        transformExpressionsIntoStrings(ast);
        expect(printHtml(ast, { trim: true })).toBe("<a>1</a><a>2</a>");
    });
});
