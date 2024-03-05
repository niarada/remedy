import { expect, test } from "bun:test";
import { scanPartial } from "./scanner";

const source1 = `
<item id="1" class={item.class}>{item.name}</item>
`;
test("scanner", () => {
    const tokens = scanPartial(source1);
    expect(tokens).toMatchSnapshot();
});
