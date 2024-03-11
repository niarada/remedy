// XXX: This doesn't work.  Use webpack for now.

import { build } from "esbuild";

const debug = true; //process.argv.includes('debug')

await build({
    bundle: true,
    entryPoints: {
        extension: "packages/vscode/src/extension.ts",
        server: "packages/vscode/src/server/index.ts",
    },
    external: ["vscode"],
    logLevel: "info",
    minify: !debug,
    outdir: "packages/vscode/dist",
    platform: "node",
    sourcemap: debug,
    target: "node16",
});
