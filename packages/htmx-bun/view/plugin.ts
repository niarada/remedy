import { plugin } from "bun";
import { Source } from "./source";

plugin({
    setup: ({ onLoad }) => {
        onLoad({ filter: /\.part$/ }, async ({ path }) => {
            const source = new Source(path);
            const code = await source.compile();
            // if (path.endsWith("todo/item.part")) {
            //     console.log(code);
            // }
            // XXX: "ts" loader is broken it seems, doesn't understand types.
            return { contents: code, loader: "tsx" };
        });
    },
});
