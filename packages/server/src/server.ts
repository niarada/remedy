import { info } from "@niarada/remedy-common";
import { RemedyConfig, defaultRemedyConfig } from "@niarada/remedy-runtime";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import pkg from "../package.json";
import { buildFetch } from "./fetch";

interface ServeOptions {
    port?: number;
    public?: string;
    createConfig?: boolean;
}

export async function serve(options: ServeOptions = {}) {
    info("server", `remedy ${pkg.version}`);

    const defaultConfig = defaultRemedyConfig();
    const configPath = "remedy.config.ts";

    if (!existsSync(configPath) && options.createConfig) {
        info("server", `creating '${configPath}'`);
        writeFileSync(configPath, `export default ${JSON.stringify(defaultConfig, null, 4)}`);
    }

    let userConfig: RemedyConfig = {};

    if (existsSync(configPath)) {
        userConfig = (await import(`${process.cwd()}/remedy.config.ts`)).default;
    }

    const config = Object.assign({}, defaultConfig, userConfig, options);

    if (!existsSync(configPath) && !options.public) {
        config.public = ".";
    }

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
