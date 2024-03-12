/**
 * Script to build the extension for development.
 * Production builds happen with `publish-extension.sh`
 */

import { $ } from "bun";
import { watch } from "node:fs";

async function buildSource() {
    console.log("Building extension source...");
    await $`tsc -p packages/vscode`;
}

async function buildGrammar() {
    console.log("Building extension grammar...");
    await $`bun build:grammar`;
}

await buildSource();
await buildGrammar();

watch("packages/vscode/src", buildSource);
watch("packages/vscode/grammars", buildGrammar);
