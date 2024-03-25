import { $ } from "bun";
import { readdirSync } from "node:fs";

const packages = readdirSync("packages", { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory() && !["vscode", "features", "server"].includes(dirent.name))
    .map((dirent) => `packages/${dirent.name}`)
    .concat(
        readdirSync("packages/features", { withFileTypes: true })
            .filter((dirent) => dirent.isDirectory())
            .map((dirent) => `packages/features/${dirent.name}`),
    );

await $`cp README.md packages/server`;
await $`cd packages/server && npm publish --access public`;
await $`rm packages/server/README.md`;

for (const path of packages) {
    await $`cd ${path} && npm publish --access public`;
}
