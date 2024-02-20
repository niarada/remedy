import { info } from "../log";
import { ServerOptions } from "../options";

export type FeatureFactory = (
	options: ServerOptions,
) => Promise<ServerFeature> | ServerFeature;

export interface ServerFeature {
	fetch?: (
		request: Request,
	) => Promise<Response | undefined> | Response | undefined;
	element?: (element: HTMLRewriterTypes.Element) => void;
}

type FeaturesKey = keyof ServerOptions["features"];

export async function buildFeatures(options: ServerOptions) {
	const features: ServerFeature[] = [];

	for (const name of Object.keys(options.features) as FeaturesKey[]) {
		info("feature", name);
		if (options.features[name]) {
			features.push(
				await (await import(`../features/${name}`)).default(options),
			);
		}
	}

	return features;
}
