import chalk from "chalk";
import { P, match } from "ts-pattern";
import { Director } from "~/hypermedia/director";
import { Presentation } from "~/hypermedia/presentation";
import { error, info, warn } from "~/lib/log";
import { Context } from "./context";
import { buildFeatures } from "./features";
import { ServerOptions } from "./options";

export async function buildFetch(options: ServerOptions) {
    const director = new Director(options.base);

    if (options?.features?.dev) {
        director.watch();
    }

    const features = await buildFeatures(options);

    return async (request: Request) => {
        const time = Bun.nanoseconds();
        const context = new Context(request);
        await context.loadForm();

        for (const feature of features) {
            if (feature.intercede) {
                context.response = await feature.intercede(context);
                if (context.response) {
                    break;
                }
            }
        }

        if (!context.response) {
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

        return context.response;
    };

    async function renderPartial(context: Context) {
        const tag =
            context.url.pathname.slice(1).replace(/\//g, "-") || "layout";
        const rep = await director.represent(tag);
        if (!rep) {
            return;
        }
        const content: string[] = [];
        const pres = await rep.present(context, context.form);
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
        const pathway = context.url.pathname
            .slice(1)
            .split("/")
            .filter(Boolean);
        let pres: Presentation | undefined;

        for (let i = 0; i < pathway.length; i++) {
            const tag = pathway.slice(i, pathway.length + 1 - 1).join("-");
            // If outer leaf not present, consider this resource unavailable.
            if (!pres) {
                pres = await director.present(tag, context, context.form);
                if (!pres) {
                    return;
                }
                await pres.activate();
                await pres.compose();
                if (context.response) {
                    return;
                }
            } else {
                pres = await composePresentation(context, tag, pres);
                if (context.response) {
                    return;
                }
            }
        }

        pres = await composePresentation(context, "layout", pres);
        if (context.response) {
            return;
        }

        if (!pres) {
            return;
        }

        pres.flatten();

        await featureTransforms(pres);

        context.response = new Response(`<!doctype html>\n${pres.render()}`, {
            headers: {
                "Content-Type": "text/html;charset=utf-8",
            },
        });
    }

    async function composePresentation(
        context: Context,
        tag: string,
        leaf?: Presentation,
    ) {
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
        `${context.response!.status} ${context.request.method} ${
            context.url.pathname
        }${context.url.search} ${chalk.gray(`${duration}ms`)}`,
    );
}
