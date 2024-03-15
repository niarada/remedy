import { dirname } from "path";
import { createHtmlElement } from "~/hypermedia/template";
import { ServerFeature } from ".";

export default function (): ServerFeature {
    return {
        name: "sse",
        async intercede(context) {
            if (context.url.pathname === "/_fontawesome") {
                const file = Bun.file(
                    `${dirname(
                        require.resolve("@fortawesome/fontawesome-free"),
                    )}/../css/all.css`,
                );
                return new Response(file, {
                    headers: {
                        "Content-Type": file.type,
                    },
                });
            }
            if (context.url.pathname.startsWith("/webfonts/")) {
                const file = Bun.file(
                    `${dirname(
                        require.resolve("@fortawesome/fontawesome-free"),
                    )}/..${context.url.pathname}`,
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
                    createHtmlElement(node, "link", {
                        rel: "stylesheet",
                        href: "/_fontawesome",
                    }),
                );
            }
            return node;
        },
    };
}
