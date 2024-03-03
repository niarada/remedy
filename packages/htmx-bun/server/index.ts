import { mergeDeepWith } from "ramda";
import { info } from "~/lib/log";
import defaultOptions, { ServerOptions } from "~/server/options";
import { buildFetch } from "./fetch";

export async function serve() {
    info("server", "Initializing server...");
    let userOptions: ServerOptions = {};
    if (await Bun.file("options.ts").exists()) {
        userOptions = (await import(`${process.cwd()}/options.ts`)).default;
    }
    const options = mergeDeepWith((_, b) => b, defaultOptions, userOptions);
    const fetch = await buildFetch(options);

    Bun.serve({
        port: options.port,
        fetch,
    });

    info("server", `Listening on port ${options.port}`);
}
