import { RemedyFeatureFactory, createHtmlElement } from "@niarada/remedy";
import { dirname } from "node:path";

export default function (): RemedyFeatureFactory {
    return (config) => ({
        name: "sse",
        async intercede(context) {
            if (context.url.pathname === "/_sse") {
                const file = Bun.file(`${dirname(require.resolve("htmx.org"))}/ext/sse.js`);
                return new Response(file, {
                    headers: {
                        "Content-Type": file.type,
                    },
                });
            }
            return undefined;
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
    });
}
