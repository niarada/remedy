import { expect, test } from "bun:test";
import { TemplateRegister } from "./register";

const register = new TemplateRegister("./view/__fixtures__");

test("render", async () => {
    const view = await register._present("todo-item");
    const html = await view.render({ id: 1, name: "Luke" });
    expect(html).toMatchSnapshot();
});

test("composition", async () => {
    await register._present("widget");
    const view = await register._present("container");
    const html = await view.render();
    expect(html).toMatchSnapshot();
});

test("interpolated composition", async () => {
    await register._present("todo-list");
    await register._present("todo-item");
    const view = await register._present("index");
    const html = await view.render();
    expect(html).toMatchSnapshot();
});

test("local environment", async () => {
    const view = await register._present("environ");
    const html = await view.render();
    expect(html).toMatchSnapshot();
});

test("attributes passed to local environment", async () => {
    await register._present("attr");
    const view = await register._present("passattr");
    const html = await view.render();
    expect(html).toMatchSnapshot();
});
