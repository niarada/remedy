import { dirname } from "path";
import { createHtmlElement } from "~/view/partial/ast";
import { ServerFeature } from ".";

export default function (): ServerFeature {
    return {
        name: "sse",
        async fetch(request) {
            const url = new URL(request.url);

            if (url.pathname === "/_fontawesome") {
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
            if (url.pathname.startsWith("/webfonts/")) {
                const file = Bun.file(
                    `${dirname(
                        require.resolve("@fortawesome/fontawesome-free"),
                    )}/..${url.pathname}`,
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
