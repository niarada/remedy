import { $ } from "bun";
import fs from "node:fs";

const work = ".docs-build";

fs.rmdirSync("docs", { recursive: true });
fs.rmdirSync(work, { recursive: true });
await $`cp -r examples/docs ${work}`;
await Bun.write(
    `${work}/options.ts`,
    `
export default {
    port: 5678,
    features: {
        dev: false,
        htmx: false,
        fontawesome: true,
        tailwind: true,
    },
};
`,
);

const server = Bun.spawn(["node_modules/.bin/remedy"], {
    cwd: work,
});

await Bun.sleep(1000);

await $`wget -P docs --mirror --convert-links --adjust-extension --page-requisites --no-parent --no-host-directories localhost:5678`;
await Bun.write("docs/CNAME", "remedy.niarada.io");
await Bun.write("docs/.nojekyll", "");

server.kill();

fs.rmdirSync(work, { recursive: true });
