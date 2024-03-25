# Configuration

When you first start **remedy** a `remedy.config.ts` file will be created in your project root.

It takes the following structure, all fields are optional, defaults are given:

```ts
export default {
    port: 4321,
    // The base public folder
    public: "public",
    features: [
        // "fontawesome",
        // "tailwind",
        // "alpine",
        // "htmx",
        // "sse",
        // "image",
        "refresh",
        "typescript",
        "static",
    ]
}
```

The [features](/features) page offers more information on those.
