${toc}

# Introduction

**Remedy** is a *Hypermedia Server*.

## Summary

Remedy aims to provide a straight-forward server implementation for hypermedia systems, as described in the
book [Hypermedia Systems](https://hypermedia.systems).

If you want to get started right away, please head over to the [Quickstart](/quickstart).

## Motivation

Remedy was born out of a desire to establish a web development pattern that is centered around
[HATEOAS](https://htmx.org/essays/hateoas/).

Remedy's primary purpose in life is to spit out state-rich chunks of HTML, and those artificts that support it.

Additionally, we want to provide the lowest possible barrier to entry for *just getting moving* on any hypermedia project, following through with fast iteration and feature progression.

## Design Principles

Remedy is designed around a few main concepts that compose the core of the architecture.

### Features

Remedy *features* are an amalgamation of what other products call plugins, middleware, or integrations.  The Remedy core server does very little, handing off most of the work to activated features.  It is consequently very easy to extend Remedy by third parties.

These features can progressively add support for a variety of technologies as your project grows.  Please see the [Features](/features) section for more details.

### Partials & Presenters

In hypermedia systems, a common pattern is to load a complete page once, followed by loading or reloading smaller sections as the user begins to interact with it.

A *partial* is common term for a re-usable chunk of HTML.  Typically, they're just handy snippets that can be composed into larger pages.  Remedy elevates the concept a bit, by making them *routable*.

A supporting concept to partials is that of a *presenter*.  A presenter is any feature that produces HTML and elects to be part of the routing system.  When the router takes a request for a resource, it will examine the public directory for source files associated to the registered presenters, and have the resolved presenter render it.

This same process is used to look up partials from within the source documents of presenters, to enable composition.

Currently available presenters are [Remedy Templates](/templates) and [Markdown](/features#markdown).

Please also see [Routes](/routes), [Partials](/partials).
