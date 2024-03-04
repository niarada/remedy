import { expect, test } from "bun:test";
import { TemplateRegister } from "./register";

const register = new TemplateRegister("./view/__fixtures__");
await register.initialize();

test("render", async () => {
    const view = register.get("todo-item").present();
    const html = await view.render({ id: 1, name: "Luke" });
    expect(html).toMatchSnapshot();
});

test("composition", async () => {
    const view = register.get("container").present();
    const html = await view.render();
    expect(html).toMatchSnapshot();
});

test("interpolated composition", async () => {
    const view = register.get("root").present();
    const html = await view.render();
    expect(html).toMatchSnapshot();
});

test("local environment", async () => {
    const view = register.get("environ").present();
    const html = await view.render();
    expect(html).toMatchSnapshot();
});

test("attributes passed to local environment", async () => {
    const view = register.get("passattr").present();
    const html = await view.render();
    expect(html).toMatchSnapshot();
});
