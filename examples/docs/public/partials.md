${toc}

# Partials

## Summary

Partials are composable and routeable generators of hypermedia, that is HTML.

They are implemented by features.  There are currently two built-in features that implement partials:

- [Remedy Templates](/features#templates)
- [Markdown](/features#markdown)


<!-- The server exposes partials through two mechanisms:

- [Routing](/routing)
- [Composition](/composition)

Please take a look at those pages for details on each feature or concept. -->

## Usage

Let's say we have enabled the [template](/features#templates) feature (on by default), and placed a file called `user/status.rx` in our public directory.  (`rx` is the extension for Remedy templates.)

### Route

A route is now mapped to `/user/status` which will invoke the template feature with the source of that file.  If one passes query parameters, or posts a form to that route, those values will be made available to the partial through the [$context](/context) object.

### Composition

This has also made available a tag called `<user-status>`.  This tag may be used from other partials to include that partial within it.  For example, you might have a `user.rx` that looks like this:

```rx
<div>
    <user-status id="1"/>
</div>
```



### An Example

```rx
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

```rx
/**
 * public/salutation.part
 */

<div>
    <hello />
</div>
```

You can also pass in attributes.

```rx
/**
 * public/hello.part
 */

<div>
    Hello, {name}
</div>
```

```rx
/**
 * public/salutation.part
 */

<div>
    <hello name="Niara" />
</div>
```

Or contents:

```rx
/**
 * public/hello.part
 */

<div>
    Hello, <slot />
</div>
```

```rx
/**
 * public/salutation.part
 */

<div>
    <hello>Niara</hello>
</div>
```

If you use TypeScript, you can be clear about your attributes, and type them.

```rx
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

Now, this leads us into routing, so head over to the [next section](/routes).
