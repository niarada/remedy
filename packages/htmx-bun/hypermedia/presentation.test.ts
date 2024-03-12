import { expect, test } from "bun:test";
import { fakeContext } from "~/lib/test";
import { Director } from "./director";
import { MarkdownSource } from "./kinds/markdown/source";
import { PartialSource } from "./kinds/partial/source";

const director = new Director();

test("representation present", async () => {
    await director.prepare("alpha", new MarkdownSource("# Hello"));
    const alphaR = await director.represent("alpha");
    const alphaP = alphaR!.present(fakeContext());
    expect(alphaP).toBeDefined();
});

const source1 = `
const gift = "Joy";

<h1>{gift}</h1>
`;
test("render simple", async () => {
    await director.prepare("beta", new PartialSource(source1));
    expect(await director.render("beta", fakeContext(), { trim: true })).toBe(
        "<h1>Joy</h1>",
    );
});

const source2 = `
interface Attributes {
    gift: string;
    chapter: number;
}

<p>
    <a chapter="{typeof chapter} {chapter}">{gift}</a>
</p>
`;
test("render attributes", async () => {
    await director.prepare("gamma", new PartialSource(source2));
    expect(
        await director.render(
            "gamma",
            fakeContext({ gift: "Temperance", chapter: 5 }),
            { trim: true },
        ),
    ).toBe(`<p><a chapter="number 5">Temperance</a></p>`);
});

test("flow each", async () => {
    await director.prepare(
        "delta",
        new PartialSource(`<a mx-each={[1,2]} mx-as="i">{i}</a>`),
    );
    expect(await director.render("delta", fakeContext(), { trim: true })).toBe(
        "<a>1</a><a>2</a>",
    );
});

await director.prepare(
    "todo-list",
    new PartialSource(`
const items = [
    { id: 1, name: "Love" },
    { id: 2, name: "Joy" },
    { id: 3, name: "Peace" },
];

<ul>
    <todo-item mx-each={items} mx-as="item" id={item.id} name={item.name} />
</ul>
`),
);

await director.prepare(
    "todo-item",
    new PartialSource(`
interface Attributes {
    id: number;
    name: string;
}

<li id={id} type={typeof id}>{name}</li>
`),
);

test("render todo list, check types", async () => {
    const html = await director.render("todo-list", fakeContext(), {
        trim: true,
    });
    expect(html).toBe(
        `<ul><li id="1" type="number">Love</li><li id="2" type="number">Joy</li><li id="3" type="number">Peace</li></ul>`,
    );
});

await director.prepare(
    "slot-outer",
    new PartialSource(`
const gift = "Joy";

<main>
    <slot-middle>
        <slot-inner gift={gift} />
    </slot-middle>
</main>
`),
);

await director.prepare(
    "slot-middle",
    new PartialSource(`
<div class="outer">
    <slot />
</div>
`),
);

await director.prepare(
    "slot-inner",
    new PartialSource(`
interface Attributes {
    gift: string;
}

<hr gift={gift} />
`),
);

test("render slot assuring outer expression for slotted items", async () => {
    const html = await director.render("slot-outer", fakeContext(), {
        trim: true,
    });
    expect(html).toBe(`<main><div class="outer"><hr gift="Joy"></div></main>`);
});
