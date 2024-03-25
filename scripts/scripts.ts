import commandLineUsage from "command-line-usage";
import { resolve } from "node:path";

const pkg = require(resolve("package.json"));

const sections = [
    {
        header: "{underline Remedy Repository}",
        content: "Usage: bun <script> [args]",
    },
    {
        header: "{underline Scripts}",
        content: [
            {
                name: "scripts",
                summary: "Show this screen.",
            },
            {
                name: "example <name>",
                summary: "Run an app from the examples directory.",
            },
            {
                name: "docs:build",
                summary: "Build documentation.",
            },
            {
                name: "packages:build",
                summary: "Build packages.",
            },
            {
                name: "packages:fix",
                summary: "Fix formatting of package.json files.",
            },
            {
                name: "packages:publish",
                summary: "Publish packages.",
            },
            {
                name: "packages:version [major|minor|patch]",
                summary: "Bump package.json versions.",
            },
            {
                name: "extensions:vscode:dev",
                summary: "Build and watch vscode extension for development.",
            },
            {
                name: "extensions:vscode:publish",
                summary: "Build and publish vscode extension.",
            },
            {
                name: "all:publish",
                summary: "Build and publish all packages and extensions.",
            },
        ],
    },
];

console.log(commandLineUsage(sections));
