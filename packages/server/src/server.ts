import { info, logger } from "@niarada/remedy-common";
import { AddressInUseError, RemedyConfig, UnknownError, defaultRemedyConfig } from "@niarada/remedy-runtime";
import { Server, SystemError } from "bun";
import { Effect, LogLevel, Logger } from "effect";
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

    const server = (): Effect.Effect<Server, AddressInUseError | UnknownError> => {
        try {
            return Effect.succeed(Bun.serve({ fetch, port: config.port }));
        } catch (error) {
            if ((error as SystemError).code === "EADDRINUSE") {
                return Effect.fail(new AddressInUseError(config.port));
            }
            return Effect.fail(new UnknownError(error as Error));
        }
    };

    const program = server().pipe(
        Effect.tapErrorTag("AddressInUseError", (error) =>
            Effect.logError(`Failed to start server. Is port ${error.port} in use?`),
        ),
        Effect.tapErrorTag("UnknownError", (error) => Effect.logError(error.source.message)),
        Effect.flatMap((server) => Effect.logInfo(`Server started on port ${server.port}`)),
    );

    Effect.runPromise(
        Effect.provide(
            Logger.withMinimumLogLevel(program, LogLevel.Debug),
            Logger.replace(Logger.defaultLogger, logger),
        ),
    );
}
