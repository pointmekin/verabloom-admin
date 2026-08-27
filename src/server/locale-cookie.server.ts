import { getCookie, setCookie } from '@tanstack/react-start/server'

import type { Locale } from '#/lib/i18n'

export function readLocaleCookie() {
  return getCookie('verabloom-locale')
}

export function writeLocaleCookie(locale: Locale) {
  setCookie('verabloom-locale', locale, {
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })
}
