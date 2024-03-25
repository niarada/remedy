import type { CodeMapping, VirtualCode } from "@volar/language-core";
import type { IScriptSnapshot } from "typescript";

import { htmlStartIndex } from "@niarada/remedy-template";
import { RemedyCodeVirtualCode } from "./remedy-code";
import { SimpleVirtualCode } from "./simple";

export class RemedyVirtualCode implements VirtualCode {
    languageId = "remedy";
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
        const htmlIndex = htmlStartIndex(text);
        if (htmlIndex > 0) {
            this.embeddedCodes.push(
                new RemedyCodeVirtualCode("code", text),
                new SimpleVirtualCode("code-formatting", "typescript", text.slice(0, htmlIndex), 0, {
                    completion: false,
                    format: true,
                    navigation: false,
                    semantic: false,
                    structure: false,
                    verification: false,
                }),
            );
        }
        this.embeddedCodes.push(
            new SimpleVirtualCode("template", "html", text.slice(htmlIndex), htmlIndex, {
                completion: true,
                format: false,
                navigation: true,
                semantic: true,
                structure: true,
                verification: true,
            }),
            new SimpleVirtualCode("template-formatting", "remedy-template", text.slice(htmlIndex), htmlIndex, {
                completion: false,
                format: true,
                navigation: false,
                semantic: false,
                structure: false,
                verification: false,
            }),
        );
    }
}
