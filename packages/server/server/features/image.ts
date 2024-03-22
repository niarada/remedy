import photon, { PhotonImage } from "@silvia-odwyer/photon-node";
import { info as imageInfo } from "fastimage";
import * as fs from "node:fs";
import { expressFlattenedAttributes } from "~/hypermedia/expressor";
import { createHtmlElementAttributesFromObject } from "~/hypermedia/template";
import { info } from "~/lib/log";
import { ServerFeature } from ".";
import { ServerOptions } from "../options";

export default function (options: ServerOptions): ServerFeature {
    return {
        name: "image",
        async intercede(context) {
            if (!context.request.headers.get("Accept")?.startsWith("image")) {
                return;
            }
            if (!(context.form.width || context.form.height)) {
                return;
            }
            const time = Bun.nanoseconds();
            const path = `${options.base}${context.url.pathname}`;
            if (!fs.existsSync(path)) {
                return;
            }
            const { width, height } = await imageInfo(path);
            scaleDimensions(context.form, width, height);
            if (String(width) === context.form.width) {
                return;
            }
            const data = await Bun.file(path).arrayBuffer();
            let image = PhotonImage.new_from_byteslice(new Uint8Array(data));
            image = photon.resize(image, Number(context.form.width), Number(context.form.height), 5);
            const bytes = image.get_bytes();
            info(
                "image",
                `'${context.url.pathname}' optimized in ${Math.round((Bun.nanoseconds() - time) / 1000000)}ms`,
            );
            return new Response(bytes, {
                headers: {
                    "Content-Type": "image/jpg",
                },
            });
        },

        async transform(node) {
            if (node.type === "element" && node.tag === "img") {
                const attrs = expressFlattenedAttributes(node);
                if (!attrs.src || !attrs.src.startsWith("/")) {
                    return node;
                }
                const path = `${options.base}${attrs.src}`;
                if (!fs.existsSync(path)) {
                    return node;
                }
                const { width, height } = await imageInfo(path);
                scaleDimensions(attrs, width, height);
                attrs.decoding = "async";
                attrs.loading = "lazy";
                if (Object.hasOwn(attrs, "optimized")) {
                    attrs.src = `${attrs.src}?width=${attrs.width}&height=${attrs.height}`;
                }
                node.attrs = createHtmlElementAttributesFromObject(attrs);
            }
            return node;
        },
    };
}

function scaleDimensions(info: Record<string, string | number>, originalWidth: number, originalHeight: number) {
    if (info.width && info.height) {
        return;
    }
    if (info.width) {
        const width = Number(info.width);
        info.height = String(Math.round(originalHeight * (width / originalWidth)));
    } else if (info.height) {
        const height = Number(info.height);
        info.width = String(Math.round(originalWidth * (height / originalHeight)));
    } else {
        info.width = String(originalWidth);
        info.height = String(originalHeight);
    }
}
