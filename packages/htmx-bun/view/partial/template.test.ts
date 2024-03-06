import { test } from "bun:test";
import { Register } from "../register";

test("extracts", async () => {
    const register = new Register("./view/__fixtures__");
    await register.initialize();
    const template = register.get("todo-item");
    // const extracts = template.extracts();
    // expect(extracts.length).toEqual(2);
});
