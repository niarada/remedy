import { expect, test } from "bun:test";
import { transformExpressionsIntoStrings } from "./expressor";
import { transformFlowEach } from "./flow";
import { parseSource, printHtml } from "./template";

const source1 = `
<hr mx-each={[1,2,3,4]}>
`;

test("simple each", () => {
    const node = parseSource(source1);
    transformFlowEach(node);
    expect(printHtml(node, { trim: true })).toBe("<hr><hr><hr><hr>");
});

const source2 = `
<a mx-each={[1,2]} mx-as="i">{$scope.i}</a>
`;

test("each that passes additional scope", () => {
    const node = parseSource(source2);
    transformFlowEach(node);
    transformExpressionsIntoStrings(node);
    expect(printHtml(node, { trim: true })).toBe("<a>1</a><a>2</a>");
});
