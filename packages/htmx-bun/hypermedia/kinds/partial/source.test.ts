import { expect, test } from "bun:test";
import { PartialSource } from "./source";

const source1 = `
interface Attributes {
    id: number;
}
const name = 'Alpha';

<div>{id} {name}</div>
`;
const target1 = `export const attributes = {"id":"number"};
export const template = "<div>{$scope.id} {$scope.name}</div>\\n";
interface Attributes {
    id: number;
}
export async function action($context: Context) {
    const name = 'Alpha';
    return { $context, name };
}
`;
test("compile", () => {
    const source = new PartialSource(source1);
    expect(source.code).toBe(target1);
});
