import { deflateSync, gzipSync } from "bun";
import zlib from "node:zlib";

class CompressionStream {
    readable: ReadableStream;
    writable: WritableStream;

    constructor(format: "gzip" | "deflate") {
        const handle =
            format === "deflate"
                ? zlib.createDeflate()
                : format === "gzip"
                  ? zlib.createGzip()
                  : zlib.createDeflateRaw();

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
    const format =
        (request.headers.get("Accept-Encoding")?.includes("gzip") && "gzip") ||
        (request.headers.get("Accept-Encoding")?.includes("deflate") && "deflate");
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
