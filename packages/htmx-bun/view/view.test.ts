import { expect, test } from "bun:test";
import { TemplateRegister } from "./register";

const register = new TemplateRegister("./view/__fixtures__");
await register.initialize();

test("render", async () => {
    const view = register.get("todo-item").present();
    const html = await view.render({ id: 1, name: "Luke" });
    expect(html).toBe(`<li id="1">Luke</li>\n`);
});

test("composition", async () => {
    const view = register.get("container").present();
    const html = await view.render();
    expect(html).toBe("<div>\n    <div>Widget</div>\n</div>\n");
});

test("interpolated composition 1", async () => {
    const view = register.get("todo-list").present();
    const html = await view.render();
    // expect(html).toMatchSnapshot();
});

test("interpolated composition 2", async () => {
    const view = register.get("root").present();
    const html = await view.render();
    expect(html).toMatchSnapshot();
});

test("local environment", async () => {
    const view = register.get("environ").present();
    const html = await view.render();
    expect(html).toBe("<div>He first loved us.</div>\n");
});

test("attributes passed to local environment", async () => {
    const view = register.get("passattr").present();
    const html = await view.render();
    expect(html).toBe(
        "<div>And He is before all things, and in Him all things hold together.</div>\n<div>true</div>\n",
    );
});
