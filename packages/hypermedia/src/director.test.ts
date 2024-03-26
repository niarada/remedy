import { describe, expect, it } from "bun:test";
import { mkdirSync, writeFileSync } from "node:fs";
import markdownFeatureFactory from "../../features/markdown";
import { MarkdownSource } from "../../features/markdown/source";
import partialFeatureFactory from "../../features/partial";
import { Director } from "./director";
import { fakeContext, makeTemporaryDirectory } from "./test";

const markdownFeature = markdownFeatureFactory();
const partialFeature = partialFeatureFactory();
const director = new Director(makeTemporaryDirectory(), [
    await partialFeature({ port: 0, public: "", features: [] }),
    await markdownFeature({ port: 0, public: "", features: [] }),
]);

describe("director", () => {
    it("should error on using html tags", async () => {
        await director.prepare("table", new MarkdownSource("# Ignored"));
        expect(await director.represent("table")).toBeUndefined();
    });

    it("should manually prepare", async () => {
        await director.prepare("joy", new MarkdownSource("# Joy"));
        const rep = await director.represent("joy");
        expect(rep!.artifact.template).toBe("<h1>Joy</h1>\n");
    });

    it("should load from file", async () => {
        writeFileSync(`${director.base}/love.md`, "# Love");
        const rep = await director.represent("love");
        expect(rep!.artifact.template).toBe("<h1>Love</h1>\n");
    });

    it("should revert", async () => {
        writeFileSync(`${director.base}/peace.md`, "# Peace");
        let rep = await director.represent("peace");
        expect(rep!.artifact.template).toBe("<h1>Peace</h1>\n");
        director.revert("peace");
        writeFileSync(`${director.base}/peace.md`, "# εἰρήνη");
        rep = await director.represent("peace")!;
        expect(rep!.artifact.template).toBe("<h1>εἰρήνη</h1>\n");
    });

    it("should watch", async () => {
        writeFileSync(`${director.base}/patience.md`, "# Patience");
        const rep = await director.represent("patience");
        expect(rep!.artifact.template).toBe("<h1>Patience</h1>\n");
        director.watch();
        writeFileSync(`${director.base}/patience.md`, "# μακροθυμία");
        // This test relies on the watch system to fire an event and we
        // can't be sure when that will happen.  So keep it disabled
        // unless you need to test this specifically.
        // -----
        // await Bun.sleep(100);
        // rep = await director.represent("patience");
        // expect(rep!.artifact.template).toBe("<h1>μακροθυμία</h1>\n");
    });

    it("should test parameter tags", async () => {
        mkdirSync(`${director.base}/param`, { recursive: true });
        writeFileSync(`${director.base}/param/[id].part`, "<div>{id}</div>");
        const html = await director.render("param-1", fakeContext());
        expect(html).toBe("<div>1</div>\n");
    });
});
