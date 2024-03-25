import { $ } from "bun";

await $`cp README.md packages/server`;
await $`npm publish --access public --dry-run --workspaces`;
await $`rm packages/server/README.md`;
