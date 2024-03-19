import { existsSync, mkdirSync } from "node:fs";
import { mergeDeepWith } from "ramda";
import { info } from "~/lib/log";
import defaultOptions, { ServerOptions } from "~/server/options";
import pkg from "../package.json";
import { buildFetch } from "./fetch";

info("server", `remedy ${pkg.version}`);

if (!existsSync("public")) {
    info("server", "creating 'public' directory");
    mkdirSync("public");
}

let userOptions: ServerOptions = {};
if (await Bun.file("options.ts").exists()) {
    userOptions = (await import(`${process.cwd()}/options.ts`)).default;
}
const options = mergeDeepWith((_, b) => b, defaultOptions, userOptions);

if (options.features.tailwind) {
    if (!existsSync("tailwind.config.js") && !existsSync("tailwind.config.ts")) {
        info("server", "creating 'tailwind.config.ts'");
        await Bun.write("tailwind.config.ts", `export default {\n    content: ["./**/*.part"],\n};`);
    }
}

const fetch = await buildFetch(options);

Bun.serve({
    port: options.port!,
    fetch,
});

info("server", `listening on port ${options.port}`);
