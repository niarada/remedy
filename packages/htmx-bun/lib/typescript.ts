import * as ts from "typescript";

export function formatTypeScript(code: string): string {
    const source = ts.createSourceFile("", code, ts.ScriptTarget.Latest, true);
    const printer = ts.createPrinter();
    return printer.printFile(source);
}
