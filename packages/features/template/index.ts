import { RemedyFeatureFactory } from "@niarada/remedy";
import { TemplateSource } from "./source";

export default function (): RemedyFeatureFactory {
    return () => ({
        name: "template",
        extension: "rx",
        source(text: string, path?: string) {
            return new TemplateSource(text, path);
        },
    });
}
