import { HtmlSimpleTransformVisitor } from "~/hypermedia/template";
import { info } from "~/lib/log";
import { Context } from "~/server/context";
import { ServerOptions } from "~/server/options";

import devFeature from "./dev";
import fontAwesomeFeature from "./fontawesome";
import htmxFeature from "./htmx";
import sseFeature from "./sse";
import staticFeature from "./static";
import tailwindFeature from "./tailwind";

const factories: Record<string, FeatureFactory> = {
    dev: devFeature,
    fontawesome: fontAwesomeFeature,
    htmx: htmxFeature,
    sse: sseFeature,
    static: staticFeature,
    tailwind: tailwindFeature,
};

export type FeatureFactory = (options: ServerOptions) => Promise<ServerFeature> | ServerFeature;

export interface ServerFeature {
    name: string;
    intercede?: (context: Context) => Promise<Response | undefined> | Response | undefined;
    transform?: HtmlSimpleTransformVisitor;
}

type FeaturesKey = keyof ServerOptions["features"];

export async function buildFeatures(options: ServerOptions) {
    const features: ServerFeature[] = [];

    for (const name of Object.keys(options.features!) as FeaturesKey[]) {
        if (options.features![name]) {
            info("server", `enabling feature '${name}'`);
            features.push(await factories[name](options));
        }
    }

    return features;
}
