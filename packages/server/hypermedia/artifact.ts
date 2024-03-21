import { Context } from "~/server/context";
import { Scope } from "./template";

export type AttributeType = string | boolean | number;
export type AttributeTypeString = "string" | "boolean" | "number";
export type AttributeTypes = Record<string, AttributeTypeString>;
export type Attributes = Record<string, AttributeType>;
export type ArtifactKind = "partial" | "markdown";

/**
 * An imported source module.
 */
export interface Artifact {
    kind: ArtifactKind;
    attributes: AttributeTypes;
    action($context: Context, ...rest: AttributeType[]): Promise<Scope>;
    template: string;
    script: string;
}
