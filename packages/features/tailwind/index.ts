import { RemedyFeatureFactory, createHtmlElement, info } from "@niarada/remedy";
import typography from "@tailwindcss/typography";
import autoprefixer from "autoprefixer";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import postcss from "postcss";
import tailwind, { Config as TailwindConfig } from "tailwindcss";
import nesting from "tailwindcss/nesting";

const defaultTailwindConfig = `export default {
    content: ["./**/*.rx"],
}`;

export default function (): RemedyFeatureFactory {
    return (config) => {
        const injectedPath = "/_tailwind.css";

        if (!existsSync("tailwind.config.js") && !existsSync("tailwind.config.ts")) {
            info("tailwind", "creating 'tailwind.config.ts'");
            writeFileSync("tailwind.config.ts", defaultTailwindConfig);
        }

        return {
            name: "tailwind",
            transform(node) {
                if (node.type === "element" && node.tag === "head") {
                    node.children.push(
                        createHtmlElement(node, "link", {
                            rel: "stylesheet",
                            href: injectedPath,
                        }),
                    );
                }
                return node;
            },
            async intercede(context) {
                if (context.url.pathname.endsWith(".css")) {
                    if (context.url.pathname !== injectedPath) {
                        context.status(202);
                        return;
                    }
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
                    const stylesheet = [
                        `
                        @import "tailwindcss/base";
                        @import "tailwindcss/components";
                        @import "tailwindcss/utilities";
                    `,
                    ];
                    const indexPath = `${config.public}/index.css`;
                    if (existsSync(indexPath)) {
                        stylesheet.push(readFileSync(indexPath, "utf-8"));
                    }
                    const processor = postcss([nesting, autoprefixer, tailwind(tailwindConfig)]);
                    const result = await processor.process(stylesheet.join("\n"), {
                        // from: "<builtin>",
                        from: context.url.pathname,
                    });
                    context.response = new Response(result.css, {
                        headers: {
                            "Content-Type": "text/css;charset=utf-8",
                        },
                    });
                }
            },
        };
    };
}
