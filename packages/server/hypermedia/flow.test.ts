import { expect, test } from "bun:test";
import { transformExpressionsIntoStrings } from "./expressor";
import { transformFlowEach } from "./flow";
import { parseSource, printHtml } from "./template";

const source1 = `
<hr rx-each={[1,2,3,4]}>
`;

test("simple each", () => {
    const { ast } = parseSource(source1);
    transformFlowEach(ast);
    expect(printHtml(ast, { trim: true })).toBe("<hr><hr><hr><hr>");
});

const source2 = `
<a rx-each={[1,2]} rx-as="i">{$scope.i}</a>
`;

test("each that passes additional scope", () => {
    const { ast } = parseSource(source2);
    transformFlowEach(ast);
    transformExpressionsIntoStrings(ast);
    expect(printHtml(ast, { trim: true })).toBe("<a>1</a><a>2</a>");
});
