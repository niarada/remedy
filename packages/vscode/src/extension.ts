import { getTsdk } from "@volar/vscode";
import { Uri } from "vscode";
import { LanguageClient, TransportKind } from "vscode-languageclient/node";

let client: LanguageClient;

export async function activate(context) {
    console.log("ACTIVATE");
    const module = Uri.joinPath(
        context.extensionUri,
        "dist",
        "server",
        "index.js",
    ).fsPath;
    client = new LanguageClient(
        "montana",
        "Montana Language Server",
        {
            run: {
                module: module,
                transport: TransportKind.ipc,
                options: { execArgv: [] },
            },
            debug: {
                module: module,
                transport: TransportKind.ipc,
                options: { execArgv: ["--nolazy", "--inspect=6009"] },
            },
        },
        {
            documentSelector: [{ language: "montana" }],
            initializationOptions: {
                typescript: {
                    tsdk: (await getTsdk(context)).tsdk,
                },
            },
        },
    );
    client.start();
}

export function deactivate() {
    return client?.stop();
}
