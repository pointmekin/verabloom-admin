import { useEffect, useState } from 'react'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'

import {
  VERABLOOM_DEVTOOLS_PLUGIN_ID,
  verabloomDevtoolsEvents,
} from '#/lib/devtools-events'
import type { VerabloomDevtoolsEventMap } from '#/lib/devtools-events'

const MAX_LOCALE_EVENTS = 20

type LocaleChange = VerabloomDevtoolsEventMap['locale-change']

/**
 * Product panel for Verabloom. It renders inside the devtools shell, outside
 * the application providers, so it reads state from typed events only.
 */
function VerabloomPanel() {
  const [localeChanges, setLocaleChanges] = useState<Array<LocaleChange>>([])

  useEffect(
    () =>
      verabloomDevtoolsEvents.on('locale-change', (event) => {
        setLocaleChanges((current) =>
          [event.payload, ...current].slice(0, MAX_LOCALE_EVENTS),
        )
      }),
    [],
  )

  return (
    <div style={{ padding: '12px', fontSize: '12px', lineHeight: 1.6 }}>
      <h3 style={{ fontWeight: 600, marginBottom: '8px' }}>Locale changes</h3>
      {localeChanges.length === 0 ? (
        <p>No locale change yet.</p>
      ) : (
        <ol style={{ display: 'grid', gap: '4px' }}>
          {localeChanges.map((change) => (
            <li key={change.at}>
              <code>{change.locale}</code>{' '}
              {new Date(change.at).toLocaleTimeString()}
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

export function AppDevtools() {
  return (
    <TanStackDevtools
      plugins={[
        {
          id: 'tanstack-router',
          name: 'TanStack Router',
          render: <TanStackRouterDevtoolsPanel />,
        },
        {
          id: VERABLOOM_DEVTOOLS_PLUGIN_ID,
          name: 'Verabloom',
          render: <VerabloomPanel />,
        },
      ]}
    />
  )
}
