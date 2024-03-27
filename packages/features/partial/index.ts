import { RemedyFeatureFactory } from "@niarada/remedy";
import { PartialSource } from "./source";

export default function (): RemedyFeatureFactory {
    return () => ({
        name: "partial",
        extension: "part",
        source(text: string, path?: string) {
            return new PartialSource(text, path);
        },
    });
}
