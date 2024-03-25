import htmx from "@niarada/remedy-feature-htmx";

export default {
    features: [htmx({ debug: true }), "static", "refresh"],
};
