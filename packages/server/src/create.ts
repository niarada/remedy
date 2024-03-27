import { chalk } from "@niarada/remedy-common";
import { $ } from "bun";
import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";

interface CreateOptions {
    path?: string;
}

export async function create(options: CreateOptions = {}) {
    if (!options.path) {
        options.path = ".";
    }
    console.info(chalk.bold.blue(`Creating new remedy project in '${options.path}'`));
    if (existsSync(options.path) && readdirSync(options.path!).length > 0) {
        console.error("Destination path is not empty.  Please specify a clean target.");
        return;
    }
    mkdirSync(options.path, { recursive: true });
    const configPath = `${options.path}/remedy.config.ts`;
    console.log(`Creating '${configPath}'`);
    writeFileSync(configPath, remedyConfig);
    const fullPath = path.resolve(options.path!);
    const pkg = require("../package.json");
    const userpkg = {
        name: path.parse(fullPath).name,
        version: "0.0.0",
        dependencies: {
            "@niarada/remedy": `^${pkg.version}`,
        },
    };
    const packagePath = `${options.path}/package.json`;
    console.log(`Creating '${packagePath}'`);
    writeFileSync(packagePath, JSON.stringify(userpkg, null, 4));

    await $`cd ${options.path} && bun install`;

    console.info();
    console.info(chalk.bold.green("Project created."));
    console.info();
    const command = chalk.bold.yellow(options.path === "." ? "bunx remedy" : `cd ${options.path} && bunx remedy`);
    console.info(`Run '${command}' to start the server.`);
    console.info();
    console.info("Be sure to check the docs for details on configuration and more.");
    console.info(chalk.white.bold.underline("https://remedy.niarada.dev"));
}

const remedyConfig = `export default {
    port: 4321,
    public: "public",
    features: [
        // "compress",
        // "image",
        // "alpine",
        // "fontawesome",
        // "tailwind",
        // "htmx",
        // "sse",
        // "markdown",
        // "typescript",
        "refresh",
        "partial",
        "static",
    ]
};`;
