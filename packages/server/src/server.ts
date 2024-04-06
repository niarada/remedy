import { error, info } from "@niarada/remedy-common";
import { RemedyConfig, defaultRemedyConfig } from "@niarada/remedy-runtime";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { AsyncTask, SimpleIntervalJob, ToadScheduler } from "toad-scheduler";
import pkg from "../package.json";
import { buildFetch } from "./fetch";

declare global {
    var scheduler: ToadScheduler;
}

if (global.scheduler) {
    global.scheduler.stop();
}

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

    try {
        Bun.serve({
            port: config.port!,
            fetch,
        });

        info("server", `listening on port ${config.port}`);
    } catch (e) {
        console.log(e);
    }

    if (config.jobs.length) {
        global.scheduler = new ToadScheduler();
        for (const job of config.jobs!) {
            global.scheduler.addSimpleIntervalJob(
                new SimpleIntervalJob(
                    job.schedule,
                    new AsyncTask(job.description ?? "Anonymous task", job.task, (err: Error) => {
                        error("scheduler", err.message);
                    }),
                ),
            );
        }
    }
}
