import { $ } from "bun";
import yaml from "js-yaml";
import { watch } from "node:fs";

// XXX: Rename this script.

const source = "packages/vscode/grammars/htmx-bun.tmLanguage.yaml";
const target = "packages/vscode/dist/htmx-bun.tmLanguage.json";

async function build() {
    $`mkdir -p packages/vscode/dist`;
    console.log(`Building '${target}'...`);
    Bun.write(
        target,
        JSON.stringify(yaml.load(await Bun.file(source).text()), null, 4),
    );
    console.log("Copying global.d.ts");
    $`cp packages/vscode/src/global.d.ts packages/vscode/dist`;
}

await build();

if (process.argv.includes("--watch")) {
    console.log("Watching for changes...");
    watch(source, build);
}
