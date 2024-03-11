import yaml from "js-yaml";
import { watch } from "node:fs";

const source = "packages/vscode/grammars/htmx-bun.tmLanguage.yaml";
const target = "packages/vscode/dist/htmx-bun.tmLanguage.json";

async function build() {
    console.log(`Building '${target}'...`);
    Bun.write(
        target,
        JSON.stringify(yaml.load(await Bun.file(source).text()), null, 4),
    );
}

await build();

if (process.argv.includes("--watch")) {
    console.log("Watching for changes...");
    watch(source, build);
}
