# Experimental micro-backend for htmx/bun development.

## Status: pre-alpha

## Principles

1. All views are partials.
1. All views produce html.
1. All views are custom elements.
1. Custom elements are defined by their path in the view hierarchy.
1. Custom elements are written in html, typescript, and probably some future astro-like language.
1. Bun is the only supported runtime.
1. Typescript-only.
1. Single back-end.
1. No static site rendering.
1. No apis.
1. No JSX.

## Goals

1. Extremely fast implementation of prototypes.
1. Most common integrations baked in:
    1. Htmx w/ SSE
    1. Alpine
    1. Tailwind
    1. Fontsource

## Run an example

```sh
git clone https://github.com/moonlight-pm/htmx-bun
cd htmx-bun
bun i
bun examples:todo
```

## Start fresh

```sh
mkdir my-project
cd my-project
echo "{}" > package.json
bun i https://gitpkg.now.sh/moonlight-pm/htmx-bun/packages/htmx-bun
bunx htmx-bun
```

Now, start dropping files in the `view` directory.  Tailwind will whine if you don't use it.  You can disable tailwind by placing a file called `options.ts` in your project that looks something like this:

```ts
import { ServerOptions } from "htmx-bun/server/options";

export default {
    features: {
        tailwind: false,
    },
} satisfies ServerOptions;
```

You'll need to restart the server after adding or changing `options.ts`.
