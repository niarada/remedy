${toc}

# Configuration

If you create a project with `remedy new`, or run the `server` with the `-c` option, a configuration file (`remedy.config.ts`) will be created for you.

It takes the following structure, all fields are optional, defaults are given:

```ts
export default {
    port: 4321,
    public: "public",
    features: [
        // "compress",
        // "image",
        // "alpine",
        // "fontawesome",
        // "tailwind",
        // "htmx",
        // "sse",
        // "markdown",
        // "typescript",
        "refresh",
        "partial",
        "static",
    ]
};
```

For detailed information about available features, see the [Features](/features) page.
