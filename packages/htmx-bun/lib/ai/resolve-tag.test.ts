import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import * as fs from "node:fs";
import * as path from "node:path";
import { makeTemporaryDirectory } from "~/lib/test";
import { resolveTag } from "./resolve-tag";

describe("resolveTag", () => {
    const basePath = makeTemporaryDirectory();

    beforeAll(() => {
        // Create test directory structure
        fs.mkdirSync(basePath, { recursive: true });
        fs.mkdirSync(path.join(basePath, "foo"), { recursive: true });
        fs.mkdirSync(path.join(basePath, "foo", "1"), { recursive: true });
        fs.mkdirSync(path.join(basePath, "foo", "1", "bar"), {
            recursive: true,
        });
        fs.mkdirSync(path.join(basePath, "foo", "[id]"), { recursive: true });
        fs.mkdirSync(path.join(basePath, "foo", "[id]", "bar"), {
            recursive: true,
        });
        fs.mkdirSync(path.join(basePath, "foo", "[id]", "[slug]"), {
            recursive: true,
        });
        fs.mkdirSync(path.join(basePath, "foo", "[id]", "[slug]", "bar"), {
            recursive: true,
        });
    });

    afterAll(() => {
        // Clean up test directory
        fs.rmSync(basePath, { recursive: true, force: true });
    });

    it("should resolve tag to existing directory path and return resolved variables", () => {
        const tag = "foo-1-baz-bar";
        const expectedPath = path.join(
            basePath,
            "foo",
            "[id]",
            "[slug]",
            "bar",
        );
        const expectedAmendedTag = "foo-[id]-[slug]-bar";
        const expectedResolvedVariables = { id: "1", slug: "baz" };
        const {
            path: resolvedPath,
            amendedTag,
            resolvedVariables,
        } = resolveTag(tag, basePath);
        expect(resolvedPath).toBe(expectedPath);
        expect(amendedTag).toBe(expectedAmendedTag);
        expect(resolvedVariables).toEqual(expectedResolvedVariables);
    });

    it("should resolve tag to existing directory path", () => {
        const tag = "foo-1-bar";
        const expectedPath = path.join(basePath, "foo", "1", "bar");
        const expectedAmendedTag = "foo-1-bar";
        const { path: resolvedPath, amendedTag } = resolveTag(tag, basePath);
        expect(resolvedPath).toBe(expectedPath);
        expect(amendedTag).toBe(expectedAmendedTag);
    });

    it("should resolve tag with variable segments to existing directory path", () => {
        const tag = "foo-2-bar";
        const expectedPath = path.join(basePath, "foo", "[id]", "bar");
        const expectedAmendedTag = "foo-[id]-bar";
        const { path: resolvedPath, amendedTag } = resolveTag(tag, basePath);
        expect(resolvedPath).toBe(expectedPath);
        expect(amendedTag).toBe(expectedAmendedTag);
    });

    it("should resolve tag with multiple variable segments to existing directory path", () => {
        const tag = "foo-3-baz";
        const expectedPath = path.join(basePath, "foo", "[id]", "[slug]");
        const expectedAmendedTag = "foo-[id]-[slug]";
        const { path: resolvedPath, amendedTag } = resolveTag(tag, basePath);
        expect(resolvedPath).toBe(expectedPath);
        expect(amendedTag).toBe(expectedAmendedTag);
    });

    it("should return undefined for non-existing directory path", () => {
        const tag = "foo-4-qux-zab";
        const { path: resolvedPath, amendedTag } = resolveTag(tag, basePath);
        expect(resolvedPath).toBeUndefined();
        expect(amendedTag).toBeUndefined();
    });

    it("should resolve tag to non-variable path when both non-variable and variable paths exist", () => {
        const tag = "foo-1-bar";
        const expectedPath = path.join(basePath, "foo", "1", "bar");
        const expectedAmendedTag = "foo-1-bar";
        const { path: resolvedPath, amendedTag } = resolveTag(tag, basePath);
        expect(resolvedPath).toBe(expectedPath);
        expect(amendedTag).toBe(expectedAmendedTag);
    });

    it("should resolve tag to non-variable path when variable path exists at a different level", () => {
        const tag = "foo-1-baz";
        const expectedPath = path.join(basePath, "foo", "1", "baz");
        const expectedAmendedTag = "foo-1-baz";
        fs.mkdirSync(path.join(basePath, "foo", "1", "baz"), {
            recursive: true,
        });
        const { path: resolvedPath, amendedTag } = resolveTag(tag, basePath);
        expect(resolvedPath).toBe(expectedPath);
        expect(amendedTag).toBe(expectedAmendedTag);
    });

    it("should resolve tag to non-variable path when variable path exists at the same level", () => {
        const tag = "foo-2-qux";
        const expectedPath = path.join(basePath, "foo", "2", "qux");
        const expectedAmendedTag = "foo-2-qux";
        fs.mkdirSync(path.join(basePath, "foo", "2"), { recursive: true });
        fs.mkdirSync(path.join(basePath, "foo", "2", "qux"), {
            recursive: true,
        });
        const { path: resolvedPath, amendedTag } = resolveTag(tag, basePath);
        expect(resolvedPath).toBe(expectedPath);
        expect(amendedTag).toBe(expectedAmendedTag);
    });

    it("should resolve tag to existing file path and return resolved variables", () => {
        const tag = "foo-1-baz-file";
        const expectedPath = path.join(
            basePath,
            "foo",
            "[id]",
            "[slug]",
            "file.txt",
        );
        const expectedAmendedTag = "foo-[id]-[slug]-file";
        const expectedResolvedVariables = { id: "1", slug: "baz" };
        fs.writeFileSync(expectedPath, "");
        const {
            path: resolvedPath,
            amendedTag,
            resolvedVariables,
        } = resolveTag(tag, basePath);
        expect(resolvedPath).toBe(expectedPath);
        expect(amendedTag).toBe(expectedAmendedTag);
        expect(resolvedVariables).toEqual(expectedResolvedVariables);
    });

    it("should resolve tag to existing file path", () => {
        const tag = "foo-1-file";
        const expectedPath = path.join(basePath, "foo", "1", "file.txt");
        const expectedAmendedTag = "foo-1-file";
        fs.writeFileSync(expectedPath, "");
        const { path: resolvedPath, amendedTag } = resolveTag(tag, basePath);
        expect(resolvedPath).toBe(expectedPath);
        expect(amendedTag).toBe(expectedAmendedTag);
    });

    it("should resolve tag with variable segments to existing file path", () => {
        const tag = "foo-2-file";
        const expectedPath = path.join(basePath, "foo", "[id]", "file.txt");
        const expectedAmendedTag = "foo-[id]-file";
        fs.writeFileSync(expectedPath, "");
        const { path: resolvedPath, amendedTag } = resolveTag(tag, basePath);
        expect(resolvedPath).toBe(expectedPath);
        expect(amendedTag).toBe(expectedAmendedTag);
    });
});
