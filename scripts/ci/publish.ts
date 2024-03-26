import { $ } from "bun";
import getLatestVersion from "latest-version";

const currentVersion = require("../../package.json").version;
const latestVersion = await getLatestVersion("@niarada/remedy");

if (currentVersion === latestVersion) {
    process.exit(0);
}

await $`bun all:publish`;
