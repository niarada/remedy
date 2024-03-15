import typography from "@tailwindcss/typography";
import autoprefixer from "autoprefixer";
import { existsSync } from "fs";
import postcss from "postcss";
import { mergeDeepWith } from "ramda";
import tailwind, { Config as TailwindConfig } from "tailwindcss";
import { createHtmlElement } from "~/hypermedia/template";
import { ServerFeature } from ".";

export default function (): ServerFeature {
    return {
        name: "tailwind",
        async intercede(context) {
            if (context.url.pathname === "/_tailwind") {
                let config: TailwindConfig = {
                    content: ["./public/**/*.part"],
                    plugins: [typography],
                };
                if (existsSync("tailwind.config.ts")) {
                    config = mergeDeepWith(
                        (_, b) => b,
                        config,
                        (await import(`${process.cwd()}/tailwind.config.ts`))
                            .default,
                    );
                }
                const css = `
                    @import "tailwindcss/base";
                    @import "tailwindcss/components";
                    @import "tailwindcss/utilities";
                `;
                const processor = postcss([autoprefixer, tailwind(config)]);
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
        transform(node) {
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
