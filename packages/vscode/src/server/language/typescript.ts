import { CodeMapping, VirtualCode } from "@volar/language-core";
import { IScriptSnapshot } from "typescript";

export class TypeScriptVirtualCode implements VirtualCode {
    id: string;
    languageId = "typescript";
    snapshot: IScriptSnapshot;
    mappings: CodeMapping[];
    embeddedCodes = [];

    constructor(parentId: string, offset: number, text: string) {
        this.id = `${parentId}:typescript`;
        this.snapshot = {
            getText: (start, end) => text.slice(start, end),
            getLength: () => text.length,
            getChangeRange: () => undefined,
        };
        this.mappings = [
            {
                sourceOffsets: [offset],
                generatedOffsets: [0],
                lengths: [text.length],
                data: {
                    completion: true,
                    format: false,
                    navigation: true,
                    semantic: true,
                    structure: true,
                    verification: true,
                },
            },
        ];
    }
}
