import * as serverProtocol from "@volar/language-server/protocol";
import { createLabsInfo, getTsdk } from "@volar/vscode";
import { LanguageClient, TransportKind } from "vscode-languageclient/node";

let client: LanguageClient;

export async function activate(context) {
    console.log("ACTIVATE");
    const serverPath = `${context.extensionPath}/dist/server/index.js`;
    client = new LanguageClient(
        "partial",
        "htmx-bun Language Server",
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

    console.log("ACTIVATION COMPLETE");
    return labs.extensionExports;
}

export function deactivate() {
    return client?.stop();
}
