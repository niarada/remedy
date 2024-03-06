import { expect, test } from "bun:test";
import { scanPartial } from "./scanner";

const source1 = `
cosnt a = 1;
<item id="1" class={item.class} hx-on::before-request="foo">{item.name}</item>
<input>
<div />
`;
test("scanner", () => {
    const tokens = scanPartial(source1);
    expect(tokens).toMatchSnapshot();
});
