# Integrations

Also known as plugins or features.

**remedy** is designed to allow for easy integration with 3rd party libraries or custom plugins.  A process for community contributed integrations will be established at some point in the future.

All integrations can be enabled or disabled in [Configuration](/configuration).

### Enabled by default

#### dev

File watching and hot refresh.

#### static

Static asset delivery.

#### typescript

Typescript bundling for `<script src="...">` tags in the head.

### Disabled by default

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
