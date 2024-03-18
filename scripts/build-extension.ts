/**
 * Script to build the extension for development.
 * Production builds happen with `publish-extension.sh`
 */

import { $ } from "bun";
import { rmdirSync, watch } from "node:fs";

rmdirSync("packages/vscode/dist", { recursive: true });
rmdirSync("packages/vscode/src/template", { recursive: true });

async function buildSource() {
    console.log("Building extension source...");
    await $`mkdir -p packages/vscode/src/template`;
    await $`find packages/server/hypermedia/template -name "*.ts" ! -name "*.test.ts" -exec cp {} packages/vscode/src/template \;`;
    // await $`cp -r packages/server/hypermedia/template/*.ts packages/vscode/src/template`;
    // await $`rm packages/vscode/src/template/**/*.test.ts`;
    await $`tsc -p packages/vscode`;
}

async function buildGrammar() {
    console.log("Building extension grammar...");
    await $`bun build:grammar`;
}

await buildSource();
await buildGrammar();

watch("packages/vscode/grammars", buildGrammar);
watch("packages/vscode/src/server", { recursive: true }, buildSource);
watch("packages/vscode/src/extension.ts", buildSource);
watch("packages/server/hypermedia/template", buildSource);
