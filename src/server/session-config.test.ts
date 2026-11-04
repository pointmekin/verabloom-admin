import { describe, expect, it } from 'vitest'

import { createSessionConfig, shouldRefreshSession } from './session-config'

describe('admin session refresh', () => {
  const now = Date.UTC(2026, 10, 4)
  const hour = 1000 * 60 * 60

  it('keeps a session that was issued less than a day ago', () => {
    expect(shouldRefreshSession(now - 23 * hour, now)).toBe(false)
  })

  it('renews a session that was issued a day ago or more', () => {
    expect(shouldRefreshSession(now - 24 * hour, now)).toBe(true)
    expect(shouldRefreshSession(now - 20 * 24 * hour, now)).toBe(true)
  })
})

describe('admin session cookie', () => {
  it('is persistent and secure in production', () => {
    const config = createSessionConfig(
      'a-production-secret-that-is-at-least-32-characters',
      'production',
    )

    expect(config).toMatchObject({
      name: 'verabloom-admin',
      maxAge: 60 * 60 * 24 * 30,
      cookie: {
        maxAge: 60 * 60 * 24 * 30,
        httpOnly: true,
        sameSite: 'lax',
        secure: true,
        path: '/',
      },
    })
  })
})
