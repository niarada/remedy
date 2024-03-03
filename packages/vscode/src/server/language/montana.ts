import { LanguagePlugin } from "@volar/language-core";
import { ServicePlugin } from "@volar/language-service";
import { ScriptKind } from "typescript";
import { MontanaVirtualCode } from "../virtual-code/montana";

export const montanaLanguage: LanguagePlugin = {
    createVirtualCode(id, languageId, snapshot) {
        if (languageId === "montana") {
            return new MontanaVirtualCode(id, snapshot);
        }
    },
    updateVirtualCode(_id, code: MontanaVirtualCode, snapshot) {
        if (code.languageId === "montana") {
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
            for (const code of rootCode.embeddedCodes[0].embeddedCodes) {
                if (code.languageId === "typescript") {
                    return {
                        code,
                        extension: ".ts",
                        scriptKind: ScriptKind.TS,
                    };
                }
            }
        },
    },
};

export const montanaService: ServicePlugin = {
    create(context) {
        return {};
    },
};
