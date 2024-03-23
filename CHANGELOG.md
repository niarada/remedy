# Changelog

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
