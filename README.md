# Experimental micro-backend for htmx/bun development.

## Status: pre-alpha

```
bun i
bun examples:todo
```

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
