import { dirname } from "path";
import { createHtmlElement } from "~/lib/html";
import { ServerFeature } from ".";

export default function (): ServerFeature {
    return {
        name: "sse",
        async fetch(request) {
            const url = new URL(request.url);

            if (url.pathname === "/_sse") {
                const file = Bun.file(
                    `${dirname(require.resolve("htmx.org"))}/ext/sse.js`,
                );
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
                        src: "/_sse",
                        defer: "",
                    }),
                );
            }
            return node;
        },
    };
}
