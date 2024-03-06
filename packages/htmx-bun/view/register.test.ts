import { expect, test } from "bun:test";
import { unlinkSync } from "fs";
import { Register } from "./register";

test("initialize", async () => {
    const register = new Register("./view/__fixtures__");
    await register.initialize();
    expect(register.get("kitchen")).toBeDefined();
    expect(register.get("markdown")).toBeDefined();
});

test("reload", async () => {
    const testPath = "./view/__fixtures__/reload.part";
    const testContent1 = "<div>Reload Test 1</div>";
    const testContent2 = "<div>Reload Test 2</div>";
    await Bun.write(testPath, testContent1);
    const register = new Register("./view/__fixtures__");
    await register.initialize();
    expect(register.get("reload")?.html).toMatchSnapshot();
    await Bun.write(testPath, testContent2);
    await register.load("reload.part");
    expect(register.get("reload")?.html).toMatchSnapshot();
    unlinkSync(testPath);
});
