import chalk from "chalk";

export function error(...args: unknown[]) {
    log("error", ...args);
}

export function warn(...args: unknown[]) {
    log("warn", ...args);
}

export function info(...args: unknown[]) {
    log("info", ...args);
}

export function debug(...args: unknown[]) {
    log("debug", ...args);
}

export function trace(...args: unknown[]) {
    log("trace", ...args);
}

type Level = "error" | "warn" | "info" | "debug" | "trace";

function log(level: Level, ...args: unknown[]) {
    const group = args.length > 1 ? args[0] : "global";
    const rest = args.length > 1 ? args.slice(1) : args;
    const now = new Date();
    const hour = now.getHours().toString().padStart(2, "0");
    const minute = now.getMinutes().toString().padStart(2, "0");
    const second = now.getSeconds().toString().padStart(2, "0");
    const color = {
        error: chalk.red,
        warn: chalk.yellow,
        info: chalk.blue,
        debug: chalk.green,
        trace: chalk.gray,
    }[level];
    const timestamp = chalk.gray(`${hour}:${minute}:${second}`);

    console[level](timestamp, `${color(`[${group}]`)}`, ...rest);
}
