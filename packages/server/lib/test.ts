import { afterAll } from "bun:test";
import { mkdtempSync, rmdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { AttributeTypes, Attributes } from "~/hypermedia/artifact";
import { Context, coerceAttributes, definedAttributeValues } from "~/server/context";

export function makeTemporaryDirectory() {
    const dir = mkdtempSync(`${tmpdir()}/remedy-`);
    afterAll(() => {
        rmdirSync(dir, { recursive: true });
    });
    return dir;
}

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
