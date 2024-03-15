# Potentially useful references:
# https://github.com/typicode/husky

# import { Octokit } from "octokit";
# import simpleGit from "simple-git";
# const repoId = {
#     owner: "niarada",
#     repo: "remedy",
# };
# const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
# const repo = await octokit.rest.repos.get(repoId);
# const release = await octokit.rest.repos.getLatestRelease(repoId);
# octokit.rest.repos.createRelease({
# });
# const git = simpleGit();
# console.log(await git.tags());
# import pkg from "../packages/server/package.json"

cp README.md packages/server/README.md
cd packages/server
npm publish --access public
rm README.md
