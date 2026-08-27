import type { SessionConfig } from '@tanstack/react-start/server'

const THIRTY_DAYS_IN_SECONDS = 60 * 60 * 24 * 30

export function createSessionConfig(
  secret: string,
  environment = process.env.NODE_ENV,
): SessionConfig {
  if (secret.length < 32) {
    throw new Error('SESSION_SECRET must contain at least 32 characters')
  }

  return {
    name: 'verabloom-admin',
    password: secret,
    maxAge: THIRTY_DAYS_IN_SECONDS,
    cookie: {
      httpOnly: true,
      sameSite: 'strict',
      secure: environment === 'production',
      path: '/',
    },
  }
}
