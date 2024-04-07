import { $ } from "bun";

const workspaces = require("../package.json").workspaces;
workspaces.splice(workspaces.indexOf("extensions/vscode"), 1);

await $`cp README.md packages/server`;
for (const workspace of workspaces) {
    console.log(`Publishing ${workspace}...`);
    try {
        await $`npm publish --access public -w ${workspace}`;
    } catch (e) {
        console.error(e.info.stderr.toString());
    }
}
await $`rm packages/server/README.md`;
