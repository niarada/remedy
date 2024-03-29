import { describe, expect, it } from "bun:test";
import markdownFeatureFactory from "../../features/markdown";
import { TemplateSource } from "../../features/template/source";
import { Director } from "./director";
import { fakeContext } from "./test";

const markdownFeature = await markdownFeatureFactory()({ port: 0, public: "", features: [] });

const director = new Director();

describe("presentation", async () => {
    it("representation present", async () => {
        await director.prepare("alpha", markdownFeature.source!("# Hello"));
        const alphaR = await director.represent("alpha");
        const alphaP = alphaR!.present(fakeContext());
        expect(alphaP).toBeDefined();
    });

    const source1 = `
        const gift = "Joy";
        <h1>{gift}</h1>
    `;
    it("render simple", async () => {
        await director.prepare("beta", new TemplateSource(source1));
        expect(await director.render("beta", fakeContext(), { trim: true })).toBe("<h1>Joy</h1>");
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
    it("render attributes", async () => {
        await director.prepare("gamma", new TemplateSource(source2));
        expect(await director.render("gamma", fakeContext({ gift: "Temperance", chapter: 5 }), { trim: true })).toBe(
            `<p><a chapter="number 5">Temperance</a></p>`,
        );
    });

    it("flow each", async () => {
        await director.prepare("delta", new TemplateSource(`<a rx-each={[1,2]} rx-as="i">{i}</a>`));
        expect(await director.render("delta", fakeContext(), { trim: true })).toBe("<a>1</a><a>2</a>");
    });

    await director.prepare(
        "todo-list",
        new TemplateSource(`
            const items = [
                { id: 1, name: "Love" },
                { id: 2, name: "Joy" },
                { id: 3, name: "Peace" },
            ];

            <ul>
                <todo-item rx-each={items} rx-as="item" id={item.id} name={item.name} />
            </ul>
        `),
    );

    await director.prepare(
        "todo-item",
        new TemplateSource(`
            interface Attributes {
                id: number;
                name: string;
            }

            <li id={id} type={typeof id}>{name}</li>
        `),
    );

    it("render todo list, check types", async () => {
        const html = await director.render("todo-list", fakeContext(), {
            trim: true,
        });
        expect(html).toBe(
            `<ul><li id="1" type="number">Love</li><li id="2" type="number">Joy</li><li id="3" type="number">Peace</li></ul>`,
        );
    });

    await director.prepare(
        "slot-outer",
        new TemplateSource(`
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
        new TemplateSource(`
            <div class="outer">
                <slot />
            </div>
        `),
    );

    await director.prepare(
        "slot-inner",
        new TemplateSource(`
            interface Attributes {
                gift: string;
            }

            <hr gift={gift} />
        `),
    );

    it("render slot assuring outer expression for slotted items", async () => {
        const html = await director.render("slot-outer", fakeContext(), {
            trim: true,
        });
        expect(html).toBe(`<main><div class="outer"><hr gift="Joy"></div></main>`);
    });
});
