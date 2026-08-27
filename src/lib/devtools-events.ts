import { EventClient } from '@tanstack/devtools-event-client'

import type { Locale } from '#/lib/i18n'

/**
 * Typed events for the Verabloom devtools panel. The event client is a no-op
 * outside development, so call sites do not need an environment check.
 */
export interface VerabloomDevtoolsEventMap {
  'locale-change': { locale: Locale; at: number }
}

export const VERABLOOM_DEVTOOLS_PLUGIN_ID = 'verabloom'

export const verabloomDevtoolsEvents =
  new EventClient<VerabloomDevtoolsEventMap>({
    pluginId: VERABLOOM_DEVTOOLS_PLUGIN_ID,
  })
