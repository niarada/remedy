import { load } from "js-yaml";
import { readFileSync, writeFileSync } from "node:fs";

interface LaunchDescription {
    extension: {
        name: string;
        cwd: string;
    }[];
}

interface LaunchFile {
    version: string;
    configurations: LaunchConfiguration[];
    compounds: LaunchCompound[];
}

interface LaunchConfiguration {
    name: string;
    type: string;
    request: string;
    port?: number;
    restart?: boolean;
    outFiles?: string[];
    runtimeExecutable?: string;
    args?: string[];
    autoAttachChildProcesses?: boolean;
}

interface LaunchCompound {
    name: string;
    configurations: string[];
}

const launch = load(readFileSync("launch.yml", "utf-8")) as LaunchDescription;

const output: LaunchFile = {
    version: "0.2.0",
    configurations: [
        {
            name: "Language Server: Attach",
            type: "node",
            request: "attach",
            port: 6009,
            restart: true,
            outFiles: ["${workspaceRoot}/extensions/vscode/dist/**/*.js"],
        },
    ],
    compounds: [],
};

for (const config of launch.extension) {
    output.configurations.push({
        name: `Extension: ${config.name}`,
        type: "extensionHost",
        request: "launch",
        runtimeExecutable: "${execPath}",
        args: [
            "--extensionDevelopmentPath=${workspaceRoot}/extensions/vscode",
            `--folder-uri=\${workspaceRoot}/${config.cwd}`,
        ],
        autoAttachChildProcesses: true,
    });
    output.compounds.push({
        name: `Extension + LS: ${config.name}`,
        configurations: [`Extension: ${config.name}`, "Language Server: Attach"],
    });
}

writeFileSync(".vscode/launch.json", JSON.stringify(output, null, 4));
