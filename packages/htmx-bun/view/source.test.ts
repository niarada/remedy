import { expect, test } from "bun:test";
import { Source } from "./source";

test("compile", async () => {
    const source = new Source("view/__fixtures__/kitchen.part");
    await source.compile();
    expect(await source.code()).toMatchSnapshot();
});
