import { $ } from "bun";

await $`cp README.md packages/server`;
await $`npm publish --access public --workspaces`;
await $`rm packages/server/README.md`;
