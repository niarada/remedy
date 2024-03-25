import { RemedyFeatureFactory, createHtmlElement } from "@niarada/remedy";
import { createHtmlText } from "@niarada/remedy-template";

export interface HtmxOptions {
    debug?: boolean;
}

export default function (options: HtmxOptions = {}): RemedyFeatureFactory {
    return () => ({
        name: "htmx",
        async intercede(context) {
            if (context.url.pathname === "/_htmx") {
                const file = Bun.file(require.resolve("htmx.org"));
                return new Response(file, {
                    headers: {
                        "Content-Type": file.type,
                    },
                });
            }
            return undefined;
        },
        transform(node) {
            if (node.type === "element" && node.tag === "head") {
                node.children.push(
                    createHtmlElement(node, "script", {
                        type: "module",
                        src: "/_htmx",
                    }),
                );
                if (options.debug) {
                    const script = createHtmlElement(node, "script");
                    node.children.push(script);
                    script.children.push(
                        createHtmlText(
                            script,
                            `
                                window.addEventListener("load", () => {
                                    htmx.logger = (el, event, data) => {
                                        if (console) {
                                            console.log(event, el, data);
                                        }
                                    };
                                });
                            `,
                        ),
                    );
                }
            }
            return node;
        },
    });
}
