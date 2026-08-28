import { getCookie, setCookie } from '@tanstack/react-start/server'

import { localeCookieName } from '#/lib/i18n'
import type { Locale } from '#/lib/i18n'

export function readLocaleCookie() {
  return getCookie(localeCookieName)
}

export function writeLocaleCookie(locale: Locale) {
  setCookie(localeCookieName, locale, {
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })
}
