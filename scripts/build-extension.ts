/**
 * Script to build the extension for development.
 * Production builds happen with `publish-extension.sh`
 */

import { $ } from "bun";
import { watch } from "node:fs";

async function buildSource() {
    console.log("Building extension source...");
    await $`mkdir -p packages/vscode/src/template`;
    await $`cp -r packages/server/hypermedia/template/*.ts packages/vscode/src/template`;
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
