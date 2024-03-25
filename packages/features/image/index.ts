import {
    RemedyFeatureFactory,
    createHtmlElementAttributesFromObject,
    expressFlattenedAttributes,
} from "@niarada/remedy";
import { info as imageInfo } from "fastimage";
import { existsSync } from "node:fs";
import sharp from "sharp";

export const factory: RemedyFeatureFactory = (config) => {
    return {
        async intercede(context) {
            if (!context.request.headers.get("Accept")?.startsWith("image")) {
                return;
            }
            if (!(context.form.width || context.form.height)) {
                return;
            }
            const path = `${config.public}${context.url.pathname}`;
            if (!existsSync(path)) {
                return;
            }
            const { width, height } = await imageInfo(path);
            scaleDimensions(context.form, width, height);
            if (String(width) === context.form.width) {
                return;
            }
            return new Response(sharp(path).resize(Number(context.form.width), Number(context.form.height)), {
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
                const path = `${config.public}${attrs.src}`;
                if (!existsSync(path)) {
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
};

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
