import markdown from "markdown-it";
import { HtmlElement, HtmlText, createHtmlElement } from "~/partial/ast";
import { parsePartial } from "~/partial/parser";
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
                const html = markdown().render(content);
                const cls =
                    node.attrs.find((attr) => attr.name === "class")?.value ??
                    "";
                return createHtmlElement(
                    node.parent,
                    "article",
                    { class: `prose ${cls}` },
                    ...(parsePartial(html).children as (
                        | HtmlText
                        | HtmlElement
                    )[]),
                );
            }
            return node;
        },
    };
}
