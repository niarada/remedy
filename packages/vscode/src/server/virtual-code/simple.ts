import type {
    CodeInformation,
    CodeMapping,
    VirtualCode,
} from "@volar/language-core";
import type { IScriptSnapshot } from "typescript";

export class SimpleVirtualCode implements VirtualCode {
    snapshot: IScriptSnapshot;
    mappings: CodeMapping[];
    embeddedCodes = [];

    constructor(
        public id: string,
        public languageId: string,
        text: string,
        offset: number,
        data: CodeInformation = {
            completion: true,
            format: true,
            navigation: true,
            semantic: true,
            structure: true,
            verification: true,
        },
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
                data,
            },
        ];
    }
}
