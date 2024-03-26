import { RemedyFeatureFactory } from "@niarada/remedy";
import { MarkdownSource } from "./source";

export default function (): RemedyFeatureFactory {
    return (config) => ({
        name: "markdown",
        extension: "md",
        source(text: string, path: string) {
            return new MarkdownSource(text, path);
        },
    });
}
