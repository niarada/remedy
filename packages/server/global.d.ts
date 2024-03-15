import EventEmitter from "events";
import { FSWatcher } from "fs";

declare global {
    // biome-ignore lint:
    var watchers: FSWatcher[];
    // biome-ignore lint:
    var emitter: EventEmitter;
}
