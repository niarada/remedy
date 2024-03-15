**remedy** is a *Hypermedia Server* hosted on the [bun](https://bun.sh) runtime with [htmx](https://htmx.org) as a first-class integration.  It enters the fray, along-side other like-minded  efforts, to help *remedy* the ailment that is modern web complexity.


### Status: alpha

This project is still in early development.  Master branch may or may not work as changes come in quickly.  This should settle down in a few weeks and regular non-breaking builds will happen.

## Run an example

```sh
git clone https://github.com/niarada/remedy
cd remedy
bun i
bun examples:todo
```

## Start fresh

```sh
mkdir my-project && cd my-project
bunx @niarada/remedy
```

Now, start dropping files in the `public` directory.

## Partials

Partials are indicated with the extension `.part`.  Partials consist of both script and html.  You may start the file with some script, but as soon as a newline followed by a **tag** is encountered, html will be assumed from then on.

Example:

```
const a = 1;
const b: string = "b";

<div>{a}</div>
<div>{b}</div>
```

Partials will be resolved into tagnames based on their path.

Examples:
- `public/todo.part` → `<todo />`
- `public/todo/list.part` → `<todo-list />`

These tags may be referenced in other partials.

`index.part` files are **layouts**.

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
