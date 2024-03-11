import type { CodeMapping, VirtualCode } from "@volar/language-core";
import type { IScriptSnapshot } from "typescript";

import { PartialScriptVirtualCode } from "./partial-script";
import { SimpleVirtualCode } from "./simple";

export class PartialVirtualCode implements VirtualCode {
    languageId = "partial";
    snapshot: IScriptSnapshot;
    mappings: CodeMapping[];
    embeddedCodes: VirtualCode[];

    constructor(
        public id: string,
        snapshot: IScriptSnapshot,
    ) {
        this.update(snapshot);
    }

    update(snapshot: IScriptSnapshot) {
        const text = snapshot.getText(0, snapshot.getLength());
        this.snapshot = snapshot;
        this.mappings = [
            {
                sourceOffsets: [0],
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
        this.embeddedCodes = [];
        const htmlStartIndex = text.search(/\n^<\w+/m);
        this.embeddedCodes.push(
            new PartialScriptVirtualCode("typescript", text),
            new SimpleVirtualCode(
                "html",
                "html",
                text.slice(htmlStartIndex),
                htmlStartIndex,
            ),
        );
    }
}
