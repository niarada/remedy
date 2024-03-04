# Experimental micro-backend for htmx/bun development.

## Status: pre-alpha

## Principles

1. [HATEOAS](https://htmx.org/essays/hateoas/)
1. All views are partials
1. All partials are accessible by route.
1. All partials produce html, or nothing.
1. Partials resolve to custom element tag names, with optional custom attributes, and are re-usable, similar to components.
1. Partials written in typescript/javascript and/or html
1. Bun is runtime.
1. Single back-end.
1. No apis.
1. No JSX.

## Goals

1. Extremely fast implementation of prototypes.
1. Common integrations provided, opt-in.
    1. Htmx w/ SSE
    1. Alpine
    1. Tailwind
    1. Fontsource
1. Easy plugin interface for further integrations.

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

Now, start dropping files in the `view` directory.

## Partials

Partials are indicated with the extension `.part`.  Partials consist of both script and html.  You may start the file with some script, but as soon as a newline followed by a **tag** or **docytype** is encountered, html will be assumed from then on.

Example:

```
const a = 1;
const b: string = "b";

<div>{a}</div>
<div>{b}</div>
```

Partials will be resolved into tagnames based on their path.

Examples:
- `/view/index.part` → `<root />`
- `/view/todo.part` → `<todo />`
- `/view/todo/list.part` → `<todo-list />`

These tags may be referenced in other partials.

Tag attributes are passed in as attributes normally are, and are available in the script.  If you include an interface, the types will be properly coerced.

Example:

```
interface Attributes {
    page: number;
}

// Available in the script section on the Attributes object.
console.log(Attributes.page);

<div>{typeof page}</div>

<!-- Output:
    <div>number</div>
-->
```

Attributes can also be passed in if the partial/tag is loaded via GET:

`GET /todo?id=1`

More documentation is in the works.
