import { Director, Presentation } from "@niarada/remedy-hypermedia";
import {
    Context,
    RemedyConfig,
    RemedyFeature,
    RemedyFeatureFactory,
    chalk,
    error,
    info,
    warn,
} from "@niarada/remedy-runtime";

async function buildFeatures(config: Required<RemedyConfig>) {
    const features: RemedyFeature[] = [];

    for (const item of config.features) {
        let factory: RemedyFeatureFactory | undefined = typeof item === "string" ? undefined : item;
        if (!factory) {
            try {
                factory = (await import(`@niarada/remedy-feature-${item}`))?.default() as
                    | RemedyFeatureFactory
                    | undefined;
            } catch {}
            if (!factory) {
                warn("server", `feature not found: ${item}`);
                continue;
            }
        }
        const feature = await factory(config);
        info("server", `feature: ${feature.name}`);
        features.push(feature);
    }
    return features;
}

export async function buildFetch(config: Required<RemedyConfig>) {
    const cache = new RequestCache();

    const features = await buildFeatures(config);

    const director = new Director(config.public, features);

    if (features.find((it) => it.name === "refresh") && process.env.NODE_ENV !== "production") {
        director.watch();
    }

    return async (request: Request): Promise<Response> => {
        const time = Bun.nanoseconds();

        const context = new Context(request);

        const cached = await cache.getCachedResponse(context.request);
        if (cached) {
            context.response = cached;
            log(context, Math.floor((Bun.nanoseconds() - time) / 1000000));
            return context.response;
        }

        if (context.url.pathname !== "/" && context.url.pathname.endsWith("/")) {
            context.redirect(context.url.pathname.slice(0, -1));
            log(context, Math.floor((Bun.nanoseconds() - time) / 1000000));
            return context.response!;
        }

        await context.loadForm();

        for (const feature of features) {
            await feature.intercede?.(context);
            if (context.response) {
                break;
            }
        }

        if (!context.response && (context.url.pathname === "/" || /^\/[a-z][a-z0-9-\/]*$/.test(context.url.pathname))) {
            if (request.headers.get("HX-Request")) {
                await renderPartial(context);
            } else {
                await renderFull(context);
            }
        }

        for (let i = features.length - 1; i >= 0; i--) {
            await features[i].conclude?.(context);
        }

        if (!context.response) {
            context.status(404);
        }

        if (
            process.env.NODE_ENV === "production" &&
            context.response &&
            context.request.method === "GET" &&
            !context.url.search
        ) {
            await cache.cacheResponse(context.request, context.response);
            const cached = await cache.getCachedResponse(context.request);
            if (cached) {
                context.response = cached;
            }
        }

        log(context, Math.floor((Bun.nanoseconds() - time) / 1000000));
        return context.response!;
    };

    async function renderPartial(context: Context) {
        const tag = context.url.pathname.slice(1).replace(/\//g, "-") || "index";
        const rep = await director.represent(tag);
        if (!rep) {
            return;
        }
        const content: string[] = [];
        const pres = await rep.present(context);
        await pres.activate({ applyFormToAttributes: true });

        if (!context.renderCanceled) {
            await pres.compose();
            await pres.flatten();
            await featureTransforms(pres);
            content.push(pres.render());
        }
        for (const oob of context.oobs) {
            if (await director.represent(oob.tag)) {
                content.push((await director.render(oob.tag, context.withAttributes(oob.attributes)))!);
            } else {
                warn("view", `OOB view not found: ${oob.tag}`);
            }
        }
        context.response = new Response(content.join("\n"), {
            headers: {
                "Content-Type": "text/html;charset=utf-8",
            },
        });
    }

    async function renderFull(context: Context) {
        const pathway =
            context.url.pathname === "/index" ? [] : context.url.pathname.slice(1).split("/").filter(Boolean);
        let presentation: Presentation | undefined;
        for (let i = 0; i < pathway.length; i++) {
            const tag = pathway.slice(i, pathway.length + 1 - 1).join("-");

            // If outer leaf not present, consider this resource unavailable.
            if (!presentation) {
                presentation = await director.present(tag, context);
                if (!presentation) {
                    return;
                }
                await presentation.activate();
                await presentation.compose();
                if (context.response) {
                    return;
                }
            } else {
                presentation = await composePresentation(context, tag, presentation);
                if (context.response) {
                    return;
                }
            }
        }

        presentation = await composePresentation(context, "index", presentation);

        if (context.response) {
            return;
        }

        if (!presentation) {
            return;
        }

        presentation.flatten();

        await featureTransforms(presentation);

        context.response = new Response(`<!doctype html>\n${presentation.render()}`, {
            headers: {
                "Content-Type": "text/html;charset=utf-8",
            },
        });
    }

    async function composePresentation(context: Context, tag: string, leaf?: Presentation) {
        const pres = await director.present(tag, context);

        if (pres) {
            await pres.activate();
            await pres.compose();
            if (leaf) {
                pres.replaceSlotWith(leaf.template.children);
            }
            return pres;
        }
        return leaf;
    }

    async function featureTransforms(presentation: Presentation) {
        for (const feature of features) {
            if (feature.transform) {
                await presentation.transform(feature.transform);
            }
        }
    }
}

function log(context: Context, duration: number) {
    const status = context.response!.status ?? 200;
    const loglvl = status >= 500 ? error : status >= 400 ? warn : info;
    loglvl(
        "fetch",
        `${context.response!.status} ${context.request.method} ${context.url.pathname}${
            context.url.search
        } ${chalk.gray(`${duration}ms`)}`,
    );
}

interface CacheEntry {
    timestamp: number; // Cache timestamp to manage TTL
    ttl: number; // Time to live for the cache entry
    response: {
        body: ArrayBuffer; // The response body stored as an ArrayBuffer
        headers: { [key: string]: string }; // Response headers
        status: number; // HTTP status code
        statusText: string; // HTTP status text
    };
}

class RequestCache {
    private cache: Map<string, CacheEntry>;

    constructor() {
        this.cache = new Map<string, CacheEntry>();
    }

    private async generateKey(request: Request): Promise<string> {
        const urlKey = `${request.method}:${request.url}`;
        const acceptEncoding = request.headers.get("accept-encoding") || "identity";
        // Normalize and sort accept-encoding to ensure consistent caching
        const normalizedEncoding = acceptEncoding
            .split(",")
            .map((e) => e.trim())
            .sort()
            .join(",");
        return `${urlKey}:${normalizedEncoding}`;
    }

    public async cacheResponse(request: Request, response: Response, ttl = 60 * 60 * 1000): Promise<void> {
        const key = await this.generateKey(request);
        const body = await response.arrayBuffer(); // Read the body and store it as ArrayBuffer
        const headers: Record<string, string> = {};
        // Clone headers
        response.headers.forEach((value, key) => {
            headers[key] = value;
        });
        const entry: CacheEntry = {
            timestamp: Date.now(),
            ttl,
            response: { body, headers, status: response.status, statusText: response.statusText },
        };
        this.cache.set(key, entry);
    }

    public async getCachedResponse(request: Request): Promise<Response | null> {
        const key = await this.generateKey(request);
        const entry = this.cache.get(key);

        if (entry && Date.now() - entry.timestamp < entry.ttl) {
            // Reconstruct the Response with the cached body and headers
            return new Response(entry.response.body, {
                headers: entry.response.headers,
                status: entry.response.status,
                statusText: entry.response.statusText,
            });
        }

        // If the entry is expired or doesn't exist, clean up and return null
        this.cache.delete(key);
        return null;
    }
}
