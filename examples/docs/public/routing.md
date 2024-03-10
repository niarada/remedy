# Routing

Routing in htmx-bun is file-system based.  Any Partial or Markdown file placed under the `public`
becomes a routable path.

Consider this directory structure, and the tags it generates:

```
Path                        Tag
------------------------    --------------------
public/
    layout.part             layout
    index.part              root
    alpha/
        layout.part         alpha-layout
        index.part          alpha
        one.part            alpha-one
        two.part            alpha-two
    beta/
        layout.part         beta-layout
        three.part          beta-three
        four.part           beta-four
    gamma/
        index.part          gamma
        five.part           gamma-five
        spirit/
            joy.part        gamma-spirit-joy
```

This sets up the following routes, and their composition:

```
Route                   Composition
--------------------    ------------------------------------
/                       layout -> root
/alpha                  layout -> alpha-layout -> alpha
/alpha/one              layout -> alpha-layout -> alpha-one
/alpha/two              layout -> alpha-layout -> alpha-two
/beta/three             layout -> beta-layout -> beta-three
/beta/four              layout -> beta-layout -> beta-four
/gamma                  layout -> gamma
/gamma/five             layout -> gamma-five
/gamma/spirit/joy       layout -> gamma-spirit-joy
```
