import chalk from "chalk";
import { URL } from "url";
import { debug, error, info, warn } from "~/lib/log";
import { watch } from "~/lib/watch";
import { ServerOptions } from "~/server/options";
import { MarkdownTemplate } from "~/view/markdown/template";
import { PartialView } from "~/view/partial/view";
import { Register, View } from "~/view/register";
import { buildFeatures } from "./features";

export async function buildFetch(options: ServerOptions) {
    const features = await buildFeatures(options);
    const register = new Register("public");
    await register.initialize();

    if (options?.features?.dev) {
        info("server", "watching 'public' directory...");
        watch("public", async (_, path) => {
            if (!path || !path?.endsWith(".part")) {
                return;
            }
            info("server", `reloading partial '${path}'`);
            register.load(path);
        });
    }

    return async (request: Request) => {
        const time = Bun.nanoseconds();
        const url = new URL(request.url);

        let response: Response | undefined;

        for (const feature of features) {
            if (feature.fetch) {
                response = await feature.fetch(request);
                if (response) {
                    break;
                }
            }
        }

        if (!response) {
            if (request.headers.get("HX-Request")) {
                response = await renderPartial(request);
            } else {
                response = await renderFull(request);
            }
        }

        if (!response) {
            response = new Response(null, {
                status: 404,
                statusText: "Not Found",
            });
        }

        log(url, response, Math.floor((Bun.nanoseconds() - time) / 1000000));

        return response;
    };

    async function renderPartial(
        request: Request,
    ): Promise<Response | undefined> {
        const url = new URL(request.url);
        const tag = (url.pathname.slice(1) || "root").replace(/\//g, "-");
        if (/^[a-z][-a-z0-9]+$/.test(tag) && register.get(tag)) {
            const view = register.get(tag)?.present();
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
                    if (!view.helper.renderCanceled) {
                        await featureTransforms(view);
                        content = await view.render();
                    }
                    for (const oob of view.helper.oobs) {
                        const oobView = register.get(oob.tag)?.present();
                        if (!oobView || !(oobView instanceof PartialView)) {
                            warn("view", `OOB view not found: ${oob.tag}`);
                            continue;
                        }
                        content += await oobView.render(oob.attributes);
                    }
                } else {
                    content = await view.render();
                }
                return new Response(content, {
                    headers: {
                        "Content-Type": "text/html;charset=utf-8",
                    },
                });
            }
        }
    }

    async function renderFull(request: Request): Promise<Response | undefined> {
        const url = new URL(request.url);
        const pathway = url.pathname.slice(1).split("/").filter(Boolean);
        let view: View | undefined;

        for (let i = 0; i < pathway.length; i++) {
            const tag = pathway.slice(i, pathway.length + 1 - 1).join("-");
            view = presentComposition(tag, view);
        }

        view = presentComposition("root", view);

        if (!view) {
            return;
        }

        await view.assemble();

        if (view instanceof PartialView) {
            await featureTransforms(view);
        }

        return new Response(`<!doctype html>\n${await view.render()}`, {
            headers: {
                "Content-Type": "text/html;charset=utf-8",
            },
        });
    }

    function presentComposition(tag: string, leaf: View | undefined) {
        const template = register.get(tag);
        if (template) {
            if (leaf && template instanceof MarkdownTemplate) {
                error(
                    "view",
                    "Bad composition, markdown views don't have slots.",
                );
            }
            if (leaf) {
                if (template instanceof MarkdownTemplate) {
                    error(
                        "view",
                        "Bad composition, markdown views don't have slots.",
                    );
                    return template.present();
                }
                return template.present(leaf);
            }
            return template.present();
        }
    }

    async function featureTransforms(view: PartialView) {
        for (const feature of features) {
            if (feature.transform) {
                await view.transform(feature.transform);
            }
        }
    }
}

function log(url: URL, response: Response, duration: number) {
    const line = `${url.pathname}${url.search} ${chalk.gray(`${duration}ms`)}`;
    if (response.status > 500) {
        error(response.status, line);
    } else if (response.status > 400) {
        warn(response.status, line);
    } else if (response.status > 300) {
        debug(response.status, line);
    } else {
        info(response.status, line);
    }
}
