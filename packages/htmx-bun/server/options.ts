import { HtmxOptions } from "./features/htmx";

export interface ServerOptions {
    port?: number;
    features?: ServerOptionsFeatures;
}

interface ServerOptionsFeatures {
    static?: boolean;
    tailwind?: boolean;
    htmx?: HtmxOptions;
    sse?: boolean;
    dev?: boolean;
}

const options = {
    port: 4321,
    features: {
        tailwind: false,
        htmx: {
            debug: false,
        },
        sse: true,
        static: true,
        dev: import.meta.env.NODE_ENV === "development",
    },
};

export default options;
