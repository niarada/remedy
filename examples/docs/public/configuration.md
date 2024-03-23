# Configuration

When you first start **remedy** a `remedy.config.ts` file will be created in your project root.

It takes the following structure, all fields are optional, defaults are given:

```ts
export default {
    port: 4321,
    // The base public folder
    base: "public",
    features: {
        fontawesome: false,
        tailwind: false,
        alpine: false,
        // Enable htmx server-side events
        sse: false,
        // Enable htmx, this can be set to false
        htmx: false,
        // htmx may be set to an object if you want debugging
        // htmx: {
        //    debug: true,
        // },
        // Image optimization
        image: false,
        // Bundle typescript endpoints
        typescript: true,
        // Serve static files
        static: true,
        // Dev mode allows hot refresh
        dev: import.meta.env.NODE_ENV === "development",
    },
}
```
