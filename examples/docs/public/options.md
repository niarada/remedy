# Options

To add special configuration to **remedy**, drop an `options.ts` file in your project root.

Have it follow this structure, all fields are optional, defaults are given:

```ts
export default {
    port: 4321,
    features: {
        fontawesome: false,
        tailwind: false,
        alpine: false,
        # Enable htmx server-side events
        sse: false,
        # Enable htmx, this can be set to false
        htmx: {
            # Enable htmx debug output
            debug: false,
        },
        # Serve static files
        static: true,
        # Dev mode allows hot refresh
        dev: import.meta.env.NODE_ENV === "development",
    },
}
```
