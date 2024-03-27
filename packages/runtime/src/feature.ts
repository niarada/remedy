import { Source } from "@niarada/remedy-hypermedia";
import { HtmlSimpleAsyncTransformVisitor, HtmlSimpleTransformVisitor } from "@niarada/remedy-template";
import { RemedyConfig } from "./config";
import { Context } from "./context";

export type RemedyFeatureFactory = (config: Required<RemedyConfig>) => Promise<RemedyFeature> | RemedyFeature;

export interface RemedyFeature {
    name: string;
    extension?: string;
    source?: (text: string, path?: string) => Source;
    intercede?: (context: Context) => Promise<void> | void;
    transform?: HtmlSimpleTransformVisitor | HtmlSimpleAsyncTransformVisitor;
    conclude?: (context: Context) => Promise<void> | void;
}
