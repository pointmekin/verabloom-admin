import type { SessionConfig } from '@tanstack/react-start/server'

const THIRTY_DAYS_IN_SECONDS = 60 * 60 * 24 * 30

export const SESSION_COOKIE_NAME = 'verabloom-admin'

export function createSessionConfig(
  secret: string,
  environment = process.env.NODE_ENV,
): SessionConfig {
  if (secret.length < 32) {
    throw new Error('SESSION_SECRET must contain at least 32 characters')
  }

  return {
    name: SESSION_COOKIE_NAME,
    password: secret,
    maxAge: THIRTY_DAYS_IN_SECONDS,
    cookie: {
      httpOnly: true,
      // "strict" drops the cookie on a top-level navigation that starts outside
      // the site, such as an iOS home-screen shortcut or a shared link. The
      // server then writes a new empty session and the admin loses the login.
      sameSite: 'lax',
      secure: environment === 'production',
      path: '/',
    },
  }
}
