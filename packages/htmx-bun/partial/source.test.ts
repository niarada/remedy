import { expect, test } from "bun:test";
import { Source } from "./source";

const source1 = `
interface Attributes {
    id: number;
    name: string;
}

const items = [{ id: 1, name: "one" }, { id: 2, name: "two" }];

<div>
    {id}
</div>
<div>{name}</div>
<ul>
    <li mx-each={items} mx-as="item" id={item.id}>{item.name}</li>
</ul>
`;
test("compile", async () => {
    const source = new Source(source1);
    const target = await source.compile();
    // console.log(target);
    expect(target).toMatchSnapshot();
    // expect(await source.code()).toMatchSnapshot();
});
