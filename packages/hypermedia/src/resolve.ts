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
 * @param validExtensions - File extensions to consider.
 * @returns The resolved path, amended tag, and resolved variables.
 */
export function resolveTag(tag: string, basePath: string, validExtensions: string[]): ResolvedTagInfo {
    validExtensions = validExtensions.map((x) => (x[0] === "." ? x : `.${x}`));
    const segments = tag.split("-");
    const { path: resolvedPath, resolvedVariables } = resolvePath(segments, basePath, {}, validExtensions);
    return {
        path: resolvedPath,
        amendedTag:
            resolvedPath && dropExtension(resolvedPath.replace(new RegExp(`^${basePath}/`), "")).replace(/\//g, "-"),
        resolvedVariables,
    };
}

/**
 * Recursively resolves the path segments to find the matching directory path, amended tag, and resolved variables.
 *
 * @param segments - The remaining path segments to resolve.
 * @param currentPath - The current path being resolved.
 * @param resolvedVariables - The currently resolved variables.
 * @param validExtensions - File extensions to consider.
 */
function resolvePath(
    segments: string[],
    currentPath: string,
    resolvedVariables: Record<string, string>,
    validExtensions: string[],
): ResolvedPathInfo {
    const currentPathWithoutExtension = dropExtension(currentPath);

    if (!fs.existsSync(currentPathWithoutExtension) || segments.length === 0) {
        if (segments.length > 0) {
            return { path: undefined, resolvedVariables };
        }

        return {
            path: currentPath,
            resolvedVariables,
        };
    }

    currentPath = currentPathWithoutExtension;
    const [first, ...rest] = segments;
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });

    /**
     * Find a file with the same name as the first segment and a valid extension.
     */
    for (const entry of entries) {
        if (entry.isFile()) {
            const parsed = path.parse(entry.name);
            if (!validExtensions.includes(parsed.ext)) {
                continue;
            }
            if (parsed.name === first) {
                return resolvePath(rest, path.join(currentPath, entry.name), resolvedVariables, validExtensions);
            }
        }
    }

    /**
     * Otherwise, find a directory with the same name as the first segment.
     */
    for (const entry of entries) {
        if (entry.isDirectory()) {
            const parsed = path.parse(entry.name);
            if (parsed.name === first) {
                return resolvePath(
                    rest.length === 0 ? ["index"] : rest,
                    path.join(currentPath, entry.name),
                    resolvedVariables,
                    validExtensions,
                );
            }
        }
    }

    /**
     * Otherwise, find a variable file with a valid extension.
     */
    for (const entry of entries) {
        if (entry.isFile()) {
            const parsed = path.parse(entry.name);
            if (!validExtensions.includes(parsed.ext)) {
                continue;
            }
            if (parsed.name.startsWith("[") && parsed.name.endsWith("]")) {
                const variable = parsed.name.slice(1, -1);
                return resolvePath(
                    rest,
                    path.join(currentPath, entry.name),
                    {
                        ...resolvedVariables,
                        [variable]: first,
                    },
                    validExtensions,
                );
            }
        }
    }

    /**
     * Otherwise, find a variable directory
     */
    for (const entry of entries) {
        if (entry.isDirectory()) {
            const parsed = path.parse(entry.name);
            if (parsed.name.startsWith("[") && parsed.name.endsWith("]")) {
                const variable = parsed.name.slice(1, -1);
                return resolvePath(
                    rest.length === 0 ? ["index"] : rest,
                    path.join(currentPath, entry.name),
                    {
                        ...resolvedVariables,
                        [variable]: first,
                    },
                    validExtensions,
                );
            }
        }
    }
    return { path: undefined, resolvedVariables: {} };
}

function dropExtension(filePath: string): string {
    return path.join(path.dirname(filePath), path.basename(filePath, path.extname(filePath)));
}
