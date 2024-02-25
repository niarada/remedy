import {
    CodeMapping,
    LanguagePlugin,
    VirtualCode,
    forEachEmbeddedCode,
} from "@volar/language-core";
import { Diagnostic, DiagnosticSeverity } from "@volar/language-server/node";
import { ServicePlugin } from "@volar/language-service";
import { IScriptSnapshot, ScriptKind } from "typescript";
import { HtmlVirtualCode } from "./html";
import { TypeScriptVirtualCode } from "./typescript";

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
                extension: "mt",
                isMixedContent: true,
                scriptKind: ScriptKind.Deferred,
            },
        ],
        getScript(rootCode) {
            for (const code of forEachEmbeddedCode(rootCode)) {
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

const dividerExpression = /\s*\n---\s*/m;

class MontanaVirtualCode implements VirtualCode {
    languageId = "montana";
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
        const divider = text.match(dividerExpression);
        if (!divider) {
            return;
        }
        const typescript = {
            start: 0,
            end: divider.index,
        };
        const html = {
            start: divider.index + divider[0].length,
            end: text.length,
        };
        this.embeddedCodes.push(
            new TypeScriptVirtualCode(
                this.id,
                typescript.start,
                text.slice(typescript.start, typescript.end),
            ),
            new HtmlVirtualCode(
                this.id,
                html.start,
                text.slice(html.start, html.end),
            ),
        );
    }
}

export const montanaService: ServicePlugin = {
    triggerCharacters: ["-"],
    create(context) {
        return {
            name: "montana",
            provideDiagnostics(document) {
                const [code] = context.documents.getVirtualCodeByUri(
                    document.uri,
                );
                if (code.languageId === "montana") {
                    const diagnostics = [];
                    const text = document.getText();
                    const lines = text.split("\n");

                    if (!dividerExpression.test(text)) {
                        const diagnostic: Diagnostic = {
                            range: {
                                start: {
                                    line: lines.length - 1,
                                    character: 0,
                                },
                                end: {
                                    line: lines.length - 1,
                                    character:
                                        lines[lines.length - 1].length - 1,
                                },
                            },
                            message:
                                "Montana files must include a '---' separator beginning a line and by itself.",
                            severity: DiagnosticSeverity.Error,
                        };
                        diagnostics.push(diagnostic);
                    }
                    return diagnostics;
                }
            },
        };
    },
};

// export interface ServicePlugin {
//     name?: string;
//     triggerCharacters?: string[];
//     signatureHelpTriggerCharacters?: string[];
//     signatureHelpRetriggerCharacters?: string[];
//     autoFormatTriggerCharacters?: string[];
//     create(context: ServiceContext): ServicePluginInstance;
// }

// export interface ServicePluginInstance<P = any> {
//     provide?: P;
//     isAdditionalCompletion?: boolean;
//     provideHover?(document: TextDocument, position: vscode.Position, token: vscode.CancellationToken): NullableResult<vscode.Hover>;
//     provideDocumentSymbols?(document: TextDocument, token: vscode.CancellationToken): NullableResult<vscode.DocumentSymbol[]>;
//     provideDocumentHighlights?(document: TextDocument, position: vscode.Position, token: vscode.CancellationToken): NullableResult<vscode.DocumentHighlight[]>;
//     provideLinkedEditingRanges?(document: TextDocument, position: vscode.Position, token: vscode.CancellationToken): NullableResult<vscode.LinkedEditingRanges>;
//     provideDefinition?(document: TextDocument, position: vscode.Position, token: vscode.CancellationToken): NullableResult<vscode.LocationLink[]>;
//     provideTypeDefinition?(document: TextDocument, position: vscode.Position, token: vscode.CancellationToken): NullableResult<vscode.LocationLink[]>;
//     provideImplementation?(document: TextDocument, position: vscode.Position, token: vscode.CancellationToken): NullableResult<vscode.LocationLink[]>;
//     provideCodeLenses?(document: TextDocument, token: vscode.CancellationToken): NullableResult<vscode.CodeLens[]>;
//     provideCodeActions?(document: TextDocument, range: vscode.Range, context: vscode.CodeActionContext, token: vscode.CancellationToken): NullableResult<vscode.CodeAction[]>;
//     provideDocumentFormattingEdits?(document: TextDocument, range: vscode.Range, options: vscode.FormattingOptions, token: vscode.CancellationToken): NullableResult<vscode.TextEdit[]>;
//     provideOnTypeFormattingEdits?(document: TextDocument, position: vscode.Position, key: string, options: vscode.FormattingOptions, token: vscode.CancellationToken): NullableResult<vscode.TextEdit[]>;
//     provideDocumentLinks?(document: TextDocument, token: vscode.CancellationToken): NullableResult<vscode.DocumentLink[]>;
//     provideCompletionItems?(document: TextDocument, position: vscode.Position, context: vscode.CompletionContext, token: vscode.CancellationToken): NullableResult<vscode.CompletionList>;
//     provideDocumentColors?(document: TextDocument, token: vscode.CancellationToken): NullableResult<vscode.ColorInformation[]>;
//     provideColorPresentations?(document: TextDocument, color: vscode.Color, range: vscode.Range, token: vscode.CancellationToken): NullableResult<vscode.ColorPresentation[]>;
//     provideFoldingRanges?(document: TextDocument, token: vscode.CancellationToken): NullableResult<vscode.FoldingRange[]>;
//     provideSignatureHelp?(document: TextDocument, position: vscode.Position, context: vscode.SignatureHelpContext, token: vscode.CancellationToken): NullableResult<vscode.SignatureHelp>;
//     provideRenameRange?(document: TextDocument, position: vscode.Position, token: vscode.CancellationToken): NullableResult<vscode.Range | {
//         range: vscode.Range;
//         placeholder: string;
//     } | {
//         message: string;
//     }>;
//     provideRenameEdits?(document: TextDocument, position: vscode.Position, newName: string, token: vscode.CancellationToken): NullableResult<vscode.WorkspaceEdit>;
//     provideReferences?(document: TextDocument, position: vscode.Position, context: vscode.ReferenceContext, token: vscode.CancellationToken): NullableResult<vscode.Location[]>;
//     provideSelectionRanges?(document: TextDocument, positions: vscode.Position[], token: vscode.CancellationToken): NullableResult<vscode.SelectionRange[]>;
//     provideInlayHints?(document: TextDocument, range: vscode.Range, token: vscode.CancellationToken): NullableResult<vscode.InlayHint[]>;
//     provideCallHierarchyItems?(document: TextDocument, position: vscode.Position, token: vscode.CancellationToken): NullableResult<vscode.CallHierarchyItem[]>;
//     provideCallHierarchyIncomingCalls?(item: vscode.CallHierarchyItem, token: vscode.CancellationToken): Result<vscode.CallHierarchyIncomingCall[]>;
//     provideCallHierarchyOutgoingCalls?(item: vscode.CallHierarchyItem, token: vscode.CancellationToken): Result<vscode.CallHierarchyOutgoingCall[]>;
//     provideDocumentSemanticTokens?(document: TextDocument, range: vscode.Range, legend: vscode.SemanticTokensLegend, token: vscode.CancellationToken): NullableResult<SemanticToken[]>;
//     provideWorkspaceSymbols?(query: string, token: vscode.CancellationToken): NullableResult<vscode.WorkspaceSymbol[]>;
//     provideDiagnostics?(document: TextDocument, token: vscode.CancellationToken): NullableResult<vscode.Diagnostic[]>;
//     provideSemanticDiagnostics?(document: TextDocument, token: vscode.CancellationToken): NullableResult<vscode.Diagnostic[]>;
//     provideDiagnosticMarkupContent?(diagnostic: vscode.Diagnostic, token: vscode.CancellationToken): NullableResult<vscode.MarkupContent>;
//     provideFileReferences?(document: TextDocument, token: vscode.CancellationToken): NullableResult<vscode.Location[]>;
//     provideReferencesCodeLensRanges?(document: TextDocument, token: vscode.CancellationToken): NullableResult<vscode.Range[]>;
//     provideAutoInsertionEdit?(document: TextDocument, position: vscode.Position, lastChange: {
//         range: vscode.Range;
//         text: string;
//     }, token: vscode.CancellationToken): NullableResult<string | vscode.TextEdit>;
//     provideFileRenameEdits?(oldUri: string, newUri: string, token: vscode.CancellationToken): NullableResult<vscode.WorkspaceEdit>;
//     provideFormattingIndentSensitiveLines?(document: TextDocument, token: vscode.CancellationToken): NullableResult<number[]>;
//     provideDocumentDropEdits?(document: TextDocument, position: vscode.Position, dataTransfer: Map<string, DataTransferItem>, token: vscode.CancellationToken): NullableResult<DocumentDropEdit>;
//     resolveCodeLens?(codeLens: vscode.CodeLens, token: vscode.CancellationToken): Result<vscode.CodeLens>;
//     resolveCodeAction?(codeAction: vscode.CodeAction, token: vscode.CancellationToken): Result<vscode.CodeAction>;
//     resolveCompletionItem?(item: vscode.CompletionItem, token: vscode.CancellationToken): Result<vscode.CompletionItem>;
//     resolveDocumentLink?(link: vscode.DocumentLink, token: vscode.CancellationToken): Result<vscode.DocumentLink>;
//     resolveInlayHint?(inlayHint: vscode.InlayHint, token: vscode.CancellationToken): Result<vscode.InlayHint>;
//     transformCompletionItem?(item: vscode.CompletionItem): vscode.CompletionItem | undefined;
//     transformCodeAction?(item: vscode.CodeAction): vscode.CodeAction | undefined;
//     dispose?(): void;
// }
