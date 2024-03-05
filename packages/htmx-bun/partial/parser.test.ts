import { test } from "bun:test";
import { parsePartial } from "./parser";

const source1 = `
<item id="1" class={item.class}>{item.name}</item>
`;
test("parser", () => {
    const ast = parsePartial(source1);
    // console.log(ast);
});
