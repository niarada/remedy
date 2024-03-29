import { Scope } from "@niarada/remedy-template";
import { Context } from "../../runtime/src/context";

export type AttributeType = string | boolean | number;
export type AttributeTypeString = "string" | "boolean" | "number";
export type AttributeTypes = Record<string, AttributeTypeString>;
export type Attributes = Record<string, AttributeType>;

/**
 * An imported source module.
 */
export interface Artifact {
    attributes: AttributeTypes;
    action($context: Context, ...rest: AttributeType[]): Promise<Scope>;
    template: string;
}
