import markdown from "@niarada/remedy-feature-markdown";

export default {
    features: [
        "compress",
        "fontawesome",
        "tailwind",
        "refresh",
        "static",
        "partial",
        markdown({
            theme: "themes/markdown.yml",
            languages: ["ts", "sh"],
        }),
    ],
};
