import { HtmlSimpleTransformVisitor } from "~/hypermedia/template";
import { info } from "~/lib/log";
import { Context } from "~/server/context";
import { ServerOptions } from "~/server/options";

export type FeatureFactory = (
    options: ServerOptions,
) => Promise<ServerFeature> | ServerFeature;

export interface ServerFeature {
    name: string;
    intercede?: (
        context: Context,
    ) => Promise<Response | undefined> | Response | undefined;
    transform?: HtmlSimpleTransformVisitor;
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
