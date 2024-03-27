/**
 * Clean up some stuff Bun causes.
 *
 * As bun thoughtlessly disrespects package.json formatting, this script fixes them.
 * Also use this occasion to clear out any deep node_modules directories it may have created.
 * Delete the lockfile.
 */

import { $, Glob } from "bun";
import { rmSync, writeFileSync } from "node:fs";
import path from "node:path";

console.log("Cleaning out node_modules...");
await $`find . -name node_modules | xargs rm -rf`;

const glob = new Glob("packages/**/package.json");
const packages = ["package.json", "extensions/vscode/package.json", ...glob.scanSync(".")];

for (const file of packages) {
    console.log("Rewriting", file);
    const fullPath = path.resolve(file);
    const pkg = require(fullPath);
    writeFileSync(fullPath, `${JSON.stringify(pkg, null, 4)}\n`);
}

rmSync("bun.lockb", { force: true });
await $`bun install`;
