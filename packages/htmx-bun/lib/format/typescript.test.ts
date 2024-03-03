import { expect, test } from "bun:test";
import { formatTypeScript } from "./typescript";

test("formatTypeScript", async () => {
    const ugly = `
      const a    =
      1;
      const b = 'foo'


      function  c   (  ) { return null
        ;}

    `;
    const pretty = await formatTypeScript(ugly);
    expect(pretty).toBe(
        `const a = 1;\nconst b = "foo";\n\nfunction c() {\n  return null;\n}\n`,
    );
});
