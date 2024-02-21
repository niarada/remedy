import { FSWatcher, watch as nodeWatch } from "fs";

const watchers = new Map<string, FSWatcher>();

export function watch(path: string, fn: (event: string, path: string) => Promise<void> | void) {
    let watcher = watchers.get(path);
    if (!watcher) {
        watcher = nodeWatch(path, { recursive: true });
        watchers.set(path, watcher);
    }
    watcher.addListener("change", fn);
}
