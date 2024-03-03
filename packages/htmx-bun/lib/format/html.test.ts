import { expect, test } from "bun:test";
import { formatHtml } from "./html";

test("formatHtml", async () => {
    const ugly = `
    <div>
                  <span>
        Muppim, Huppim and Ard
        </span>
      </div>
    `;
    const pretty = await formatHtml(ugly);
    expect(pretty).toBe(
        "<div>\n    <span>Muppim, Huppim and Ard</span>\n</div>\n",
    );

    // Has some brackets
    const brackets1 = "<div id={id}></div>";
    const brackets2 = `<div id="{id}"></div>\n`;
    expect(await formatHtml(brackets1)).toBe(brackets2);
});
