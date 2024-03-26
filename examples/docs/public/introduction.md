${toc}

# Introduction

**remedy** is a *Hypermedia Server*.

## Installation

**remedy** requires a [bun](https://bun.sh), so make sure that's installed first.

### Quick start

If you want to quickly test out **remedy**, find a cozy spot and run:

```sh
bunx @niarada/remedy
```

This will create a `public` folder, and a `remedy.config.ts` file at your location.

Anything you place in the `public` folder will be served by **remedy**.

### Official install

For a more lasting and typical project setup, see here:

```sh
mkdir my-project
cd my-project
echo "{}" > package.json
bun add @niarada/remedy
```

Start the server:

```sh
bunx remedy
```

This will, as in the quickstart, create a `remedy.config.ts` file, and a `public` folder.

You may elect to stop the server and make whatever changes you need to the config file before continuing.
