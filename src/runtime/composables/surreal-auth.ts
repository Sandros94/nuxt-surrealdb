import type {
  DatabasePreset,
  DatabasePresetKeys,
  UserSession,
} from '#surrealdb/types/index'

import {
  computed,
  createError,
  useCookie,
  useRuntimeConfig,
  useState,
  useSurrealDB,
} from '#imports'

export function useSurrealAuth(database?: DatabasePresetKeys) {
  const {
    databases,
    auth: {
      adminMaxAge,
      database: authDb,
      sessionName,
      cookieName,
      sameSite,
    },
  } = useRuntimeConfig().public.surrealdb
  const db = databases[database || authDb as DatabasePresetKeys] as DatabasePreset

  const {
    $authenticate,
    $info,
    $invalidate,
    $query,
    $signin,
    $signup,
  } = useSurrealDB({ database: db })

  const session = useState<UserSession>(sessionName, () => ({}))

  // TODO: Handle token maxAge update aftert a reAuthenticate
  const setToken = (unixTimestamp?: number) => useCookie(cookieName, {
    ...(unixTimestamp && { expires: (new Date(unixTimestamp * 1000)) }),
    sameSite: (sameSite as boolean | 'lax' | 'strict' | 'none'),
    secure: !import.meta.dev,
  })
  const token = setToken()

  // authenticate
  async function reAuthenticate() {
    if (!token.value) throw createError({ statusCode: 401, message: 'Unauthorized' })
    await $authenticate(token.value)
    await refreshInfo()
  }

  async function getSessionExp(authToken?: string) {
    const _token = authToken || token.value
    if (!_token) throw createError({ statusCode: 401, message: 'Unauthorized' })
    return (
      await $query<
        { exp: number | 'NONE' | null }
      >('SELECT exp FROM $session;', undefined, { token: _token })
    )[0].result[0]
  }

  // info
  async function refreshInfo(authToken?: string) {
    const _token = authToken || token.value
    if (!_token) throw createError({ statusCode: 401, message: 'Unauthorized' })
    const result = await $info<UserSession['user']>({ token: _token })
    if (!result) return // Admin users don't have user info
    session.value.user = result
  }

  // invalidate
  async function invalidate(authToken?: string) {
    const _token = authToken || token.value
    if (!_token) throw createError({ statusCode: 401, message: 'Unauthorized' })
    await $invalidate({ token: _token })
      .then(() => {
        token.value = null
        session.value = {}
      })
  }

  // signin
  async function signin(credentials: Record<string, any>, o: { admin?: boolean } = {}) {
    const { NS, DB, SC, AC } = db
    if ((!NS || !DB) && !o.admin) throw createError({ statusCode: 500, message: 'Sign In: Missing database preset' })
    const SC_AC = _userScope('Sign In: Missing either SC/AC', SC, AC)

    const result = await $signin({
      ...credentials,
      ...(!o.admin && { NS, DB, ...SC_AC }),
    })
    if (result) {
      await getSessionExp(result).then(async ({ exp }) => {
        if (!exp) throw createError({ statusCode: 401, message: 'User is not authenticated' })
        else if (exp === 'NONE') {
          setToken(adminMaxAge).value = result
          await refreshInfo(result)
        }
        else {
          setToken(exp).value = result
          await refreshInfo(result)
        }
      })
    }
  }

  // signup
  async function signup(credentials: Record<string, any>) {
    const { NS, DB, SC, AC } = db
    if (!NS || !DB) throw createError({ statusCode: 500, message: 'Sign Up: Missing database preset' })
    const SC_AC = _userScope('Sign Up: Missing either SC/AC', SC, AC)

    const result = await $signup({
      ...credentials,
      NS,
      DB,
      ...SC_AC,
    })
    if (result) {
      await getSessionExp(result).then(async ({ exp }) => {
        if (!exp) throw createError({ statusCode: 401, message: 'User is not authenticated' })
        else {
          // Signup users cannot be admins
          setToken(exp as number).value = result
          await refreshInfo(result)
        }
      })
    }
  }

  // TODO: better handle SC/AC
  function _userScope(message: string, SC?: string, AC?: string): { SC: string }
  function _userScope(message: string, SC?: string, AC?: string): { AC: string }
  function _userScope(message: string, SC?: string, AC?: string): { SC: string } | { AC: string } {
    if (AC) return { AC }
    else if (SC) return { SC }
    throw createError({ statusCode: 500, message })
  }

  return {
    getSessionExp,
    isAuthenticated: computed(() => Boolean(session.value.user)),
    invalidate,
    reAuthenticate,
    session,
    signin,
    signout: invalidate,
    signup,
    token,
    refreshInfo,
    user: computed(() => session.value.user || null),
  }
}
