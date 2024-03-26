import { $ } from "bun";

const response = await (await fetch("https://registry.npmjs.org/@niarada/remedy")).json();
const publishedVersion = response["dist-tags"].latest;
const committedVersion = require("../../package.json").version;

if (publishedVersion !== committedVersion) {
    await $`bun all:publish`;
}
