import { $ } from "bun";

await $`cp ../../README.md .`;
await $`npm publish --access public`;
await $`rm README.md`;
