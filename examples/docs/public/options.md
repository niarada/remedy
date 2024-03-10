# Options

To configure **htmx-bun** options, drop an `options.ts` file in your project root.

Have it follow this structure, all fields are optional, defaults are given:

```
export default {
    port: 4321,
    features: {
        fontawesome: false,
        tailwind: false,
        markdown: false,
        # Enable htmx, this can be set to false
        htmx: {
            # Enable htmx debug output
            debug: false,
        },
        # Enable htmx server-side events
        sse: true,
        # Serve static files
        static: true,
        # Dev mode allows hot refresh
        dev: import.meta.env.NODE_ENV === "development",
    },
}
```
