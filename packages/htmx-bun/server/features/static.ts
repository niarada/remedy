import { ServerFeature } from ".";

export default function (): ServerFeature {
    return {
        name: "static",
        async fetch(request) {
            const url = new URL(request.url);
            const file = Bun.file(`view${url.pathname}`);

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
