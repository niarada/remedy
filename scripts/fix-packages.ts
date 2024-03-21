import { writeFileSync } from "node:fs";
import * as path from "node:path";

const packages = ["package.json", "packages/server/package.json", "packages/vscode/package.json"];

for (const file of packages) {
    const fullPath = path.resolve(file);
    const pkg = require(fullPath);
    writeFileSync(fullPath, `${JSON.stringify(pkg, null, 4)}\n`);
}
