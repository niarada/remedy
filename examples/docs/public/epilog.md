#### References:

- [HATEOAS](https://htmx.org/essays/hateoas/)
- [Hypermedia Systems](https://hypermedia.systems/)




```

/**
 * public/todo/list.part
 */

// Action

const list = [{
    id: 1,
    title: "Milk",
}, {
    id: 2,
    title: "Butter",
}, {
    id: 3,
    title: "Eggs",
}];

<html lang="en">
<head>
    <meta charset="utf-8">
    <title>My App</title>
</head>
<body>
    <div id="app">
        <div hx-get="/partial" hx-trigger="load">Loading...</div>
    </div>
    <script src="/htmx.js"></script>
</body>
```



The server starts up, creating a `public` folder.

Anything you place in the `public` folder will be served up *statically*, with the following exceptions:

- **Partial files (`.part`)**

   *Partials* are so-named because they are represent some *part* of a full web page.

   Partials consist in some script (TypeScript or JavaScript) at the top and/or HTML at the bottom.

   Partials have [VSCode support](/editorsupport).

- **Markdown files (`.md`)**

   Markdown files will be converted  HTML.  They are, In fact, also partials.




   They are made available to each other by converting their file path into a custom HTML tag.

   They are also routeable.

   In the HTML, curly braces **&lbrace; &rbrace;** are used to evaluate expressions, which are injected with the script scope, and any attributes..
