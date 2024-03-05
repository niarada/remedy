import { HtmxOptions } from "./features/htmx";

export interface ServerOptions {
    port?: number;
    features?: ServerOptionsFeatures;
}

interface ServerOptionsFeatures {
    fontawesome?: boolean;
    tailwind?: boolean;
    markdown?: boolean;
    htmx?: HtmxOptions;
    sse?: boolean;
    static?: boolean;
    dev?: boolean;
}

const options = {
    port: 4321,
    features: {
        fontawesome: false,
        tailwind: false,
        markdown: false,
        htmx: {
            debug: false,
        },
        sse: true,
        static: true,
        dev: import.meta.env.NODE_ENV === "development",
    },
};

export default options;
