import autoprefixer from "autoprefixer";
import postcss from "postcss";
import tailwind from "tailwindcss";
import { createHtmlElement } from "~/lib/html";
import { ServerFeature } from ".";

export default function (): ServerFeature {
    return {
        name: "tailwind",
        async fetch(request) {
            const url = new URL(request.url);

            if (url.pathname === "/_tailwind") {
                const css = `
                    @import "tailwindcss/base";
                    @import "tailwindcss/components";
                    @import "tailwindcss/utilities";
                `;
                const processor = postcss([
                    autoprefixer,
                    tailwind({
                        content: ["./view/**/*.{html,ts}"],
                    }),
                ]);
                const result = await processor.process(css, {
                    from: "<builtin>",
                });

                return new Response(result.css, {
                    headers: {
                        "Content-Type": "text/css;charset=utf-8",
                    },
                });
            }
        },
        async transform(node) {
            if (node.type === "element" && node.tag === "head") {
                node.children.push(
                    createHtmlElement(node, "link", {
                        rel: "stylesheet",
                        href: "/_tailwind",
                    }),
                );
            }
            return node;
        },
    };
}
