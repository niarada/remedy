import { plugin } from "bun";
import { Source } from "../partial/source";

plugin({
    setup: ({ onLoad }) => {
        onLoad({ filter: /\.part$/ }, async ({ path }) => {
            const source = await Source.fromPath(path);
            const code = await source.compile();
            // console.log(path);
            // console.log(code);
            // XXX: "ts" loader is broken it seems, doesn't understand types.
            return { contents: code, loader: "tsx" };
        });
    },
});
