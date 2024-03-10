# Integrations

**htmx-bun** is designed with a plugin layer that operates as middleware, known internally as `features`.

All can be configured in your `options.ts`.

## Enabled by default

- **dev**: file watching and hot refresh
- **static**: static asset delivery
- **htmx**: htmx support

## Disabled by default

- **sse**: htmx server-sent events support
- **tailwind**: tailwind support
- **fontawesome**: fontawesome free library
- **markdown**: markdown custom tag enabled
