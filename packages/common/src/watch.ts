import { FSWatcher, WatchListener, watch as nodeWatch } from "node:fs";

declare global {
    var watchers: FSWatcher[];
}

// In bun, on hot reload, watchers are not cleared and hang around.  Keep track of
// them so that we can close them when reload occurs.
if (!global.watchers) {
    global.watchers = [];
}

for (const watcher of watchers) {
    watcher.close();
}

export function watch(path: string, fn: WatchListener<string>) {
    watchers.push(nodeWatch(path, { recursive: true }, fn));
}
