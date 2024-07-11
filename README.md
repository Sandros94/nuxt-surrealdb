![nuxt-surrealdb](/docs/public/nuxt-surrealdb-social-card.png)

# Nuxt SurrealDB

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]
[![Nuxt][nuxt-src]][nuxt-href]

A Nuxt module aimed to simplify the use of [SurrealDB](https://surrealdb.com).

- [✨ &nbsp;Release Notes](/CHANGELOG.md)
<!-- - [🏀 Online playground](https://stackblitz.com/github/sandros94/nuxt-surrealdb?file=playground%2Fapp.vue) -->
<!-- - [📖 &nbsp;Documentation](https://example.com) -->

> [!NOTE]
> There are no docs atm, please refer to the [playground](/playground/) or the [source code](/src/).

## Quick Setup

Install the module to your Nuxt application with one command:

```bash
npx nuxi module add nuxt-surrealdb
```

That's it! You can now edit your [default Database Preset](https://github.com/Sandros94/nuxt-surrealdb?tab=readme-ov-file#database-presets) and use Nuxt SurrealDB in your Nuxt app ✨

## Features

<!-- Highlight some of the features your module provide here -->
- 🚀&nbsp;Custom built-in `$surrealFetch` and `useSurrealFetch` (based on `$fetch` and `useFetch` respectively).
- 📦&nbsp;Custom Database Presets, to be able to use multiple Databases on a composable/per-function basis.
- ⚡️&nbsp;Built-in support for [RPC endpoint](https://surrealdb.com/docs/surrealdb/integration/rpc) via `$surrealRPC` and `useSurrealRPC`.
- 🏗️&nbsp;Built-in Nuxt server `useSurrealRPC` util with server-side private DB Presets for a private network communication with SurrealDB.
- 💡&nbsp;Each RPC method is mapped to a `useSurrealDB` exported function.
- 🌟&nbsp;Built-in support for Websocket communication with RPC methods using the `useSurrealWS` composable.

### Database Presets

It is possible to customize the `default` preset or define your own Database presets either via `nuxt.config.ts` or via `.env`.

> [!NOTE]
> When passing variables to a custom preset like `shop` below, it is important to initialize it as an empty object inside `nuxt.config.ts`

```dotenv
NUXT_PUBLIC_SURREALDB_DATABASES_SHOP_HOST="https://example.com"
NUXT_PUBLIC_SURREALDB_DATABASES_SHOP_WS="wss://example.com"
NUXT_PUBLIC_SURREALDB_DATABASES_SHOP_NS="surrealdb"
NUXT_PUBLIC_SURREALDB_DATABASES_SHOP_DB="docs"
NUXT_PUBLIC_SURREALDB_DATABASES_SHOP_SC="user"

# To add authentication server side (this does not override the client's token)
# As a Bearer
NUXT_SURREALDB_DATABASES_SHOP_AUTH="mySuperLongBearerToken"
# Or as an object
NUXT_SURREALDB_DATABASES_SHOP_AUTH_USER="root"
NUXT_SURREALDB_DATABASES_SHOP_AUTH_PASS="root"
```

```ts
export default defineNuxtConfig({
  modules: ['nuxt-surrealdb'],
  surrealdb: {
    databases: {
      crm: {
        host: 'https://crm.example.com',
        ws: 'wss://crm.example.com',
        NS: 'demo',
        DB: 'crm',

        // Auth examples exposed client side
        auth: 'mySuperLongBearerToken',
        auth: {
          user: 'root',
          pass: 'root'
        }
      },
      shop: {
        host: '', // initialize any property that will be set via `.env`
        ws: '',
        NS: '',
        DB: ''
      },
    },
    server: { // the following add auth only server side
      databases: {
        shop: {
          auth: '', // NUXT_SURREALDB_DATABASES_SHOP_AUTH
          auth: {
            user: '', // NUXT_SURREALDB_DATABASES_SHOP_AUTH_USER
            pass: '' // NUXT_SURREALDB_DATABASES_SHOP_AUTH_PASS
          }
        }
      }
    }
  },
  // ...
})
```

It is also possible to expand or change database properties server-side (like `server.databases.shop.auth` above). This becomes particularly useful for a more traditional database auth approach without exposing credentials client-side or to use a different `host` address in a private network.

Then, to use a database preset, you just have to set it within the last parameter of each main composable (functions destructured from `useSurrealDB` also support this override).

```ts
// all the functions destructured will be executed against the CRM database
const { query, select } = useSurrealDB({
  database: 'crm',
})

// only the following select will be made against the default database
const { data } = await select('products', {
  database: 'default',
})

// you could also define a one-time only preset
const { data } = await sql(
  'SELECT * FROM products WHERE price < $maxPrice;',
  { maxPrice: 500 },
  {
    database: {
      host: 'https://surrealdb.example.com',
      NS: 'demo',
      DB: 'shop',
    },
  },
)
```

> [!NOTE]
> If you are looking for using a particular db preset during development while another one for production, please use [`$development` and `$production` properties](https://nuxt.com/docs/getting-started/configuration#environment-overrides) within your `nuxt.config.ts`.

### RPC functions

The main `useSurrealDB` exports a number of functions that directly communicate with the RPC endpoint. Each function has two variants, one starts with `$` and one without. The first is based on `$surrealRPC`, that provides the plain function, while the latter uses `useSurrealRPC`, taking advantage of `useSurrealFetch` (and thus, [`useFetch`](https://nuxt.com/docs/api/composables/use-fetch)).

Here the full list:

```ts
const {
  authenticate, // $authenticate
  create,       // $create
  info,         // $info
  insert,       // $insert
  invalidate,   // $invalidate
  merge,        // $merge
  patch,        // $patch
  query,        // $query
  remove,       // $remove
  select,       // $select
  signin,       // $signin
  signup,       // $signup
  sql,          // $sql
  update,       // $update
  version,      // $version
} = useSurrealDB()
```

> [!NOTE]
> `sql` function is an alias for `query` while `version` uses its [HTTP endpoint](https://surrealdb.com/docs/surrealdb/integration/http#version).

### RPC Websocket

The `useSurrealWS` composable exposes a Websocket connection to handle live communication with SurrealDB. It uses `useWebsocket` from `@vueuse/core` under the hood, this means that SSR, auto-connect and auto-disconnect are handled automatically by default. Data is Automatically parsed from `JSON` to `string` both in input as well in `data` return.
If available, upon Websocket connection, it will any Auth token from a prior user login. Database Presets and Websocket options are available as main arguments of the composable.

Below a list of the main functions available from the Websocket composable:

```ts
const {
  authenticate,
  close,
  create,
  data,
  set,  // Surreal's `let`
  info,
  insert,
  invalidate,
  kill,
  live,
  merge,
  open,
  patch,
  query,
  remove,
  rpc,
  select,
  send,
  signin,
  signup,
  sql,     // alias for query
  status,
  unset,
  update,
  use,
  ws,
} = useSurrealWS()
```

> [!WARNING]
> Currently while the `signin` and `signup` functions are avaible, they are limited to the current Websocket connection. Therefore if auth is required outside of that websocket connection it is advised to use the main `useSurrealAuth` composable for `SCOPE` user authentication.

---

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
