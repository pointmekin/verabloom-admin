import { getRequiredAdminFn } from '#/server/auth'

type AdminCheck = Awaited<ReturnType<typeof getRequiredAdminFn>>

let browserCheck: Promise<AdminCheck> | null = null

/**
 * Router `beforeLoad` runs on every navigation, so a direct server call adds a
 * round trip before each admin page renders. Keep the first browser result and
 * reuse it; the server functions behind every admin loader and mutation still
 * enforce the session on their own.
 */
export function requireAdmin() {
  if (typeof document === 'undefined') {
    return getRequiredAdminFn()
  }
  if (!browserCheck) {
    browserCheck = getRequiredAdminFn()
    browserCheck.catch(() => {
      browserCheck = null
    })
  }
  return browserCheck
}

export function forgetAdminCheck() {
  browserCheck = null
}
