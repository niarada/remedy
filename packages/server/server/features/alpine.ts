import { createHtmlElement } from "~/hypermedia/template";
import { ServerFeature } from ".";

export interface HtmxOptions {
    debug?: boolean;
}

export default function (): ServerFeature {
    return {
        name: "alpine",
        async intercede(context) {
            if (context.url.pathname === "/_alpine") {
                const file = Bun.file(require.resolve("alpinejs/dist/cdn"));
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
                        src: "/_alpine",
                    }),
                );
            }
            return node;
        },
    };
}
