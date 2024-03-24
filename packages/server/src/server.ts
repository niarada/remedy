import { info } from "@niarada/remedy-common";
import { RemedyConfig, defaultRemedyConfig } from "@niarada/remedy-runtime";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import pkg from "../package.json";
import { buildFetch } from "./fetch";

export async function serve() {
    info("server", `remedy ${pkg.version}`);

    const defaultConfig = defaultRemedyConfig();
    const configPath = "remedy.config.ts";

    if (!existsSync(configPath)) {
        info("server", `creating '${configPath}'`);
        writeFileSync(configPath, `export default ${JSON.stringify(defaultConfig, null, 4)}`);
    }

    let userConfig: RemedyConfig = {};

    if (existsSync("remedy.config.ts")) {
        userConfig = (await import(`${process.cwd()}/remedy.config.ts`)).default;
    }

    const config = Object.assign({}, defaultConfig, userConfig);

    if (!existsSync(config.public)) {
        info("server", `creating '${config.public}' directory`);
        mkdirSync(config.public);
    }

    const fetch = await buildFetch(config);

    Bun.serve({
        port: config.port!,
        fetch,
    });

    info("server", `listening on port ${config.port}`);
}
