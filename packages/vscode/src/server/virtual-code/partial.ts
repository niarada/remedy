import type { CodeMapping, VirtualCode } from "@volar/language-core";
import type { IScriptSnapshot } from "typescript";
// import {
//     TextDocument,
//     getLanguageService as getHtmlLanguageService,
// } from "vscode-html-languageservice";

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
        if (htmlStartIndex !== -1) {
            this.embeddedCodes.push(
                new SimpleVirtualCode(
                    "typescript",
                    "typescript",
                    text.slice(0, htmlStartIndex),
                    0,
                ),
            );
            this.embeddedCodes.push(
                new SimpleVirtualCode(
                    "html",
                    "html",
                    text.slice(htmlStartIndex),
                    htmlStartIndex,
                    // text.slice(htmlStartIndex),
                ),
            );
        } else {
            this.embeddedCodes.push(
                new SimpleVirtualCode("typescript", "typescript", text, 0),
            );
        }
        // const document = getHtmlLanguageService().parseHTMLDocument(
        //     TextDocument.create("", "html", 0, text),
        // );
        // let i = 0;
        // this.embeddedCodes.push(new SimpleVirtualCode("html", "html", 0, text));
        // for (const root of document.roots) {
        //     if (root.tag === "server" && root.startTagEnd && root.endTagStart) {
        //         this.embeddedCodes[0].embeddedCodes.push(
        //             new SimpleVirtualCode(
        //                 `server-block-${i}`,
        //                 "typescript",
        //                 root.startTagEnd,
        //                 snapshot.getText(root.startTagEnd, root.endTagStart),
        //             ),
        //         );
        //         i++;
        //     }
        // }
    }
}
