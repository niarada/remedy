import { expect, test } from "bun:test";
import { unlinkSync } from "fs";
import { TemplateRegister } from "./register";

test("initialize", async () => {
    const register = new TemplateRegister("./view/__fixtures__");
    await register.initialize();
    expect(register.get("root")).toBeDefined();
});

test("reload", async () => {
    const testPath = "./view/__fixtures__/reload.part";
    const testContent1 = "<div>Reload Test 1</div>\n";
    const testContent2 = "<div>Reload Test 2</div>\n";
    await Bun.write(testPath, testContent1);
    const register = new TemplateRegister("./view/__fixtures__");
    await register.initialize();
    expect(register.get("reload").html).toBe(testContent1);
    await Bun.write(testPath, testContent2);
    await register.reload("reload");
    expect(register.get("reload").html).toBe(testContent2);
    unlinkSync(testPath);
});
