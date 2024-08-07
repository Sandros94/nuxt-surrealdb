// The following nitropack import is from https://github.com/nuxt/module-builder/issues/141#issuecomment-2078248248
import type {} from 'nitropack'
import type { PublicRuntimeConfig } from 'nuxt/schema'
import type { FetchOptions, ResponseType } from 'ofetch'
import { ofetch } from 'ofetch'
import { textToBase64 } from 'undio'

import type { DatabasePreset, DatabasePresetKeys, Overrides, RpcRequest } from './types'
import { createError, defineNuxtPlugin, useSurrealAuth, useSurrealDatabases } from '#imports'

export default defineNuxtPlugin(async ({ $config }) => {
  const {
    defaultDatabase,
    auth: { database: authDatabase },
  } = $config.public.surrealdb
  const databases = useSurrealDatabases()
  const defaultDB = databases[defaultDatabase as DatabasePresetKeys] as DatabasePreset
  const { token: userAuth, session } = useSurrealAuth()

  const authToken = authTokenFn(defaultDB.auth)

  function authTokenFn(dbAuth: DatabasePreset['auth']) {
    if (!dbAuth) return undefined
    if (typeof dbAuth === 'string') {
      return `Bearer ${dbAuth}`
    }
    else {
      return `Basic ${textToBase64(`${dbAuth.user}:${dbAuth.pass}`, { dataURL: false })}`
    }
  }

  const surrealFetch = ofetch.create({
    baseURL: defaultDB.host,
    onRequest({ options }) {
      options.headers = options.headers || {}

      // @ts-expect-error KV header type missing
      if (defaultDB.KV && options.headers['surreal-KV'] === undefined) {
        // @ts-expect-error KV header type missing
        options.headers['surreal-KV'] = defaultDB.KV
      }
      // @ts-expect-error NS header type missing
      if (defaultDB.NS && options.headers['surreal-NS'] === undefined) {
        // @ts-expect-error NS header type missing
        options.headers['surreal-NS'] = defaultDB.NS
      }
      // @ts-expect-error DB header type missing
      if (defaultDB.DB && options.headers['surreal-DB'] === undefined) {
        // @ts-expect-error DB header type missing
        options.headers['surreal-DB'] = defaultDB.DB
      }
      // @ts-expect-error Authorization header type missing
      if (authToken && !userAuth.value && !options.headers.Authorization) {
        // @ts-expect-error Authorization header type missing
        options.headers.Authorization = authToken
      }
      // @ts-expect-error Authorization header type missing
      else if (userAuth.value && !options.headers.Authorization) {
        // @ts-expect-error Authorization header type missing
        options.headers.Authorization = `Bearer ${userAuth.value}`
      }
    },
  })

  function surrealFetchOptionsOverride<
    R extends ResponseType = ResponseType,
  >(
    overrides?: Overrides,
    defaults?: Pick<FetchOptions<R>, 'headers'>,
  ) {
    const {
      database,
      token,
    } = overrides || {}

    const headers = defaults?.headers as Record<string, string> || {}
    let db: DatabasePreset | undefined = undefined
    let baseURL: string | undefined = undefined
    let dbAuth = authToken

    if (database !== undefined) {
      if (typeof database !== 'string' && typeof database !== 'number' && typeof database !== 'symbol') {
        db = database
      }
      else {
        db = databases[database]
      }
      if (db.host) {
        baseURL = db.host
      }
      if (db.KV) {
        headers['surreal-KV'] = db.KV
      }
      if (db.NS) {
        headers['surreal-NS'] = db.NS
      }
      if (db.DB) {
        headers['surreal-DB'] = db.DB
      }
      if (db.auth && token !== false) {
        dbAuth = authTokenFn(db.auth)
      }
    }

    if (token !== false) {
      if (token === true && dbAuth !== undefined) {
        headers.Authorization = dbAuth
      }
      else if (typeof token === 'string' || typeof token === 'object') {
        const _token = authTokenFn(token)
        _token !== undefined && (headers.Authorization = _token)
      }
      else {
        const _token = userAuth.value ? `Bearer ${userAuth.value}` : dbAuth
        _token !== undefined && (headers.Authorization = _token)
      }
    }

    return {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...headers,
      },
      ...(baseURL !== undefined && { baseURL }),
    }
  }

  function surrealRPC<T = any>(req: RpcRequest<T>, ovr?: Overrides): Promise<T> {
    let id = 0

    return surrealFetch<T>('rpc', {
      ...surrealFetchOptionsOverride(ovr),
      onResponse({ response }) {
        if (response.status === 200 && response._data.error) {
          throw createError({
            statusCode: response._data.error.code,
            message: response._data.error.message,
          })
        }
        else if (response.status === 200) {
          response._data = response._data.result
        }
      },
      method: 'POST',
      body: {
        id: id++,
        ...req,
      },
    })
  }

  if (userAuth.value && !session.value.user && authDatabase !== false as false | string) {
    const user = await surrealRPC({
      method: 'info',
    }, {
      database: authDatabase as keyof PublicRuntimeConfig['surrealdb']['databases'],
    })
    if (user) {
      session.value.user = user
    }
  }

  return {
    provide: {
      surrealFetch,
      surrealFetchOptionsOverride,
      surrealRPC,
    },
  }
})
