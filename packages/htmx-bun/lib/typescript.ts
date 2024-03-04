import { format } from "prettier";

export async function formatTypeScript(code: string): Promise<string> {
    return format(code, {
        parser: "typescript",
        semi: true,
        singleQuote: false,
        trailingComma: "all",
        arrowParens: "always",
    });
}
