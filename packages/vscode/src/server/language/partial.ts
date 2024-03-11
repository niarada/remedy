import type { LanguagePlugin } from "@volar/language-core";
import type { ServicePlugin } from "@volar/language-service";
import { ScriptKind } from "typescript";
import { PartialVirtualCode } from "../virtual-code/partial";

export const partialLanguage: LanguagePlugin = {
    createVirtualCode(id, languageId, snapshot) {
        if (languageId === "partial") {
            return new PartialVirtualCode(id, snapshot);
        }
    },
    updateVirtualCode(_id, code: PartialVirtualCode, snapshot) {
        if (code.languageId === "partial") {
            code.update(snapshot);
            return code;
        }
    },
    typescript: {
        extraFileExtensions: [
            {
                extension: "part",
                isMixedContent: true,
                scriptKind: ScriptKind.Deferred,
            },
        ],
        getScript(rootCode) {
            for (const code of rootCode.embeddedCodes) {
                if (code.languageId === "typescript") {
                    return {
                        code,
                        extension: ".ts",
                        scriptKind: ScriptKind.TS,
                    };
                }
            }
            return undefined;
        },
    },
};

export const partialService: ServicePlugin = {
    create(context) {
        return {};
    },
};
