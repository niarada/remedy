export { makeTemporaryDirectory } from "@niarada/remedy-runtime";
import { Context, coerceAttributes, definedAttributeValues } from "@niarada/remedy-runtime";
import { AttributeTypes, Attributes } from "./artifact";

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
