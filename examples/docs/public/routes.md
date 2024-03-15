# Routes

Routing in **remedy** is file based.  Every partial that is not a layout (i.e. an index) generates a tag and *a routable path.*

Consider this directory structure, and the tags it generates:

```
Path                        Tag
------------------------    --------------------
public/
    index.part              (root-layout)
    alpha.part              alpha
    alpha/
        index.part          (alpha-layout)
        one.part            alpha-one
        nu/
            zeta.part       alpha-nu-zeta
```

The directory structure also determines layout composition.  Each directory can specify an `index.part` that will be used as the layout at that level.  Layouts nest.  Notice that partials at the same level, and with the same name as a directory, are laid out under that directory.

The above structure sets up the following routes, and their layout composition:

```
Route                   Composition
--------------------    ------------------------------------
/                       (root-layout) -> (no content)
/alpha                  (root-layout) -> (alpha-layout) -> alpha
/alpha/one              (root-layout) -> (alpha-layout) -> alpha-one
/alpha/nu/zeta          (root-layout) -> (alpha-layout) -> alpha-nu-zeta
```

As the root index is a layout, and not a page, the way you would get content such as the home page into it is by using a slot with a default.

```
/**
 * public/index.part
 */

 <div>
    <slot><my-home /></slot>
 </div>
```

 Loading any other route will slot the appropriate content for that page.  For example, loading `/alpha` will place `<alpha />` as the slot content for the index.

## Endpoints

Most partials are accessible from an HTTP client by their route.  The only exceptions are layouts other than the root layout.

For example:

`public/hello/world.part` is accessible vi `GET /hello/world` (or POST, PATCH, etc);

If you pass a query string, or post a form, that data will be available in a special object called `$context.form`

(For more on the `$context` object, see [Context](/context))

## Dynamic Routes

Dynamic routes are made possible by naming any directory or partial with brackets.

Some examples:

- `public/user/[id].part`
- `public/user/[id]/edit.part`

If no specifically named route exists, the url will be matched against any dynamic routes and find the first one that applies.

Within your partial, the variable will be made available as an attribute.
