import { $ } from "bun";
import { rmdirSync } from "node:fs";

rmdirSync("dist", { recursive: true });

await $`bun scripts/grammar.ts`;
await $`esbuild --bundle --format=cjs --platform=node --minify --external:vscode --outdir=dist src/extension.ts`;
await $`webpack --config scripts/webpack.config.js`;
// await $`vsce package --no-dependencies`;
await $`vsce publish --no-dependencies`;
