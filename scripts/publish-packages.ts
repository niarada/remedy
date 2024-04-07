import { $ } from "bun";

const workspaces = require("../package.json").workspaces;
workspaces.splice(workspaces.indexOf("extensions/vscode"), 1);
const workspacesArgs = `-w ${workspaces.join(" -w ")}`;

await $`cp README.md packages/server`;
await $`npm publish --access public ${workspacesArgs}`;
await $`rm packages/server/README.md`;
