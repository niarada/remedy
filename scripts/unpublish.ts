import { $ } from "bun";
import { readdirSync } from "node:fs";

const version = require("../package.json").version;

const packages = readdirSync("packages", { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory() && !["vscode", "features", "server"].includes(dirent.name))
    .map((dirent) => `@niarada/remedy-${dirent.name}@${version}`)
    .concat(
        readdirSync("packages/features", { withFileTypes: true })
            .filter((dirent) => dirent.isDirectory())
            .map((dirent) => `@niarada/remedy-feature-${dirent.name}@${version}`),
    );
packages.push(`@niarada/remedy@${version}`);

for (const name of packages) {
    await $`npm unpublish ${name}`;
}
