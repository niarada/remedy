# Introduction

**htmx-bun** is a *Hypermedia Server* hosted on the [Bun](https://bun.sh) runtime with [Htmx](https://htmx.org) as a first-class integration.

### Mission:

*Start from zero.*

#### Influences:

- [HATEOAS](https://htmx.org/essays/hateoas/)
- [Hypermedia Systems](https://hypermedia.systems/)

#### Basics:

When you start up `htmx-bun`, the only thing you get is a running server, and a public folder.

Put something in the public folder, and the server will serve it.

Some things you may put in the folder are special:

- *Markdown files (`.md`)*

   These will be turned into HTML.

- *Partial files (`.part`)*

   These consist of some script (TS or JS) at the top, and HTML at the bottom.  Or just script, or just HTML.

   In the HTML, curly braces **&lbrace; &rbrace;** are used to evaluate expressions, which are injected with the script scope, and any attributes..
