import { RemedyFeatureFactory, createHtmlElement } from "@niarada/remedy";
import { dirname } from "node:path";

export const factory: RemedyFeatureFactory = (config) => {
    return {
        async intercede(context) {
            if (context.url.pathname === "/_fontawesome") {
                const file = Bun.file(`${dirname(require.resolve("@fortawesome/fontawesome-free"))}/../css/all.css`);
                return new Response(file, {
                    headers: {
                        "Content-Type": file.type,
                    },
                });
            }
            if (context.url.pathname.startsWith("/webfonts/")) {
                const file = Bun.file(
                    `${dirname(require.resolve("@fortawesome/fontawesome-free"))}/..${context.url.pathname}`,
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
};
