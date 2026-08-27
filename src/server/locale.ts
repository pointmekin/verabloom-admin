import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import { locales } from '#/lib/i18n'
import type { Locale } from '#/lib/i18n'

const localeSchema = z.enum(locales)

export const getLocaleFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { readLocaleCookie } = await import('./locale-cookie.server')
    const result = localeSchema.safeParse(readLocaleCookie())
    return (result.success ? result.data : 'th') satisfies Locale
  },
)

export const setLocaleFn = createServerFn({ method: 'POST' })
  .validator(localeSchema)
  .handler(async ({ data }) => {
    const { writeLocaleCookie } = await import('./locale-cookie.server')
    writeLocaleCookie(data)
    return data
  })
