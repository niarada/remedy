import { mergeDeepWith } from "ramda";
import { buildFeatures } from "./features";
import { buildFetch } from "./fetch";
import { info } from "./log";
import defaultOptions, { ServerOptions } from "./options";

export async function serve() {
	const userOptions = ((await import(`${process.cwd()}/options.ts`))?.default ??
		{}) as ServerOptions;
	const options = mergeDeepWith((_, b) => b, defaultOptions, userOptions);
	const features = await buildFeatures(options);
	const fetch = buildFetch(features);

	Bun.serve({
		port: options.port,
		fetch,
	});

	info("server", `Listening on port ${options.port}`);
}
