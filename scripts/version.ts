import { Glob } from "bun";
import { writeFileSync } from "node:fs";
import * as path from "node:path";
import * as semver from "semver";

const argv = process.argv.slice(2);

const level = argv[0] ?? "patch";
if (!["major", "minor", "patch"].includes(level)) {
    console.error(`Invalid level: ${level}`);
    process.exit(1);
}

const currentVersion = require("../package.json").version;
const nextVersion = semver.inc(currentVersion, level as "major" | "minor" | "patch");

console.log(`Bumping version from ${currentVersion} to ${nextVersion}`);

const glob = new Glob("packages/**/package.json");
const packages = ["package.json", ...(await Array.fromAsync(glob.scan(".")))];

for (let file of packages) {
    console.log("Modifying", file);
    file = path.resolve(file);
    const content = require(file);
    content.version = nextVersion;
    writeFileSync(file, `${JSON.stringify(content, null, 4)}\n`);
}
