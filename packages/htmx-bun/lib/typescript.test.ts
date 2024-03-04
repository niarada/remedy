import { expect, test } from "bun:test";
import { formatTypeScript } from "./typescript";

test("formatTypeScript", () => {
    const ugly = `
      const a    =
      1;
      const b = "foo"

      function  c   (  ) { return null
        ;}

    `;
    const pretty = formatTypeScript(ugly);
    expect(pretty).toMatchSnapshot();
});
