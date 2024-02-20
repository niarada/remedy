import EventEmitter from "events";
import { watch } from "fs";
import { ServerFeature } from ".";

export default function (): ServerFeature {
    const watchers = new Set();
    const emitter = new EventEmitter();

    watchers.add(
        watch(`${import.meta.dir}/../..`, { recursive: true }, () => {
            emitter.emit("refresh");
        }),
    );

    watchers.add(
        watch(".", { recursive: true }, () => {
            emitter.emit("refresh");
        }),
    );

    return {
        async fetch(request) {
            const url = new URL(request.url);
            const pathname = url.pathname;

            if (pathname === "/_dev") {
                const product = await Bun.build({
                    entrypoints: [`${import.meta.dir}/../../client/dev.ts`],
                });
                return new Response(product.outputs[0], {
                    headers: {
                        "Content-Type": product.outputs[0].type,
                    },
                });
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
        element(element) {
            if (element.tagName === "body") {
            }
            if (element.tagName === "head") {
                element.append(
                    `<script type="module" src="/_dev" defer></script>\n`,
                    {
                        html: true,
                    },
                );
            }
        },
    };
}
