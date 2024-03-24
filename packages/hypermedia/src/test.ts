export { makeTemporaryDirectory } from "@niarada/remedy-common";
import { AttributeTypes, Attributes } from "./artifact";
import { Context, coerceAttributes, definedAttributeValues } from "./context";

class FakeContext {
    #attributes: Attributes;

    constructor(attributes: Attributes = {}) {
        this.#attributes = attributes;
    }

    withAttributes(attributes: Attributes): Context {
        return fakeContext(attributes);
    }

    coerceAttributes(types: AttributeTypes = {}) {
        this.#attributes = coerceAttributes(this.#attributes, types);
    }

    definedAttributeValues(types: AttributeTypes) {
        return definedAttributeValues(this.#attributes, types);
    }

    get attributes() {
        return this.#attributes;
    }
}

export function fakeContext(attributes: Attributes = {}) {
    const context = new FakeContext(attributes);
    return context as unknown as Context;
}
