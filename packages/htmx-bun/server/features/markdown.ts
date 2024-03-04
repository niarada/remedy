import rehypeStringify from "rehype-stringify";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
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
                const html = String(
                    await unified()
                        .use(remarkParse)
                        .use(remarkRehype)
                        .use(rehypeStringify)
                        .process(content),
                );
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
