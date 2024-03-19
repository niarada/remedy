import * as serverProtocol from "@volar/language-server/protocol";
import { createLabsInfo, getTsdk } from "@volar/vscode";
import * as vscode from "vscode";
import { LanguageClient, TransportKind } from "vscode-languageclient/node";

let client: LanguageClient;

export async function activate(context: vscode.ExtensionContext) {
    await initializeExtension(context);
    const serverPath = `${context.extensionPath}/dist/server/index.js`;
    client = new LanguageClient(
        "partial",
        "remedy language server",
        {
            run: {
                module: serverPath,
                transport: TransportKind.ipc,
                options: { execArgv: [] },
            },
            debug: {
                module: serverPath,
                transport: TransportKind.ipc,
                options: { execArgv: ["--nolazy", "--inspect=6009"] },
            },
        },
        {
            documentSelector: [{ language: "partial" }],
            initializationOptions: {
                typescript: {
                    tsdk: (await getTsdk(context)).tsdk,
                },
            },
        },
    );
    await client.start();

    const labs = createLabsInfo(serverProtocol);
    labs.addLanguageClient(client);

    return labs.extensionExports;
}

export function deactivate() {
    return client?.stop();
}

function initializeExtension(context) {
    // const workspaceOptions = getWorkspaceOptions(context);
    // vscode.workspace
    //     .getConfiguration("tailwindCSS")
    //     .update("experimental.configFile", `${context.extensionPath}/assets/tailwind.js`);
    vscode.workspace.getConfiguration("tailwindCSS").update("includeLanguages", {
        partial: "html",
    });
}

function getWorkspaceOptions(context) {
    // TODO: At some point we'd like to see if tailwind is actually turned on in the
    //       users `options.ts`, before messing with their workspace .vscode/settings.json.
    // if (!fs.existsSync(`${context.workspaceFolder.uri.fsPath}/options.ts`)) {
    //     return {};
    // }
    // const program = ts.createProgram([`${context.workspaceFolder.uri.fsPath}/options.ts`], {
    //     target: ts.ScriptTarget.ES2015,
    //     module: ts.ModuleKind.CommonJS,
    // });
    // const emitResult = program.emit();
    // const diagnostics = ts.getPreEmitDiagnostics(program);
    // log(emitResult.toString());
    // log(diagnostics.toString());
}
