import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { mergeDeepWith } from "ramda";
import { info } from "~/lib/log";
import defaultOptions, { ServerOptions } from "~/server/options";
import pkg from "../package.json";
import { buildFetch } from "./fetch";

info("server", `remedy ${pkg.version}`);

const configPath = "remedy.config.ts";

const defaultConfigSource = `export default {
    port: 4321,
    base: "public",
    features: {
        fontawesome: false,
        tailwind: false,
        alpine: false,
        htmx: false,
        sse: false,
        typescript: true,
        static: true,
        dev: import.meta.env.NODE_ENV === "development",
    },
};
`;

if (!existsSync(configPath)) {
    info("server", `creating '${configPath}'`);
    writeFileSync(configPath, defaultConfigSource);
}

let userOptions: ServerOptions = {};
if (await Bun.file("remedy.config.ts").exists()) {
    userOptions = (await import(`${process.cwd()}/remedy.config.ts`)).default;
}
const options = mergeDeepWith((_, b) => b, defaultOptions, userOptions);

if (!existsSync(options.base)) {
    info("server", `creating '${options.base}' directory`);
    mkdirSync(options.base);
}

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
