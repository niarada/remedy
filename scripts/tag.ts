import { simpleGit } from "simple-git";

const currentVersion = require("../package.json").version;

const git = simpleGit();

const status = await git.status();

if (!status.isClean()) {
    console.log("Please commit or stash changes before tagging");
    process.exit(1);
}

console.log("Tagging version", currentVersion);

await git.addTag(currentVersion);
await git.pushTags();
