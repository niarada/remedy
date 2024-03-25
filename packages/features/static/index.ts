import { RemedyFeatureFactory } from "@niarada/remedy";

export default function (): RemedyFeatureFactory {
    return (config) => ({
        name: "static",
        async intercede(context) {
            const file = Bun.file(`${config.public}${context.url.pathname}`);
            if (await file.exists()) {
                return new Response(file, {
                    headers: {
                        "Content-Type": file.type,
                    },
                });
            }
            return undefined;
        },
    });
}
