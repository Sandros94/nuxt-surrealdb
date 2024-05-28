# Nuxt SurrealDB

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]
[![Nuxt][nuxt-src]][nuxt-href]

A Nuxt module aimed to simplify the use of SurrealDB.

- [✨ &nbsp;Release Notes](/CHANGELOG.md)
<!-- - [🏀 Online playground](https://stackblitz.com/github/sandros94/nuxt-surrealdb?file=playground%2Fapp.vue) -->
<!-- - [📖 &nbsp;Documentation](https://example.com) -->

## WIP

This is still under development and not suitable for production use. Expect breaking changes.
There are no docs atm, refer to the [playground](/playground/app.vue) or the [source code](/src/).

## Features

<!-- Highlight some of the features your module provide here -->
- 🚀 &nbsp;Custom built-in `$surrealFetch` and `useSurrealFetch`.

## Roadmap

- [x] custom fetch plugin and composable.
- [ ] on PAR with official [SurrealDB Rest integration](https://surrealdb.com/docs/surrealdb/integration/http).
- [ ] auth support.
- [ ] custom websocket composable.
- [ ] on PAR with official [SurrealDB RPC integration](https://surrealdb.com/docs/surrealdb/integration/rpc) via Websockets.

## Quick Setup

Install the module to your Nuxt application with one command:

```bash
npx nuxi module add nuxt-surrealdb
```

That's it! You can now use Nuxt SurrealDB in your Nuxt app ✨


## Contribution

<details>
  <summary>Local development</summary>
  
  ```bash
  # Install dependencies
  npm install
  
  # Generate type stubs
  npm run dev:prepare
  
  # Develop with the playground
  npm run dev
  
  # Build the playground
  npm run dev:build
  
  # Run ESLint
  npm run lint
  
  # Run Vitest
  npm run test
  npm run test:watch
  
  # Release new version
  npm run release
  ```

</details>


<!-- Badges -->
[npm-version-src]: https://img.shields.io/npm/v/nuxt-surrealdb/latest.svg?style=flat&colorA=020420&colorB=00DC82
[npm-version-href]: https://npmjs.com/package/nuxt-surrealdb

[npm-downloads-src]: https://img.shields.io/npm/dm/nuxt-surrealdb.svg?style=flat&colorA=020420&colorB=00DC82
[npm-downloads-href]: https://npmjs.com/package/nuxt-surrealdb

[license-src]: https://img.shields.io/npm/l/nuxt-surrealdb.svg?style=flat&colorA=020420&colorB=00DC82
[license-href]: https://npmjs.com/package/nuxt-surrealdb

[nuxt-src]: https://img.shields.io/badge/Nuxt-020420?logo=nuxt.js
[nuxt-href]: https://nuxt.com
