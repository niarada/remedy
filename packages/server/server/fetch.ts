import chalk from "chalk";
import { P, match } from "ts-pattern";
import { Director } from "~/hypermedia/director";
import { Presentation } from "~/hypermedia/presentation";
import { error, info, warn } from "~/lib/log";
import { applyCompression } from "./compression";
import { Context } from "./context";
import { buildFeatures } from "./features";
import { ServerOptions } from "./options";

export async function buildFetch(options: ServerOptions) {
    const director = new Director(options.base);

    if (options?.features?.dev) {
        director.watch();
    }

    const features = await buildFeatures(options);

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
        await pres.activate();

        if (!context.renderCanceled) {
            await pres.compose();
            await pres.flatten();
            await featureTransforms(pres);
            content.push(pres.render());
        }
        for (const oob of context.oobs) {
            if (await director.represent(oob.tag)) {
                content.push((await director.render(oob.tag, context))!);
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
        const pathway = context.url.pathname.slice(1).split("/").filter(Boolean);
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

        // XXX: If the path /index had been specifically requested, it will be wrapped in itself,
        //      so fix that are throw an error.
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
                presentation.transform(feature.transform);
            }
        }
    }
}

function log(context: Context, duration: number) {
    const loglvl = match(context.response!.status)
        .with(P.number.between(500, 599), () => error)
        .with(P.number.between(400, 499), () => warn)
        .otherwise(() => info);
    loglvl(
        "fetch",
        `${context.response!.status} ${context.request.method} ${context.url.pathname}${
            context.url.search
        } ${chalk.gray(`${duration}ms`)}`,
    );
}
