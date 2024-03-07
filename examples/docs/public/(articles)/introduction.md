# Introduction

**htmx-bun** is a *Hypermedia Server* hosted on the [Bun](https://bun.sh) runtime with [Htmx](https://htmx.org) as a first-class integration.

### Mission:

*Building web sites should be fast, fun, and uncomplicated.*

#### Influences:

1. [HATEOAS](https://htmx.org/essays/hateoas/)
1. [Hypermedia Systems](https://hypermedia.systems/)

#### Fundamentals:

(Hmm... views and whatnot should be re-represented as "Resources")


1. All views are partials
1. Partials can be loaded into other partials, unless they are a leaf type:
   - `.part` - Partial files can contain other partials through their <slot>
   - `.md` - Markdown files are leaf partials.
1. Partials are accessible by route.
1. Partials emit html, or nothing.
1. Partials are composable.
