import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from '@tanstack/react-router'

import { LocaleProvider } from '#/lib/i18n'
import { getLocaleFn } from '#/server/locale'
import appCss from '../styles.css?url'

export const Route = createRootRoute({
  beforeLoad: async () => ({ locale: await getLocaleFn() }),
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Verabloom',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  component: RootLayout,
  shellComponent: RootDocument,
})

function RootLayout() {
  const { locale } = Route.useRouteContext()
  return (
    <LocaleProvider initialLocale={locale}>
      <Outlet />
    </LocaleProvider>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}

        <Scripts />
      </body>
    </html>
  )
}
