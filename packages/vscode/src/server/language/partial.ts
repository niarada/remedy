import type { LanguagePlugin } from "@volar/language-core";
import type { ServicePlugin } from "@volar/language-service";
import * as path from "node:path";
import * as ts from "typescript";
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
        // getExtraScripts(filename, rootCode) {
        //     console.log("EXTRA", filename);
        //     const text = "const Context = {};";
        //     return [
        //         {
        //             fileName: "foo",
        //             code: new SimpleVirtualCode("foo", "typescript", text, 0),
        //             extension: ".ts",
        //             scriptKind: ScriptKind.TS,
        //         },
        //     ];
        // },
        resolveLanguageServiceHost(host) {
            return {
                ...host,
                getScriptFileNames() {
                    const dir = ts.sys.resolvePath(
                        path.resolve(__dirname, "../.."),
                    );
                    const fileNames = host.getScriptFileNames();
                    const addedFileNames = [
                        ts.sys.resolvePath(path.resolve(dir, "global.d.ts")),
                    ];
                    return [...fileNames, ...addedFileNames];
                },
            };
        },
    },
};

export const partialService: ServicePlugin = {
    create(context) {
        return {};
    },
};
