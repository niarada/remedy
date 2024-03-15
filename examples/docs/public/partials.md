# Partials

Partials are the *language* of **remedy**.  A partial can be divided into two sections, though neither is strictly required: the **action** and the **template**.  **Actions** are written in TypeScript of JavaScript, and occupy the top section of the partial.  **Templates** are written in HTML, and occupy the bottom section.

### An Example

```
/**
 * public/hello.part
 */

const message = "Hello, World!";

<div>
    {message}
</div>
```

Partials are so-called because they are re-usable.  This example file is called `hello.part`.  The remedy server will convert this partial into a custom tag for you, called `<hello>`.

You can then use it in another partial like this:

```
/**
 * public/salutation.part
 */

<div>
    <hello />
</div>
```

You can also pass in attributes.

```
/**
 * public/hello.part
 */

<div>
    Hello, {name}
</div>
```

```
/**
 * public/salutation.part
 */

<div>
    <hello name="Niara" />
</div>
```

Or contents:

```
/**
 * public/hello.part
 */

<div>
    Hello, <slot />
</div>
```

```
/**
 * public/salutation.part
 */

<div>
    <hello>Niara</hello>
</div>
```

If you use TypeScript, you can be clear about your attributes, and type them.

```
/**
 * public/hello.part
 */

interface Attributes {
    name: string;
    avidness: number;
}

<div>
    {"Hello ".repeat(avidness)}, {name}
</div>
```

Tag names are generated from the path of the partial file name.  Essentially, `/` are turned into `-`.

So, for a path such as `public/salutation/hello.part` the tag would be `<salutation-hello>`.

Now, this leads us into routing, so head over to the [next section](/routing).
