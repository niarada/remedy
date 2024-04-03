/**
 * Builds the documentation.
 *
 * Copies and runs the docs example, then crawls it.
 *
 * It should be noted this could fail if the sleep time of 1 second to wait for server startup is too short.
 */

import { $, Glob } from "bun";
import fs from "node:fs";
import path from "node:path";

function postprocess() {
    const glob = new Glob("**/*.html");

    for (const shortfile of glob.scanSync("docs")) {
        const file = `docs/${shortfile}`;
        if (shortfile !== "index.html") {
            fs.mkdirSync(`docs/${path.parse(file).name}`, { recursive: true });
        }
        let source = fs.readFileSync(file, "utf-8");
        source = rewriter.transform(source).toString();
        if (shortfile !== "index.html") {
            fs.writeFileSync(`docs/${path.parse(file).name}/index.html`, source);
            fs.rmSync(file);
        } else {
            fs.writeFileSync("docs/index.html", source);
        }
    }
}

const rewriter = new HTMLRewriter();
rewriter.on("*", {
    element(el) {
        if (el.tagName === "a") {
            let [href, anchor] = el.getAttribute("href")?.split("#") ?? [];
            if (!href) return;
            if (href.includes(":")) return;
            if (href?.endsWith("/index.html")) {
                href = href.replace("/index.html", "");
            }
            if (href?.endsWith(".html")) {
                href = href.replace(".html", "");
            }
            if (href === "" || href === "index") {
                href = "/";
            }
            if (href[0] !== "/") {
                href = `/${href}`;
            }
            el.setAttribute("href", `${href}${anchor ? `#${anchor}` : ""}`);
        } else if (el.hasAttribute("href")) {
            const href = el.getAttribute("href")!;
            if (href.includes(":")) return;
            if (href[0] !== "/") {
                el.setAttribute("href", `/${href}`);
            }
        } else if (el.hasAttribute("src")) {
            const src = el.getAttribute("src")!;
            if (src.includes(":")) return;
            if (src[0] !== "/") {
                el.setAttribute("src", `/${src}`);
            }
        }
    },
});

const work = ".docs-build";

fs.rmdirSync("docs", { recursive: true });
fs.rmdirSync(work, { recursive: true });
await $`cp -r examples/docs ${work}`;

const config = `
import markdown from "@niarada/remedy-feature-markdown";

export default {
    port: 5678,
    features: [
        "fontawesome",
        "tailwind",
        "static",
        "template",
        markdown({
            theme: "themes/markdown.yml",
            languages: ["ts", "sh"],
        }),
    ],
};
`;

await Bun.write(`${work}/remedy.config.ts`, config);

const server = Bun.spawn(["packages/server/bin/remedy"], {
    stdio: ["inherit", "inherit", "inherit"],
    cwd: work,
    onExit(subprocess, exitCode, signalCode, error) {
        if (error) {
            console.error(error);
        }
    },
});

await Bun.sleep(1000);

await $`wget -P docs --mirror --convert-links --adjust-extension --page-requisites --no-parent --no-host-directories localhost:5678`;
postprocess();

await Bun.write("docs/CNAME", "remedy.niarada.io");
await Bun.write("docs/.nojekyll", "");

server.kill();

fs.rmdirSync(work, { recursive: true });
