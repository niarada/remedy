import * as fs from "node:fs";
import * as path from "node:path";

/**
 * Represents the result of resolving a tag to a path, amended tag, and resolved variables.
 *
 * @property path - The resolved path, or undefined if not found.
 * @property amendedTag - The amended tag, or undefined if not found.
 * @property resolvedVariables - The resolved values for the variable parts.
 */
interface ResolvedTagInfo {
    path: string | undefined;
    amendedTag: string | undefined;
    resolvedVariables: Record<string, string>;
}

/**
 * Resolves a tag to a path, amended tag, and resolved variables based on the provided base path.
 *
 * @param tag - The tag to resolve.
 * @param basePath - The base path to start the resolution from.
 * @returns The resolved path, amended tag, and resolved variables.
 */
export function resolveTag(tag: string, basePath: string): ResolvedTagInfo {
    const segments = tag.split("-");
    const {
        path: resolvedPath,
        amendedTag,
        resolvedVariables,
    } = resolvePath(segments, basePath, {});
    return { path: resolvedPath, amendedTag, resolvedVariables };
}

/**
 * Recursively resolves the path segments to find the matching directory path, amended tag, and resolved variables.
 *
 * @param segments - The remaining path segments to resolve.
 * @param currentPath - The current path being resolved.
 * @param resolvedVariables - The currently resolved variables.
 */
function resolvePath(
    segments: string[],
    currentPath: string,
    resolvedVariables: Record<string, string>,
): ResolvedTagInfo {
    if (segments.length === 0) {
        return { path: currentPath, amendedTag: "", resolvedVariables };
    }

    const [first, ...rest] = segments;
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });

    // Check for non-variable directories and files first
    for (const entry of entries) {
        const nameWithoutExtension = path.parse(entry.name).name;
        const entryPath = path.join(currentPath, entry.name);

        if (entry.isDirectory() && nameWithoutExtension === first) {
            const {
                path: subPath,
                amendedTag: subAmendedTag,
                resolvedVariables: subResolvedVariables,
            } = resolvePath(rest, entryPath, resolvedVariables);
            if (subPath !== undefined) {
                return {
                    path: subPath,
                    amendedTag: subAmendedTag
                        ? `${first}-${subAmendedTag}`
                        : first,
                    resolvedVariables: subResolvedVariables,
                };
            }
        } else if (
            entry.isFile() &&
            rest.length === 0 &&
            nameWithoutExtension === first
        ) {
            return {
                path: entryPath,
                amendedTag: first,
                resolvedVariables,
            };
        }
    }

    // Check for variable directories and files
    for (const entry of entries) {
        const nameWithoutExtension = path.parse(entry.name).name;
        const entryPath = path.join(currentPath, entry.name);

        if (
            entry.isDirectory() &&
            nameWithoutExtension.startsWith("[") &&
            nameWithoutExtension.endsWith("]")
        ) {
            const variableName = nameWithoutExtension.slice(1, -1);
            const {
                path: subPath,
                amendedTag: subAmendedTag,
                resolvedVariables: subResolvedVariables,
            } = resolvePath(rest, entryPath, {
                ...resolvedVariables,
                [variableName]: first,
            });
            if (subPath !== undefined) {
                return {
                    path: subPath,
                    amendedTag: subAmendedTag
                        ? `${nameWithoutExtension}-${subAmendedTag}`
                        : nameWithoutExtension,
                    resolvedVariables: subResolvedVariables,
                };
            }
        } else if (
            entry.isFile() &&
            rest.length === 0 &&
            nameWithoutExtension.startsWith("[") &&
            nameWithoutExtension.endsWith("]")
        ) {
            const variableName = nameWithoutExtension.slice(1, -1);
            return {
                path: entryPath,
                amendedTag: nameWithoutExtension,
                resolvedVariables: {
                    ...resolvedVariables,
                    [variableName]: first,
                },
            };
        }
    }

    return { path: undefined, amendedTag: undefined, resolvedVariables: {} };
}
