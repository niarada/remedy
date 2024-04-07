import { RemedyFeatureFactory, createHtmlElement, formatTypeScript, info, watch } from "@niarada/remedy";
import EventEmitter from "node:events";

declare global {
    var emitter: EventEmitter;
}

export default function (): RemedyFeatureFactory {
    return (config) => {
        if (process.env.NODE_ENV === "production") {
            return { name: "refresh (disabled)" };
        }

        if (!global.emitter) {
            global.emitter = new EventEmitter();
        } else {
            info("refresh", "sending refresh");
            emitter.emit("refresh");
        }

        info("refresh", `watching for changes in '${config.public}'`);
        watch(config.public, (_, path) => {
            if (path?.endsWith("config.ts")) {
                return;
            }
            info("refresh", "sending refresh...");
            emitter.emit("refresh");
        });

        return {
            name: "refresh",
            async intercede(context) {
                if (context.url.pathname === "/_refresh") {
                    const content = `
                    new EventSource("/_refresh_stream").addEventListener("refresh", (event) => {
                        location.reload();
                    });
                `;
                    context.response = new Response(formatTypeScript(content), {
                        headers: {
                            "Content-Type": "application/javascript; charset=utf-8",
                        },
                    });
                }

                if (context.url.pathname === "/_refresh_stream") {
                    context.response = new Response(
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
                                "Content-Type": "text/event-stream; charset=utf-8",
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
                            src: "/_refresh",
                        }),
                    );
                }
                return node;
            },
        };
    };
}
