${toc}

# Features

Features in Remedy are comparable to both plugins and integrations in other frameworks.

Even some of what might be considered the salient parts of Remedy are implemented as features, and can
be disabled and configured as features.

All of these may be enabled, disabled, and configured in your [configuration](/configuration).

```ts
export default {
    features: [
        "static",
        "compress",
        "template",
        "markdown",
        "refresh",
        "typescript",
        "image",
        "htmx",
        "sse",
        "alpine",
        "tailwind",
        "fontawesome",
    ]
};
```


## "static"

Enable the delivery of any file in your public directory, that isn't otherwise handled by another feature.

## "compress"

Enables gzip compression.

## "template"

Remedy templates are *partial* files with the extension `.rx`.  They:

- Are scriptable.
- Produce HTML.
- Support form and query input.
- Are composable with other partials.

See [Templates](/templates) for details.

## "markdown"

Markdown files having the extension `.md` are treated as *partials* in that they are composable by templates.

This feature is configurable, and here's an example:

```ts
import markdown from "@niarada/remedy-feature-markdown";

export default {
    features: [
        "template",
        "refresh",
        markdown({
            theme: "themes/markdown.yml",
            languages: ["ts", "sh"],
        }),
    ],
};
```

## "refresh"

This feature enabled so-called "hot refresh" in the browser during development using server-side events.  You may want to enable it depending on the value of `process.env.NODE_ENV` like so:

```ts
export default {
    features: [
        "template",
        process.env.NODE_ENV === "development" && "refresh",
    ],
};
```

## "typescript"

Enabling this feature will bundle (via Bun) any `.ts` in your public directory for delivery as JavaScript to the browser.

## "image"

This feature uses **spark** to enable some image optimizations to the `<img>` tag:

- Examines images for their size and interpolates `width` and `height` attributes.
- If a void attribute `optimized` is added, along with `width` and/or `height`, it re-sizes images in on the fly.
- Adds `decoding="async"` and `loading="lazy"` attributes.

## "htmx"

Auto-includes the htmx library in any full-page response.

## "sse"

Auto-includes the `htmx` server-sent events plugin in any full-page response.

## "alpine"

Auto-includes the Alpine.js library in any full-page response.

## "tailwind"

Run's any `.css` file through the tailwind compiler before delivery to the browser.  If you happen to have the [Remedy VSCode extension](/editorsupport) installed, some configuration will be set up for you if this is enabled.

## "fontawesome"

Provides the fontawesome free library, e.g.:

```rx
<i class="fa-brands fa-github" />`
```
