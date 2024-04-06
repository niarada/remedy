import { SimpleIntervalSchedule } from "toad-scheduler";
import { RemedyFeatureFactory } from "./feature";

export interface Job {
    description?: string;
    schedule: SimpleIntervalSchedule;
    task: () => Promise<void>;
}

export interface RemedyConfig {
    port?: number;
    public?: string;
    features?: (string | RemedyFeatureFactory)[];
    jobs?: Job[];
}

export function defaultRemedyConfig(): Required<RemedyConfig> {
    return {
        port: 4321,
        public: "public",
        features: ["refresh", "static", "template"],
        jobs: [],
    };
}
