import { $ } from "bun";
import { rmdirSync } from "node:fs";

rmdirSync("dist", { recursive: true });

await $`bun scripts/grammar.ts`;
await $`bunx esbuild --bundle --format=cjs --platform=node --minify --external:vscode --outdir=dist src/extension.ts`;
await $`bunx webpack --config scripts/webpack.config.js`;
// await $`bunx vsce package --no-dependencies`;
await $`bunx vsce publish --no-dependencies -p $VSCE_TOKEN`;
