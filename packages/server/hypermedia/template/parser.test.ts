import { describe, expect, it } from "bun:test";
import { parse } from "./parser";

describe("parser", () => {
    it("should parse an empty document", () => {
        const { errors } = parse("");
        expect(errors).toEqual([]);
    });
});
