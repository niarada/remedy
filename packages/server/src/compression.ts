import { deflateSync, gzipSync } from "bun";
import { createDeflate, createGzip } from "node:zlib";

class CompressionStream {
    readable: ReadableStream;
    writable: WritableStream;

    constructor(format: "gzip" | "deflate") {
        const handle = format === "gzip" ? createGzip() : createDeflate();

        this.readable = new ReadableStream({
            start(controller) {
                handle.on("data", (chunk: Uint8Array) => controller.enqueue(chunk));
                handle.once("end", () => controller.close());
            },
        });

        this.writable = new WritableStream({
            write: (chunk: Uint8Array) => {
                handle.write(chunk);
            },
            close: () => {
                handle.end();
            },
        });
    }
}

const toBuffer = (data: unknown, encoding: BufferEncoding) => {
    return Buffer.from(
        typeof data === "object" ? JSON.stringify(data) : data?.toString() ?? new String(data),
        encoding,
    );
};

export function applyCompression(request: Request, response: Response) {
    if (response.headers.get("connection") === "keep-alive" || !isCompressible(response.headers.get("Content-Type"))) {
        return response;
    }
    const accept = request.headers.get("Accept-Encoding") ?? "";
    const format = (accept.includes("gzip") && "gzip") || (accept.includes("deflate") && "deflate");
    if (!format) {
        return response;
    }
    return new Response(
        response.body instanceof ReadableStream
            ? response.body.pipeThrough(new CompressionStream(format))
            : format === "gzip"
              ? gzipSync(toBuffer(response.body, "utf-8"))
              : deflateSync(toBuffer(response.body, "utf-8")),
        {
            headers: { ...Object.fromEntries(response.headers.entries()), "Content-Encoding": format },
            status: response.status,
            statusText: response.statusText,
        },
    );
}

function isCompressible(type: string | null) {
    if (!type) {
        return false;
    }
    for (const compressedType of compressedTypes) {
        if (type.startsWith(compressedType)) {
            return true;
        }
    }
    return false;
}

const compressedTypes = [
    "text/html",
    "text/css",
    "text/plain",
    "text/xml",
    "text/x-component",
    "text/javascript",
    "application/x-javascript",
    "application/javascript",
    "application/json",
    "application/manifest+json",
    "application/vnd.api+json",
    "application/xml",
    "application/xhtml+xml",
    "application/rss+xml",
    "application/atom+xml",
    "application/vnd.ms-fontobject",
    "application/x-font-ttf",
    "application/x-font-opentype",
    "application/x-font-truetype",
    "image/svg+xml",
    "image/x-icon",
    "image/vnd.microsoft.icon",
    "font/ttf",
    "font/eot",
    "font/otf",
    "font/opentype",
];
