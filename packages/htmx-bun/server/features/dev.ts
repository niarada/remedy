import EventEmitter from "events";
import { createHtmlElement } from "~/hypermedia/template";
import { formatTypeScript } from "~/lib/format";
import { info } from "~/lib/log";
import { watch } from "~/lib/watch";
import { ServerFeature } from ".";
import { ServerOptions } from "../options";

export default function (options: ServerOptions): ServerFeature {
    if (!global.emitter) {
        global.emitter = new EventEmitter();
    } else {
        info("dev", "sending refresh...");
        emitter.emit("refresh");
    }

    info("dev", "watching for changes...");
    watch(options.base!, () => {
        info("dev", "sending refresh...");
        emitter.emit("refresh");
    });

    return {
        name: "dev",
        async intercede(context) {
            if (context.url.pathname === "/_dev") {
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
                return new Response(formatTypeScript(content), {
                    headers: {
                        "Content-Type": "application/javascript; charset=utf-8",
                    },
                });
            }

            if (context.url.pathname === "/_dev_stream") {
                return new Response(
                    new ReadableStream({
                        type: "direct",
                        async pull(controller: ReadableStreamDirectController) {
                            const client = () => {
                                controller.write("event: refresh\ndata:\n\n");
                            };
                            emitter.on("refresh", client);
                            while (!context.request.signal.aborted) {
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
        transform(node) {
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
