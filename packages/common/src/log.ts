import chalk from "chalk";
import { Logger } from "effect";

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

//     readonly fiberId: FiberId.FiberId
//     readonly logLevel: LogLevel.LogLevel
// export type LogLevel = All | Fatal | Error | Warning | Info | Debug | Trace | None
//     readonly message: Message
//     readonly cause: Cause.Cause<unknown>
//     readonly context: FiberRefs.FiberRefs
//     readonly spans: List.List<LogSpan.LogSpan>
//     readonly annotations: HashMap.HashMap<string, unknown>
//     readonly date: Date

export const logger = Logger.make(({ logLevel, fiberId, date, message }) => {
    const color = {
        ALL: chalk.white,
        FATAL: chalk.red,
        ERROR: chalk.red,
        WARN: chalk.yellow,
        INFO: chalk.blue,
        DEBUG: chalk.gray,
        TRACE: chalk.gray,
        NONE: chalk.white,
        OFF: chalk.white,
    }[logLevel.label];
    const level = color(logLevel.label.padEnd(5, " "));
    console.log(`${chalk.gray(date.toISOString())} ${level} ${message}`);
});
