import { RemedyFeatureFactory } from "@niarada/remedy";

export default function (): RemedyFeatureFactory {
    return (config) => ({
        name: "static",
        async intercede(context) {
            const candidates = [`${config.public}${context.url.pathname}`];
            if (!context.url.pathname.includes(".")) {
                if (context.url.pathname.endsWith("/")) {
                    candidates.push(`${config.public}${context.url.pathname}index.html`);
                } else {
                    candidates.push(
                        `${config.public}${context.url.pathname}.html`,
                        `${config.public}${context.url.pathname}/index.html`,
                    );
                }
            }
            for (const candidate of candidates) {
                const file = Bun.file(candidate);
                if (await file.exists()) {
                    context.response = new Response(file, {
                        headers: {
                            "Content-Type": file.type,
                        },
                    });
                    return;
                }
            }
        },
    });
}
