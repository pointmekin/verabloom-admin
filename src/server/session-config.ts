import type { SessionConfig } from '@tanstack/react-start/server'

const THIRTY_DAYS_IN_SECONDS = 60 * 60 * 24 * 30

export const SESSION_COOKIE_NAME = 'verabloom-admin'

// The session library measures expiry from the moment the session is created
// and never extends it. Without a refresh, an admin who uses the app every day
// is still logged out 30 days after the login. Re-issue the cookie when it is
// older than this, so the 30 days count from the last use.
const REFRESH_AFTER_MS = 1000 * 60 * 60 * 24

export function shouldRefreshSession(createdAt: number, now = Date.now()) {
  return now - createdAt >= REFRESH_AFTER_MS
}

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
      // The library sets only an absolute "Expires" date by default. The
      // browser compares that date with the device clock, so a phone with a
      // wrong clock drops the cookie early. "Max-Age" counts from receipt and
      // takes precedence over "Expires".
      maxAge: THIRTY_DAYS_IN_SECONDS,
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
