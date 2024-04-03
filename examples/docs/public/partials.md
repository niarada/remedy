${toc}

# Partials

## Summary

Partials are composable and routeable generators of hypermedia, that is HTML.

They are implemented by features.  There are currently two built-in features that implement partials:

- [Remedy Templates](/templates)
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
