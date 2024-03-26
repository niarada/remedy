import { RemedyFeatureFactory, info } from "@niarada/remedy";
import typography from "@tailwindcss/typography";
import autoprefixer from "autoprefixer";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import postcss from "postcss";
import tailwind, { Config as TailwindConfig } from "tailwindcss";
import nesting from "tailwindcss/nesting";

const defaultTailwindConfig = `export default {
    content: ["./**/*.part"],
}`;

export default function (): RemedyFeatureFactory {
    return (config) => {
        if (!existsSync("tailwind.config.js") && !existsSync("tailwind.config.ts")) {
            info("tailwind", "creating 'tailwind.config.ts'");
            writeFileSync("tailwind.config.ts", defaultTailwindConfig);
        }

        return {
            name: "tailwind",
            async intercede(context) {
                if (context.url.pathname.endsWith(".css")) {
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
                    const css = readFileSync(`${config.public}${context.url.pathname}`, "utf-8");
                    const processor = postcss([nesting, autoprefixer, tailwind(tailwindConfig)]);
                    const result = await processor.process(css, {
                        // from: "<builtin>",
                        from: context.url.pathname,
                    });
                    return new Response(result.css, {
                        headers: {
                            "Content-Type": "text/css;charset=utf-8",
                        },
                    });
                }
                return undefined;
            },
        };
    };
}
