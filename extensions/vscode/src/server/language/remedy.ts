import { parseSource, printHtml } from "@niarada/remedy-template";
import type { LanguagePlugin } from "@volar/language-core";
import type { ServicePlugin } from "@volar/language-service";
import { ScriptKind } from "typescript";
import { TextDocument, getLanguageService as getHtmlLanguageService } from "vscode-html-languageservice";
import { RemedyVirtualCode } from "../virtual-code/remedy";
const htmlLanguageService = getHtmlLanguageService();

export const remedyLanguage: LanguagePlugin = {
    createVirtualCode(id, languageId, snapshot) {
        if (languageId === "remedy") {
            return new RemedyVirtualCode(id, snapshot);
        }
    },
    updateVirtualCode(_id, code: RemedyVirtualCode, snapshot) {
        if (code.languageId === "remedy") {
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

export const remedyService: ServicePlugin = {
    name: "remedy",
    create(context) {
        return {
            // provideHover: () => {
            //     console.log("provideHover");
            //     return null;
            // },
            // provideDocumentSymbols: () => {
            //     console.log("provideDocumentSymbols");
            //     return [];
            // },
            // provideDocumentHighlights: () => {
            //     console.log("provideDocumentHighlights");
            //     return [];
            // },
            // provideLinkedEditingRanges: () => {
            //     console.log("provideLinkedEditingRanges");
            //     return null;
            // },
            // provideDefinition: () => {
            //     console.log("provideDefinition");
            //     return [];
            // },
            // provideTypeDefinition: () => {
            //     console.log("provideTypeDefinition");
            //     return [];
            // },
            // provideImplementation: () => {
            //     console.log("provideImplementation");
            //     return [];
            // },
            // provideCodeLenses: () => {
            //     console.log("provideCodeLenses");
            //     return [];
            // },
            // provideCodeActions: () => {
            //     console.log("provideCodeActions");
            //     return [];
            // },
            provideDocumentFormattingEdits: (document, range, options, embeddedCodeContext, token) => {
                const { ast, errors } = parseSource(document.getText(range));
                if (errors.length) {
                    return [];
                }
                const newText = printHtml(ast, { expandSelfClosing: false });
                const newDocument = TextDocument.create(document.uri, document.languageId, document.version, newText);
                const newEndPosition = newDocument.positionAt(newText.length - 1);
                const newRange = {
                    start: { line: 0, character: 0 },
                    end: { line: newEndPosition.line, character: newEndPosition.character },
                };
                return htmlLanguageService.format(newDocument, newRange, options);
            },
            // provideOnTypeFormattingEdits: () => {
            //     console.log("provideOnTypeFormattingEdits");
            //     return [];
            // },
            // provideDocumentLinks: () => {
            //     console.log("provideDocumentLinks");
            //     return [];
            // },
            // provideCompletionItems: () => {
            //     console.log("provideCompletionItems");
            //     return null;
            // },
            // provideDocumentColors: () => {
            //     console.log("provideDocumentColors");
            //     return [];
            // },
            // provideColorPresentations: () => {
            //     console.log("provideColorPresentations");
            //     return [];
            // },
            // provideFoldingRanges: () => {
            //     console.log("provideFoldingRanges");
            //     return [];
            // },
            // provideSignatureHelp: () => {
            //     console.log("provideSignatureHelp");
            //     return null;
            // },
            // provideRenameRange: () => {
            //     console.log("provideRenameRanges");
            //     return null;
            // },
            // provideRenameEdits: () => {
            //     console.log("provideRenameEdits");
            //     return null;
            // },
            // provideReferences: () => {
            //     console.log("provideReferences");
            //     return [];
            // },
            // provideSelectionRanges: () => {
            //     console.log("provideSelectionRanges");
            //     return [];
            // },
            // provideInlayHints: () => {
            //     console.log("provideInlayHints");
            //     return [];
            // },
            // provideCallHierarchyItems: () => {
            //     console.log("provideCallHierarchyItems");
            //     return [];
            // },
            // provideCallHierarchyIncomingCalls: () => {
            //     console.log("provideCallHierarchyIncomingCalls");
            //     return [];
            // },
            // provideCallHierarchyOutgoingCalls: () => {
            //     console.log("provideCallHierarchyOutgoingCalls");
            //     return [];
            // },
            // provideDocumentSemanticTokens: () => {
            //     console.log("provideDocumentSemanticTokens");
            //     return null;
            // },
            // provideWorkspaceSymbols: () => {
            //     console.log("provideWorkspaceSymbols");
            //     return [];
            // },
            // provideDiagnostics: () => {
            //     console.log("provideDiagnostics");
            //     return [];
            // },
            // provideSemanticDiagnostics: () => {
            //     console.log("provideSemanticDiagnostics");
            //     return [];
            // },
            // provideFileReferences: () => {
            //     console.log("provideFileReferences");
            //     return [];
            // },
            // provideReferencesCodeLensRanges: () => {
            //     console.log("provideReferencesCodeLensRanges");
            //     return [];
            // },
            // provideAutoInsertionEdit: () => {
            //     console.log("provideAutoInsertionEdit");
            //     return null;
            // },
            // provideFileRenameEdits: () => {
            //     console.log("provideFileRenameEdits");
            //     return null;
            // },
            // provideDocumentDropEdits: () => {
            //     console.log("provideDocumentDropEdits");
            //     return null;
            // },
            // resolveCodeLens: () => {
            //     console.log("resolveCodeLens");
            //     return null;
            // },
            // resolveCodeAction: () => {
            //     console.log("resolveCodeAction");
            //     return null;
            // },
            // resolveCompletionItem: () => {
            //     console.log("resolveCompletionItem");
            //     return null;
            // },
            // resolveDocumentLink: () => {
            //     console.log("resolveDocumentLink");
            //     return null;
            // },
            // resolveInlayHint: () => {
            //     console.log("resolveInlayHint");
            //     return null;
            // },
            // resolveEmbeddedCodeFormattingOptions: () => {
            //     console.log("resolveEmbeddedCodeFormattingOptions");
            //     return null;
            // },
            // dispose: () => {
            //     console.log("dispose");
            // },
        };
    },
};
