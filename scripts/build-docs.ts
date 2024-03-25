/**
 * Builds the documentation.
 *
 * Copies and runs the docs example, then crawls it.
 *
 * It should be noted this could fail if the sleep time of 1 second to wait for server startup is too short.
 */

import { $ } from "bun";
import fs from "node:fs";

const work = ".docs-build";

fs.rmdirSync("docs", { recursive: true });
fs.rmdirSync(work, { recursive: true });
await $`cp -r examples/docs ${work}`;

const config = `
export default {
    port: 5678,
    features: ["fontawesome", "tailwind", "static"],
};`;

await Bun.write(`${work}/remedy.config.ts`, config);

const server = Bun.spawn(["packages/server/bin/remedy"], {
    cwd: work,
    onExit(subprocess, exitCode, signalCode, error) {
        if (error) {
            console.error(error);
        }
    },
});

await Bun.sleep(1000);

await $`wget -P docs --mirror --convert-links --adjust-extension --page-requisites --no-parent --no-host-directories localhost:5678`;
await Bun.write("docs/CNAME", "remedy.niarada.io");
await Bun.write("docs/.nojekyll", "");

server.kill();

fs.rmdirSync(work, { recursive: true });
