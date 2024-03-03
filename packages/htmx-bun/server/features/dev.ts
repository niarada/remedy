import EventEmitter from "events";
import { formatTypeScript } from "~/lib/format";
import { createHtmlElement } from "~/lib/html";
import { info } from "~/lib/log";
import { watch } from "~/lib/watch";
import { ServerFeature } from ".";
import { ServerOptions } from "../options";

export default function (options: ServerOptions): ServerFeature {
    const emitter = new EventEmitter();

    // XXX: Verify this is not being picked up in a user installed version.
    //      (probably need to exclude .env in files)
    info("dev", "watching framework directory...");
    if (process.env.FRAMEWORK_DEV) {
        watch(`${import.meta.dir}/../../`, () => {
            info("dev", "Sending refresh...");
            emitter.emit("refresh");
        });
    }

    info("dev", "watching 'view' directory...");
    watch("view", () => {
        info("dev", "Sending refresh...");
        emitter.emit("refresh");
    });

    return {
        name: "dev",
        async fetch(request) {
            const url = new URL(request.url);
            const pathname = url.pathname;

            if (pathname === "/_dev") {
                // const product = await Bun.build({
                //     entrypoints: [`${import.meta.dir}/../../client/dev.ts`],
                // });
                let content = `
                    new EventSource("/_dev_stream").addEventListener("refresh", (event) => {
                        location.reload();
                    });
                `;
                if (options.features?.htmx?.debug) {
                    content += `
                        window.addEventListener("load", () => {
                            htmx.logger = (el, event, data) => {
                                if (console) {
                                    console.log(event, el, data);
                                }
                            };
                        });
                    `;
                }
                return new Response(
                    //product.outputs[0],
                    await formatTypeScript(content),
                    {
                        headers: {
                            // "Content-Type": product.outputs[0].type,
                            "Content-Type":
                                "application/javascript; charset=utf-8",
                        },
                    },
                );
            }

            if (pathname === "/_dev_stream") {
                return new Response(
                    new ReadableStream({
                        type: "direct",
                        async pull(controller: ReadableStreamDirectController) {
                            const client = () => {
                                controller.write("event: refresh\ndata:\n\n");
                            };
                            emitter.on("refresh", client);
                            while (!request.signal.aborted) {
                                await Bun.sleep(1000);
                            }
                            emitter.off("refresh", client);
                            controller.close();
                            return new Promise(() => void 0);
                        },
                    }),
                    {
                        headers: {
                            "Content-Type": "text/event-stream",
                            "Cache-Control": "no-cache",
                            Connection: "keep-alive",
                        },
                    },
                );
            }
        },
        async transform(node) {
            if (node.type === "element" && node.tag === "head") {
                node.children.push(
                    createHtmlElement(node, "script", {
                        type: "module",
                        src: "/_dev",
                    }),
                );
            }
            return node;
        },
    };
}
