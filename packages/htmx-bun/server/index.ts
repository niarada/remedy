import { PartialDeep } from "type-fest";
import { buildFetch } from "./fetch";
import defaultOptions, { ServerOptions } from "./options";
import { mergeDeepLeft } from "ramda";
import { buildFeatures } from "./features";
import { info } from "./log";

export async function serve(userOptions: PartialDeep<ServerOptions> = {}) {
    const options = mergeDeepLeft(defaultOptions, userOptions);
    const features = await buildFeatures(options);
    const fetch = buildFetch(features);

    Bun.serve({
        port: options.port,
        fetch,
    });

    info("server", `Listening on port ${options.port}`);
}
