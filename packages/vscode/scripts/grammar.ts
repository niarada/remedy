import yaml from "js-yaml";
import { readdirSync, watch } from "node:fs";

const argv = process.argv.slice(2);
const [watchArg] = argv.indexOf("--watch") !== -1 ? argv.splice(argv.indexOf("--watch"), 1) : [];
const out = argv[0] ?? "dist";

const sources = readdirSync("grammars/").filter((name) => name.endsWith(".tmLanguage.yaml"));

async function build() {
    for (let source of sources) {
        const target = `${out}/${source.replace(/.yaml$/, ".json")}`;
        source = `grammars/${source}`;
        Bun.write(target, JSON.stringify(yaml.load(await Bun.file(source).text()), null, 4));
    }
}

await build();

if (watchArg) {
    console.log("Watching for changes...");
    watch("grammars", { recursive: true }, build);
}
