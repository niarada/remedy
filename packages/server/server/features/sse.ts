import { dirname } from "path";
import { createHtmlElement } from "~/hypermedia/template";
import { ServerFeature } from ".";

export default function (): ServerFeature {
    return {
        name: "sse",
        async intercede(context) {
            if (context.url.pathname === "/_sse") {
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
        transform(node) {
            if (node.type === "element" && node.tag === "head") {
                node.children.push(
                    createHtmlElement(node, "script", {
                        type: "module",
                        src: "/_sse",
                    }),
                );
            }
            return node;
        },
    };
}
