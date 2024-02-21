import { ServerFeature } from ".";

export default function (): ServerFeature {
    return {
        async fetch(request) {
            const url = new URL(request.url);

            if (url.pathname === "/_htmx") {
                const file = Bun.file(require.resolve("htmx.org"));
                return new Response(file, {
                    headers: {
                        "Content-Type": file.type,
                    },
                });
            }
        },
        element(element) {
            if (element.tag === "head") {
                element.append("script", {
                    type: "module",
                    src: "/_htmx",
                    defer: "",
                });
            }
        },
    };
}
