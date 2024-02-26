import { CodeMapping, VirtualCode } from "@volar/language-core";
import { IScriptSnapshot } from "typescript";

export class SimpleVirtualCode implements VirtualCode {
    snapshot: IScriptSnapshot;
    mappings: CodeMapping[];
    embeddedCodes = [];

    constructor(
        public id: string,
        public languageId: string,
        offset: number,
        text: string,
    ) {
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
