import { expect, test } from "bun:test";
import { MarkdownSource } from "./source";

const source1 = `
# Hello
`;
const target1 = `export const attributes = null;
export const template = "<h1>Hello</h1>\\n";
export async function action() { return {}; }
`;
test("compile", () => {
    const source = new MarkdownSource(source1);
    expect(source.code).toBe(target1);
});
