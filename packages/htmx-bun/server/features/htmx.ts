import { createHtmlElement } from "~/lib/html";
import { ServerFeature } from ".";

export interface HtmxOptions {
    debug?: boolean;
}

export default function (): ServerFeature {
    return {
        name: "htmx",
        async fetch(request) {
            const url = new URL(request.url);

            if (url.pathname === "/_htmx") {
                const file = Bun.file(require.resolve("htmx.org"));
                return new Response(file, {
                    headers: {
                        "Content-Type": file.type,
                    },
                });
            }
        },
        async transform(node) {
            if (node.type === "element" && node.tag === "head") {
                node.children.push(
                    createHtmlElement(node, "script", {
                        type: "module",
                        src: "/_htmx",
                    }),
                );
            }
            return node;
        },
    };
}
