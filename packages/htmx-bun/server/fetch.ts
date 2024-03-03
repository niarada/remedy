import chalk from "chalk";
import { URL } from "url";
import { debug, error, info, warn } from "~/lib/log";
import { watch } from "~/lib/watch";
import { ServerOptions } from "~/server/options";
import { TemplateRegister } from "~/view/register";
import { buildFeatures } from "./features";

export async function buildFetch(options: ServerOptions) {
    const features = await buildFeatures(options);
    const register = new TemplateRegister("view");
    await register.initialize();

    if (options?.features?.dev) {
        info("server", "watching 'view' directory...");
        watch("view", async (_, path) => {
            if (!path || !path?.endsWith(".part")) {
                return;
            }
            let tag = path.slice(0, -5).replace(/\//g, "-");
            if (tag === "index") {
                tag = "root";
            }
            info("server", "reloading tag", tag);
            register.reload(tag);
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
            const tag = (url.pathname.slice(1) || "root").replace(/\//g, "-");
            if (/^[a-z][-a-z0-9]+$/.test(tag)) {
                const view = register.get(tag).present();
                const attributes: Record<string, string> = {};
                url.searchParams.forEach((value, name) => {
                    attributes[name] = value;
                });
                if (view) {
                    let content = "";
                    await view.assemble(attributes);
                    if (!view.helper.renderCanceled) {
                        for (const feature of features) {
                            if (feature.transform) {
                                await view.transform(feature.transform);
                            }
                        }
                        content = await view.render();
                    }
                    for (const oob of view.helper.oobs) {
                        const oobView = register.get(oob.tag).present();
                        content += await oobView.render(oob.attributes);
                    }
                    response = new Response(content, {
                        headers: {
                            "Content-Type": "text/html;charset=utf-8",
                        },
                    });
                }
            }
        }

        if (!response) {
            response = new Response(null, {
                status: 404,
                statusText: "Not Found",
            });
        }

        // if (response.headers.get("Content-Type")?.startsWith("text/html")) {
        //     response = new Response(transform(await response.text()), {
        //         status: response.status,
        //         statusText: response.statusText,
        //         headers: response.headers,
        //     });
        // }

        log(url, response, Math.floor((Bun.nanoseconds() - time) / 1000000));

        return response;
    };
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
