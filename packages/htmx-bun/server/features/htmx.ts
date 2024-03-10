import { createHtmlElement } from "~/hypermedia/template";
import { ServerFeature } from ".";

export interface HtmxOptions {
    debug?: boolean;
}

export default function (): ServerFeature {
    return {
        name: "htmx",
        async intercede(context) {
            if (context.url.pathname === "/_htmx") {
                const file = Bun.file(require.resolve("htmx.org"));
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
                        src: "/_htmx",
                    }),
                );
            }
            return node;
        },
    };
}
