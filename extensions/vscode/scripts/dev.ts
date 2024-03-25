/**
 * Script to build the extension for development.
 */

import { $ } from "bun";
import { rmdirSync, watch } from "node:fs";

rmdirSync("dist", { recursive: true });

async function buildSource() {
    console.log("Building extension source...");
    // await $`mkdir -p packages/vscode/src/template`;
    // await $`find packages/server/hypermedia/template -name "*.ts" ! -name "*.test.ts" -exec cp {} packages/vscode/src/template \;`;
    // await $`cp -r packages/server/hypermedia/template/*.ts packages/vscode/src/template`;
    // await $`rm packages/vscode/src/template/**/*.test.ts`;
    await $`tsc`;
}

async function buildGrammar() {
    console.log("Building extension grammar...");
    await $`moon vscode:grammar`;
}

await $`moon template:build`;
await buildSource();
await buildGrammar();

watch("grammars", { recursive: true }, buildGrammar);
watch("src", { recursive: true }, buildSource);
watch("../template", { recursive: true }, async () => {
    await $`moon template:build`;
    await buildSource();
});
