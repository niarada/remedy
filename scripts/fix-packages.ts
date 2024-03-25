/**
 * Fix package.json files.
 *
 * As bun thoughtlessly disrespects package.json formatting, this script fixes them.
 */

import { Glob } from "bun";
import { writeFileSync } from "node:fs";
import * as path from "node:path";

const glob = new Glob("packages/**/package.json");
const packages = ["package.json", "extensions/vscode/package.json", ...(await Array.fromAsync(glob.scan(".")))];

for (const file of packages) {
    console.log("Fixing", file);
    const fullPath = path.resolve(file);
    const pkg = require(fullPath);
    writeFileSync(fullPath, `${JSON.stringify(pkg, null, 4)}\n`);
}
