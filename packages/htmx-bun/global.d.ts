import { FSWatcher } from "fs";

declare global {
    // biome-ignore lint:
    var watchers: FSWatcher[];
}
