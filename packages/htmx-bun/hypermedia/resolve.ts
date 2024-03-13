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

interface ResolvedPathInfo {
    path: string | undefined;
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
    const { path: resolvedPath, resolvedVariables } = resolvePath(
        segments,
        basePath,
        {},
    );
    return {
        path: resolvedPath,
        amendedTag:
            resolvedPath &&
            dropExtension(
                resolvedPath.replace(new RegExp(`^${basePath}/`), ""),
            ).replace(/\//g, "-"),
        resolvedVariables,
    };
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
): ResolvedPathInfo {
    const currentPathWithoutExtension = dropExtension(currentPath);

    if (!fs.existsSync(currentPathWithoutExtension) || segments.length === 0) {
        return {
            path: currentPath,
            resolvedVariables,
        };
    }

    currentPath = currentPathWithoutExtension;

    const [first, ...rest] = segments;

    const entries = fs.readdirSync(currentPath, { withFileTypes: true });

    for (const entry of entries) {
        const nameWithoutExtension = path.parse(entry.name).name;
        const entryPath = path.join(currentPath, entry.name);

        if (entry.isFile() && nameWithoutExtension === first) {
            return resolvePath(rest, entryPath, resolvedVariables);
        }
    }

    for (const entry of entries) {
        const name = path.parse(entry.name).name;
        const entryPath = path.join(currentPath, entry.name);

        if (entry.isDirectory() && name === first) {
            return resolvePath(rest, entryPath, resolvedVariables);
        }
    }

    for (const entry of entries) {
        const nameWithoutExtension = path.parse(entry.name).name;
        const entryPath = path.join(currentPath, entry.name);

        if (
            entry.isFile() &&
            nameWithoutExtension.startsWith("[") &&
            nameWithoutExtension.endsWith("]")
        ) {
            const variableName = nameWithoutExtension.slice(1, -1);
            return resolvePath(rest, entryPath, {
                ...resolvedVariables,
                [variableName]: first,
            });
        }
    }

    for (const entry of entries) {
        const name = path.parse(entry.name).name;
        const entryPath = path.join(currentPath, entry.name);

        if (entry.isDirectory() && name.startsWith("[") && name.endsWith("]")) {
            const variableName = name.slice(1, -1);
            return resolvePath(rest, entryPath, {
                ...resolvedVariables,
                [variableName]: first,
            });
        }
    }
    return { path: undefined, resolvedVariables: {} };
}

function dropExtension(filePath: string): string {
    return path.join(
        path.dirname(filePath),
        path.basename(filePath, path.extname(filePath)),
    );
}
