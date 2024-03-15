import { HtmxOptions } from "./features/htmx";

export interface ServerOptions {
    port?: number;
    base?: string;
    features?: ServerOptionsFeatures;
}

interface ServerOptionsFeatures {
    fontawesome?: boolean;
    tailwind?: boolean;
    htmx?: HtmxOptions;
    sse?: boolean;
    static?: boolean;
    dev?: boolean;
}

const options = {
    port: 4321,
    base: "public",
    features: {
        fontawesome: false,
        tailwind: false,
        htmx: {
            debug: false,
        },
        sse: false,
        static: true,
        dev: import.meta.env.NODE_ENV === "development",
    },
};

export default options;
