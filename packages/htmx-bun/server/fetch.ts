import chalk from "chalk";
import { P, match } from "ts-pattern";
import { URL } from "url";
import { error, info, warn } from "~/lib/log";
import { watch } from "~/lib/watch";
import { MarkdownTemplate } from "~/view/markdown/template";
import { PartialView } from "~/view/partial/view";
import { Register, View } from "~/view/register";
import { Context } from "./context";
import { buildFeatures } from "./features";
import { ServerOptions } from "./options";

export async function buildFetch(options: ServerOptions) {
    const features = await buildFeatures(options);
    const register = new Register("public");
    await register.initialize();

    if (options?.features?.dev) {
        info("server", "watching 'public' directory...");
        watch("public", async (_, path) => {
            if (/\.(part|md)$/.test(path ?? "")) {
                info("server", `reloading '${path}'`);
                register.load(path!);
            }
        });
    }

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
        const url = new URL(context.request.url);
        const tag = (url.pathname.slice(1) || "root").replace(/\//g, "-");
        if (/^[a-z][-a-z0-9]+$/.test(tag) && register.get(tag)) {
            const view = register.get(tag)?.present(context);
            if (!view) {
                return;
            }
            const attributes: Record<string, string> = {};
            url.searchParams.forEach((value, name) => {
                attributes[name] = value;
            });
            if (view) {
                let content = "";
                await view.assemble(attributes);

                if (view instanceof PartialView) {
                    if (!context.renderCanceled) {
                        await featureTransforms(view);
                        content = await view.render();
                    }
                    for (const oob of context.oobs) {
                        const oobView = register.get(oob.tag)?.present(context);
                        if (!oobView || !(oobView instanceof PartialView)) {
                            warn("view", `OOB view not found: ${oob.tag}`);
                            continue;
                        }
                        content += await oobView.render(oob.attributes);
                    }
                } else {
                    content = await view.render();
                }
                context.response = new Response(content, {
                    headers: {
                        "Content-Type": "text/html;charset=utf-8",
                    },
                });
            }
        }
    }

    async function renderFull(context: Context) {
        const url = new URL(context.request.url);
        const pathway = url.pathname.slice(1).split("/").filter(Boolean);
        let view: View | undefined;

        if (pathway.length === 0) {
            pathway.push("root");
        }

        for (let i = 0; i < pathway.length; i++) {
            const tag = pathway.slice(i, pathway.length + 1 - 1).join("-");
            // If outer leaf not present, consider this resource unavailable.
            if (!view) {
                view = presentComposition(context, tag);
                if (!view) {
                    return;
                }
            } else {
                view = presentComposition(context, tag, view);
            }
        }

        view = presentComposition(context, "layout", view);

        if (!view) {
            return;
        }

        await view.assemble();

        if (context.response) {
            return;
        }

        if (view instanceof PartialView) {
            await featureTransforms(view);
        }

        context.response = new Response(
            `<!doctype html>\n${await view.render()}`,
            {
                headers: {
                    "Content-Type": "text/html;charset=utf-8",
                },
            },
        );
    }

    function presentComposition(context: Context, tag: string, leaf?: View) {
        const template = register.get(tag);
        if (template) {
            if (leaf && template instanceof MarkdownTemplate) {
                error(
                    "fetch",
                    "Bad composition, markdown views don't have slots.",
                );
            }
            if (leaf) {
                if (template instanceof MarkdownTemplate) {
                    error(
                        "fetch",
                        "Bad composition, markdown views don't have slots.",
                    );
                    return template.present();
                }
                return template.present(context, leaf);
            }
            return template.present(context);
        }
        return leaf;
    }

    async function featureTransforms(view: PartialView) {
        for (const feature of features) {
            if (feature.transform) {
                await view.transform(feature.transform);
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
