import { defineConfig } from 'vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'
import { devtools } from '@tanstack/devtools-vite'

const config = defineConfig({
  plugins: [
    devtools({
      // Click an element in the devtools to open its source in the editor.
      injectSource: { enabled: true },
      // Client logs appear in the terminal and server logs in the browser.
      consolePiping: { enabled: true },
      enhancedLogs: { enabled: true },
      // Default: strip devtools imports and JSX from the production build.
      removeDevtoolsOnBuild: true,
    }),
    tailwindcss(),
    tanstackStart(),
    nitro({ preset: 'vercel' }),
    viteReact(),
  ],
})

export default config
