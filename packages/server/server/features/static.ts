import { ServerFeature } from ".";

export default function (): ServerFeature {
    return {
        name: "static",
        async intercede(context) {
            const file = Bun.file(`public${context.url.pathname}`);
            if (await file.exists()) {
                return new Response(file, {
                    headers: {
                        "Content-Type": file.type,
                    },
                });
            }
        },
    };
}
