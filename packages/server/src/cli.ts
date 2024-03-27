import { info } from "@niarada/remedy-common";
import { Option, program } from "commander";
import { create } from "./create";
import { serve } from "./server";

const pkg = require("../package.json");

export function cli() {
    const options = program.parseOptions(process.argv);
    if (!options.operands[2]) {
        process.argv.push("serve");
    }
    program.parse();
}

program
    .name("remedy")
    .version(pkg.version)
    .description(`remedy hypermedia server v${pkg.version}

If no arguments are provided, runs the server in the current
directory, serving the specified or configured public folder,
or the current directory.
`);
program.addOption(new Option("--is-hot").hideHelp());

program
    .command("new")
    .description("Create a new remedy project")
    .argument("[path]", "The path to create the project in")
    .action((path) => {
        create({ path });
    });

program
    .command("serve")
    .description("Start the hypermedia server")
    .argument("[public]", "The public directory to serve from")
    .option("-p, --port <number>", "The port to listen on")
    .option("-P, --public <path>", "The public directory to serve from")
    .option("-C, --create-config", "Create a config file")
    .action((path: string, options, command) => {
        if (path) {
            options.public = path;
        }
        serve(options);
        if (command.parent.opts().isHot) {
            info("server", "running hot");
        }
    });
