import { HtmlTransformer } from "~/lib/html";
import { info } from "~/lib/log";
import { ServerOptions } from "~/server/options";

export type FeatureFactory = (
    options: ServerOptions,
) => Promise<ServerFeature> | ServerFeature;

export interface ServerFeature {
    name: string;
    fetch?: (
        request: Request,
    ) => Promise<Response | undefined> | Response | undefined;
    transform?: HtmlTransformer;
}

type FeaturesKey = keyof ServerOptions["features"];

export async function buildFeatures(options: ServerOptions) {
    const features: ServerFeature[] = [];

    for (const name of Object.keys(options.features!) as FeaturesKey[]) {
        if (options.features![name]) {
            info("server", `enabling feature '${name}'`);
            features.push(
                await (await import(`../features/${name}`)).default(options),
            );
        }
    }

    return features;
}
