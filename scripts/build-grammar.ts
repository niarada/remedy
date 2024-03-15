import yaml from "js-yaml";
import { watch } from "node:fs";

const argv = process.argv.slice(2);
const [watchArg] = argv.indexOf("--watch") !== -1 ? argv.splice(argv.indexOf("--watch"), 1) : [];
const target = argv[0] || "packages/vscode/dist/remedy.tmLanguage.json";

const source = "packages/vscode/grammars/remedy.tmLanguage.yaml";

async function build() {
    console.log(`Building '${target}'...`);
    Bun.write(target, JSON.stringify(yaml.load(await Bun.file(source).text()), null, 4));
}

await build();

if (watchArg) {
    console.log("Watching for changes...");
    watch(source, build);
}
