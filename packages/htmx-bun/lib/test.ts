import { afterAll } from "bun:test";
import { mkdtempSync, rmdirSync } from "fs";
import { tmpdir } from "os";

export function makeTemporaryDirectory() {
    const dir = mkdtempSync(`${tmpdir()}/htmx-bun-`);
    afterAll(() => {
        rmdirSync(dir, { recursive: true });
    });
    return dir;
}
