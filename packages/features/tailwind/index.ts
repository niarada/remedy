import { RemedyFeatureFactory, createHtmlElement, info } from "@niarada/remedy";
import typography from "@tailwindcss/typography";
import autoprefixer from "autoprefixer";
import { existsSync, writeFileSync } from "node:fs";
import postcss from "postcss";
import tailwind, { Config as TailwindConfig } from "tailwindcss";

const defaultTailwindConfig = `export default {
    content: ["./**/*.part"],
}`;

export default function (): RemedyFeatureFactory {
    return () => {
        if (!existsSync("tailwind.config.js") && !existsSync("tailwind.config.ts")) {
            info("tailwind", "creating 'tailwind.config.ts'");
            writeFileSync("tailwind.config.ts", defaultTailwindConfig);
        }

        return {
            async intercede(context) {
                if (context.url.pathname === "/_tailwind") {
                    let tailwindConfig = {} as TailwindConfig;
                    if (existsSync("tailwind.config.ts")) {
                        tailwindConfig = (await import(`${process.cwd()}/tailwind.config.ts`)).default;
                    }
                    if (!tailwindConfig.plugins) {
                        tailwindConfig.plugins = [];
                    }
                    if (!tailwindConfig.plugins?.includes(typography)) {
                        tailwindConfig.plugins?.push(typography);
                    }
                    const css = `
                    @import "tailwindcss/base";
                    @import "tailwindcss/components";
                    @import "tailwindcss/utilities";
                `;
                    const processor = postcss([autoprefixer, tailwind(tailwindConfig)]);
                    const result = await processor.process(css, {
                        from: "<builtin>",
                    });
                    return new Response(result.css, {
                        headers: {
                            "Content-Type": "text/css;charset=utf-8",
                        },
                    });
                }
                return undefined;
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
    };
}
