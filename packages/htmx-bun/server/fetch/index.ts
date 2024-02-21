import chalk from "chalk";
import { URL } from "url";
import { walkHtml } from "~/lib/html";
import { debug, error, info, warn } from "~/lib/log";
import { ServerFeature } from "../features";

export function buildFetch(features: ServerFeature[]) {
    function transform(html: string) {
        return walkHtml(html, (node) => {
            for (const feature of features) {
                feature.element?.(node);
            }
        }) as string;
    }

    return async (request: Request) => {
        const time = Bun.nanoseconds();
        const url = new URL(request.url);

        let response: Response | undefined;

        for (const feature of features) {
            response = await feature.fetch?.(request);
            if (response) {
                break;
            }
        }

        if (!response) {
            response = new Response(null, {
                status: 404,
                statusText: "Not Found",
            });
        }

        if (response.headers.get("Content-Type")?.startsWith("text/html")) {
            response = new Response(transform(await response.text()), {
                status: response.status,
                statusText: response.statusText,
                headers: response.headers,
            });
        }

        log(url, response, Math.floor((Bun.nanoseconds() - time) / 1000000));

        return response;
    };
}

function log(url: URL, response: Response, duration: number) {
    const line = `${url.pathname}${url.search} ${chalk.gray(`${duration}ms`)}`;
    if (response.status > 500) {
        error(response.status, line);
    } else if (response.status > 400) {
        warn(response.status, line);
    } else if (response.status > 300) {
        debug(response.status, line);
    } else {
        info(response.status, line);
    }
}
