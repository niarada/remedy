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
import { applyCompression } from "./compression";

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
        info("server", `feature: ${item}`);
        features.push(await factory(config));
    }
    return features;
}

export async function buildFetch(config: Required<RemedyConfig>) {
    const director = new Director(config.public);

    if (process.env.NODE_ENV === "development") {
        director.watch();
    }

    const features = await buildFeatures(config);

    return async (request: Request): Promise<Response> => {
        const time = Bun.nanoseconds();

        const context = new Context(request);

        if (context.url.pathname !== "/" && context.url.pathname.endsWith("/")) {
            context.redirect(context.url.pathname.slice(0, -1));
            return context.response!;
        }

        await context.loadForm();

        for (const feature of features) {
            if (feature.intercede) {
                context.response = await feature.intercede(context);
                if (context.response) {
                    break;
                }
            }
        }

        if (!context.response && (context.url.pathname === "/" || /^\/[a-z][a-z0-9-\/]*$/.test(context.url.pathname))) {
            if (request.headers.get("HX-Request")) {
                await renderPartial(context);
            } else {
                await renderFull(context);
            }
        }

        if (!context.response) {
            context.response = new Response(null, {
                status: 404,
                statusText: "Not Found",
            });
        }

        log(context, Math.floor((Bun.nanoseconds() - time) / 1000000));
        return applyCompression(request, context.response);
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

        // console.log(scripts);

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
