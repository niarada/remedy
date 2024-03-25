import { RemedyFeatureFactory } from "./feature";

export interface RemedyConfig {
    port?: number;
    public?: string;
    features?: (string | RemedyFeatureFactory)[];
}

export function defaultRemedyConfig(): Required<RemedyConfig> {
    return {
        port: 4321,
        public: "public",
        features: ["refresh", "typescript", "static"],
    };
}
