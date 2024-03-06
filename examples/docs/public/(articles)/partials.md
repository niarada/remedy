# Partials

Partials are the meat of an **htmx-bun** app.  You might want to start with your index:

```
// index.part
<!doctype html>
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
