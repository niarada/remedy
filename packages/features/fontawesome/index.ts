import { RemedyFeatureFactory, createHtmlElement } from "@niarada/remedy";
import { dirname } from "node:path";

export default function (): RemedyFeatureFactory {
    return (config) => ({
        name: "fontawesome",
        async intercede(context) {
            if (context.url.pathname === "/_fontawesome") {
                const file = Bun.file(`${dirname(require.resolve("@fortawesome/fontawesome-free"))}/../css/all.css`);
                context.response = new Response(file, {
                    headers: {
                        "Content-Type": file.type,
                    },
                });
            }
            if (context.url.pathname.startsWith("/webfonts/")) {
                const file = Bun.file(
                    `${dirname(require.resolve("@fortawesome/fontawesome-free"))}/..${context.url.pathname}`,
                );
                context.response = new Response(file, {
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
    });
}
