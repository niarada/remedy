import { plugin } from "bun";
import { MarkdownSource } from "~/view/markdown/source";
import { PartialSource } from "../view/partial/source";

plugin({
    setup: ({ onLoad }) => {
        onLoad({ filter: /\.part$/ }, async ({ path }) => {
            const source = await PartialSource.fromPath(path);
            const code = await source.compile();
            // XXX: "ts" loader is broken it seems, doesn't understand types.
            return { contents: code, loader: "tsx" };
        });
    },
});

plugin({
    setup: ({ onLoad }) => {
        onLoad({ filter: /\.md$/ }, async ({ path }) => {
            const source = await MarkdownSource.fromPath(path);
            const code = await source.compile();
            return { contents: code, loader: "tsx" };
        });
    },
});
