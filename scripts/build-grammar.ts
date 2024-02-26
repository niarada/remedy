import { watch } from "fs";
import yaml from "js-yaml";

const source = "packages/vscode/grammars/montana.tmLanguage.yaml";
const target = "packages/vscode/dist/montana.tmLanguage.json";

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
