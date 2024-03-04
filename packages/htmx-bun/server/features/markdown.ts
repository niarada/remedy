import markdown from "markdown-it";
import {
    HtmlElement,
    HtmlText,
    attributesToObject,
    createHtmlElement,
    parseHtml,
} from "~/lib/html";
import { ServerFeature } from ".";

export default function (): ServerFeature {
    return {
        name: "markdown",
        async transform(node) {
            if (node.type === "element" && node.tag === "markdown") {
                const content =
                    (
                        node.children.find((child) => child.type === "text") as
                            | HtmlText
                            | undefined
                    )?.content ?? "";
                if (!content) {
                    return node;
                }
                const md = markdown();
                // TODO: integrate https://shiki.style/
                const html = markdown().render(content);
                const attrs = attributesToObject(node.attrs);
                return createHtmlElement(
                    node.parent,
                    "article",
                    { class: `prose ${attrs.class ?? ""}` },
                    ...(parseHtml(html).children as (HtmlText | HtmlElement)[]),
                );
            }
            return node;
        },
    };
}
