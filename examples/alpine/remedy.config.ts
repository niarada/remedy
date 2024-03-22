export default {
    port: 4321,
    base: "public",
    features: {
        fontawesome: false,
        tailwind: false,
        alpine: true,
        htmx: false,
        sse: false,
        image: true,
        typescript: true,
        static: true,
        dev: import.meta.env.NODE_ENV === "development",
    },
};
