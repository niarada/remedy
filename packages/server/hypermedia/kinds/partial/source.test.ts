import { describe, expect, it } from "bun:test";
import { PartialSource } from "./source";

const source1 = `
interface Attributes {
    id: number;
}
const name = 'Alpha';

<script>
    const a = 1;
</script>

<script>
    const b = 2;
</script>

<div>{id} {name}</div>
`;

const target1 = `export const attributes = {"id":"number"};
export const template = "<div>{$scope.id} {$scope.name}</div>\\n";
export const script = "const a = 1;\\nconst b = 2;\\n";
interface Attributes {
    id: number;
}
export async function action($context: Context, id: number) {
    const name = 'Alpha';
    return { $context, name };
}
`;

describe("partial/source", () => {
    it("compile", () => {
        const source = new PartialSource(source1);
        expect(source.code).toBe(target1);
    });
});
