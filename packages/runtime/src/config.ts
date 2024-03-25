export interface RemedyConfig {
    port?: number;
    public?: string;
    features?: string[];
}

export function defaultRemedyConfig(): Required<RemedyConfig> {
    return {
        port: 4321,
        public: "public",
        features: ["refresh", "typescript", "static"],
    };
}
