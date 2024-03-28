import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import * as fs from "node:fs";
import * as path from "node:path";
import { resolveTag } from "./resolve";
import { makeTemporaryDirectory } from "./test";

describe("resolveTag", () => {
    const basePath = makeTemporaryDirectory();

    beforeAll(() => {
        // Create the necessary file structure for testing
        fs.mkdirSync(path.join(basePath, "joy/patience/[id]"), {
            recursive: true,
        });
        fs.writeFileSync(path.join(basePath, "joy/patience/[id]/kindness.rx"), "");
        fs.mkdirSync(path.join(basePath, "joy/[virtue]/[id]"), {
            recursive: true,
        });
        fs.writeFileSync(path.join(basePath, "joy/[virtue]/[id]/kindness.rx"), "");
        fs.writeFileSync(path.join(basePath, "joy/[virtue]/[id]/[other].rx"), "");
        fs.writeFileSync(path.join(basePath, "joy.rx"), "");
        fs.mkdirSync(path.join(basePath, "love"), { recursive: true });
        fs.writeFileSync(path.join(basePath, "love/[id].rx"), "");
    });

    afterAll(() => {
        fs.rmSync(basePath, { recursive: true, force: true });
    });

    it("should resolve a tag with a fixed path and a variable path", () => {
        const tag = "joy-patience-2-kindness";
        const expected = {
            path: path.join(basePath, "joy/patience/[id]/kindness.rx"),
            amendedTag: "joy-patience-[id]-kindness",
            resolvedVariables: { id: "2" },
        };
        expect(resolveTag(tag, basePath, [".rx"])).toEqual(expected);
    });

    it("should resolve a tag with two variable paths", () => {
        const tag = "joy-peace-3-kindness";
        const expected = {
            path: path.join(basePath, "joy/[virtue]/[id]/kindness.rx"),
            amendedTag: "joy-[virtue]-[id]-kindness",
            resolvedVariables: { virtue: "peace", id: "3" },
        };
        expect(resolveTag(tag, basePath, [".rx"])).toEqual(expected);
    });

    it("should resolve a tag with three variables, last of them a file", () => {
        const tag = "joy-gentleness-3-faithfulness";
        const expected = {
            path: path.join(basePath, "joy/[virtue]/[id]/[other].rx"),
            amendedTag: "joy-[virtue]-[id]-[other]",
            resolvedVariables: {
                virtue: "gentleness",
                id: "3",
                other: "faithfulness",
            },
        };
        expect(resolveTag(tag, basePath, [".rx"])).toEqual(expected);
    });

    it("should resolve a file over a directory", () => {
        const tag = "joy";
        const expected = {
            path: path.join(basePath, "joy.rx"),
            amendedTag: "joy",
            resolvedVariables: {},
        };
        expect(resolveTag(tag, basePath, [".rx"])).toEqual(expected);
    });

    it("should return undefined for a path one segment longer than an existing path that doesn't exist", () => {
        const tag = "love-3-goodness";
        const expected = {
            path: undefined,
            amendedTag: undefined,
            resolvedVariables: { id: "3" },
        };
        expect(resolveTag(tag, basePath, [".rx"])).toEqual(expected);
    });

    it("should return when variable file on end", () => {
        const tag = "love-3";
        const expected = {
            path: path.join(basePath, "/love/[id].rx"),
            amendedTag: "love-[id]",
            resolvedVariables: { id: "3" },
        };
        expect(resolveTag(tag, basePath, [".rx"])).toEqual(expected);
    });

    it("should return undefined path and amendedTag if tag does not match any file", () => {
        const tag = "nonexistent-tag";
        const expected = {
            path: undefined,
            amendedTag: undefined,
            resolvedVariables: {},
        };
        expect(resolveTag(tag, basePath, [".rx"])).toEqual(expected);
    });
});
