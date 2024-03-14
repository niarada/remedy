import { mkdirSync } from "node:fs";
import { mergeDeepWith } from "ramda";
import { info } from "~/lib/log";
import defaultOptions, { ServerOptions } from "~/server/options";
import pkg from "../package.json";
import { buildFetch } from "./fetch";

info("server", `htmx-bun ${pkg.version}`);

mkdirSync("public", { recursive: true });
let userOptions: ServerOptions = {};
if (await Bun.file("options.ts").exists()) {
    userOptions = (await import(`${process.cwd()}/options.ts`)).default;
}
const options = mergeDeepWith((_, b) => b, defaultOptions, userOptions);
const fetch = await buildFetch(options);

Bun.serve({
    port: options.port!,
    fetch,
});

info("server", `listening on port ${options.port}`);
