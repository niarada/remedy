import { HtmlSimpleAsyncTransformVisitor, HtmlSimpleTransformVisitor } from "@niarada/remedy-template";
import { RemedyConfig } from "./config";
import { Context } from "./context";

export type RemedyFeatureFactory = (config: Required<RemedyConfig>) => Promise<RemedyFeature> | RemedyFeature;

export interface RemedyFeature {
    intercede?: (context: Context) => Promise<Response | undefined> | Response | undefined;
    transform?: HtmlSimpleTransformVisitor | HtmlSimpleAsyncTransformVisitor;
}
