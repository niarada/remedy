# Changelog

## [0.3.5] = 2024-03-27
### Changed
- Compress: Moved to feature

## [0.3.4] = 2024-03-26
### Changed
- Markdown: Configurable theme and code highlight languages.
- Markdown: Added attrs, anchors, and toc plugins.
- Tailwind: Remove the empty default css embed, user must provide their own css.
- Tailwind: Added nesting plugin.
- Extension: Update workspace settings to use tailwindcss in css files.

## [0.3.3] = 2024-03-26

## [0.3.2] = 2024-03-25
### Changed
- Features: Partials and Markdowns now implemented as features.

## [0.3.1] = 2024-03-25
### Added
- Features: Configurable through factory factory.

### Fixed
- Features: Image feature was missing some imports.
- Compression: Added whitelist of mime types to compress.

## [0.3.0] = 2024-03-25
### Removed
- Project: Removed moonrepo

## [0.2.18] = 2024-03-24
### Added
- Project: Added moonrepo

### Changed
- Project: Reorganized repository structure.
- Docs: Updated features docs.

## [0.2.17] - 2024-03-22
### Changed
- Image: Switched to sharp for image processing.
- Extension: Rewrote tmLanguage from scratch.
- Docs: Rewrote syntax highlight theme from scratch.

## [0.2.16] - 2024-03-22
### Added
- Server: Added image feature for image optimization.
- Server: Async transformations.

### Fixed
- Features: Fixed some hardcoded references to `public` directory.
- Templates: Empty attributes will have their value part removed.

## [0.2.15] - 2024-03-22
### Added
- Server: Will create a remedy.config.ts file on start.
- Server: Added client typescript feature and bundling.
### Changed
- Server: Renamed options.ts -> remedy.config.ts
- Extension: Read remedy.config.ts before deciding to write to {workspace}/.vscode/settings.json
### Fixed
- Server: Non-valid extensions no longer considered for tag lookups. (#3)
- Server: Requests for '/index' will no longer double wrap the root layout.


## [0.2.14] - 2024-03-21
### Added
- Features: Added AlpineJS.
### Changed
- Lexer: Better syntax error logging.


## [0.2.13] - 2024-03-21
### Fixed
- Extension: Fixed template formatting and highlighting.


## [0.2.12] - 2024-03-21
### Changed
- Templates: Tags treated as "opaque" are now `<code>`, `<script>` and `<style>`.
- Templates: Cleaned up some error output.
- Templates: If expressions don't evaluate, output their code instead.
