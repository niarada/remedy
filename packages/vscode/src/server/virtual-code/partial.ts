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
                    format: true,
                    navigation: true,
                    semantic: true,
                    structure: true,
                    verification: true,
                },
            },
        ];
        this.embeddedCodes = [];
        const htmlStartIndex = text[0] === "<" ? 0 : text.search(/^<\w+/m);
        if (htmlStartIndex > 0) {
            this.embeddedCodes.push(
                new PartialScriptVirtualCode("typescript0", text),
                new SimpleVirtualCode(
                    "typescript1",
                    "typescript",
                    text.slice(0, htmlStartIndex),
                    0,
                    {
                        completion: false,
                        format: true,
                        navigation: false,
                        semantic: false,
                        structure: false,
                        verification: false,
                    },
                ),
            );
        }
        this.embeddedCodes.push(
            new SimpleVirtualCode(
                "html",
                "html",
                text.slice(htmlStartIndex),
                htmlStartIndex - 1,
            ),
        );
    }
}
