import rehypeStringify from "rehype-stringify";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { HtmlText, parseHtml } from "~/lib/html";
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
                return parseHtml(html).children;
            }
            return node;
        },
    };
}
