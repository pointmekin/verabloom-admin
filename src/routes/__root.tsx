import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from '@tanstack/react-router'

import { AppDevtools } from '#/components/devtools'
import { ToastProvider } from '#/components/ui/toast'
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
      {
        rel: 'icon',
        href: '/favicon.ico',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '16x16',
        href: '/favicon-16x16.png',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '32x32',
        href: '/favicon-32x32.png',
      },
      {
        rel: 'apple-touch-icon',
        sizes: '180x180',
        href: '/apple-touch-icon.png',
      },
      {
        rel: 'manifest',
        href: '/site.webmanifest',
      },
    ],
  }),
  component: RootLayout,
  shellComponent: RootDocument,
})

function RootLayout() {
  const { locale } = Route.useRouteContext()
  return (
    <ToastProvider>
      <LocaleProvider initialLocale={locale}>
        <Outlet />
      </LocaleProvider>
    </ToastProvider>
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

        <AppDevtools />
        <Scripts />
      </body>
    </html>
  )
}
