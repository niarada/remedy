// Potentially useful references:
// https://github.com/typicode/husky

// import { Octokit } from "octokit";
// import simpleGit from "simple-git";
// const repoId = {
//     owner: "moonlight-pm",
//     repo: "htmx-bun",
// };
// const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
// const repo = await octokit.rest.repos.get(repoId);
// const release = await octokit.rest.repos.getLatestRelease(repoId);
// octokit.rest.repos.createRelease({
// });
// const git = simpleGit();
// console.log(await git.tags());
// import pkg from "../packages/htmx-bun/package.json"

import { $ } from "bun";

await $`cp README.md packages/htmx-bun/README.md`;
await $`cd packages/htmx-bun && npm publish`;
await $`rm packages/htmx-bun/README.md`;
