${toc}

# Remedy Templates

A Remedy template can contain both TypeScript/JavaScript and HTML, or one or the other.  If both are included, the script must come first, but otherwise there is no syntactic demarcation.  When the first HTML tag is encountered, HTML will be assumed from then on.

### Scripting

The script section is full-featured TypeScript or JavaScript and you may import modules, access databases, whatever.  You'll want to reference the available [$context](/context) object to access form data, request method, cookies, and other things.

### Composition

Templates can include other paritals by tag, as explained [here](/partials).

### Tag syntax

Element tags (including partials) without contents may be self closed (`<tag />`).  Tags that are considered "void" tags by the HTML spec can omit the slash (`<link>`).

### Expressions

Anything between a `{` and `}` is considered an expression.  Expressions are written in TypeScript or JavaScript, and whatever they evaluate to will be converted to a string and rendered with the rest of the template.

**Any variable that is in the scope of the code above the template will be available to expressions.**

For example:

```rx
const name = "niarada";

<h1>Hello, {name}</h1>
```

will result in:

```rx
<h1>Hello, niarada</h1>
```

### Code blocks

Any section of the template bounded by `<code> ... </code>` tags will be ignored by the template engine so as to allow for complex content that **remedy** may not understand.

### Flow control

**remedy** provides some special element attributes to allow for some amount of flow control.

#### rx-each & rx-as

Use these to repeat an element for each item in the provided array.  `rx-as` is optional for when you don't need to use the value and simply want to repeat the element.

For example:

```rx
const items = [
    { name: "love" },
    { name: "joy" },
    { name: "peace" },
];

<li rx-each={items} rx-as="item">{item.name}</li>
```

will result in:

```rx
<li>love</li>
<li>joy</li>
<li>peace</li>
```

#### rx-when

Use this to only render the element if the provided expression evaluates to truthy.

For example:

```rx
const truthy = true;
const falsy = false;

<li rx-when={truthy}>love</li>
<li rx-when={falsy}>peace</li>
```

will result in:

```rx
<li>love</li>
```

#### rx-content

Sometimes you may need to evaluate an expression for insertion into an "opaque" tag.  Opaque tags are those that do not render expressions for their contents, they are: `<code>`, `<script>` and `<style>`.

You may use  `rx-content` to do this, and whatever is evaluated here will be appended to the contents of the tag.

### Class name helper

There is a small helper for rendering class names, to free one from using trinaries in the class attribute.  In the class attribute, prefix a name with the ¢ symbol (Option-4 on MacOS) to have it resolve if the scoped value is truthy.

For example:

```rx
const goodness = true;
const kindness = false;

<p class="¢goodness ¢kindness" />
```

will result in:

```rx
<p class="goodness" />
```
