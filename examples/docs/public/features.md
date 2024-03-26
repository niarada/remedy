${toc}

# Features

Also known as plugins or integrations.

**remedy** is designed to allow for easy integration with 3rd party libraries or custom plugins.

All integrations can be enabled or disabled in [Configuration](/configuration).

### Enabled by default

#### refresh

File watching and hot refresh.

#### partial

Partial support.

#### markdown

Markdown support.

#### typescript

Typescript bundling for `<script src="...">` tags in the head.

#### static

Static asset delivery.

### Disabled by default

### image

Image optimization.

#### htmx

HTMX support.

#### sse

HTMX server-sent events support.

#### alpine

Alpine support.

#### tailwind

Tailwind support.

If this is enabled, a `tailwind.config.ts` will be created for you.  The **remedy** VSCode extension will automatically associate tailwind with **remedy** partials.

#### fontawesome

Fontawesome free library.

e.g. `<i class="fa-brands fa-github" />`
