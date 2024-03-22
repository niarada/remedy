import { ServerFeature } from ".";
import { ServerOptions } from "../options";

export default function (options: ServerOptions): ServerFeature {
    return {
        name: "static",
        async intercede(context) {
            const file = Bun.file(`${options.base}${context.url.pathname}`);
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
