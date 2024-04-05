/**
 * Script to build the extension for development.
 */

import { $ } from "bun";
import { rmdirSync, watch } from "node:fs";

rmdirSync("dist", { recursive: true });

async function buildSource() {
    console.log("Building extension source...");
    await $`tsc`;
}

async function buildGrammar() {
    console.log("Building extension grammar...");
    await $`bun scripts/grammar.ts`;
}

async function buildPackages() {
    console.log("Building packages...");
    await $`cd ../.. && bun packages:build`;
}

await buildPackages();
await buildSource();
await buildGrammar();

watch("grammars", { recursive: true }, buildGrammar);
watch("src", { recursive: true }, buildSource);
watch("../../packages/template/src", { recursive: true }, async () => {
    await buildPackages();
    await buildSource();
});
