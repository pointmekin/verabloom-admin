import { describe, expect, it } from 'vitest'

import { createSessionConfig } from './session-config'

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
        httpOnly: true,
        sameSite: 'lax',
        secure: true,
        path: '/',
      },
    })
  })
})
