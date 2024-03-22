import { createHtmlElementAttribute } from "~/hypermedia/template";
import { ServerFeature } from ".";
import { ServerOptions } from "../options";

export default function (options: ServerOptions): ServerFeature {
    return {
        name: "typescript",
        async intercede(context) {
            if (!context.url.pathname.endsWith(".ts")) {
                return;
            }
            const result = await Bun.build({
                entrypoints: [`${options.base}${context.url.pathname}`],
                sourcemap: "inline",
            });
            const file = result.outputs[0];
            return new Response(file, {
                headers: {
                    "Content-Type": file.type,
                },
            });
        },

        transform(node) {
            if (node.type === "element" && node.tag === "script") {
                const src = node.attrs.find((attr) => attr.name === "src");
                if (src) {
                    if (!src.value[0]?.content.endsWith(".ts")) {
                        return node;
                    }
                }
                node.attrs = node.attrs.filter((attr) => attr.name !== "type");
                node.attrs.push(createHtmlElementAttribute("type", "module"));
            }
            return node;
        },
    };
}
