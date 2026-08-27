import { defineConfig, devices } from '@playwright/test'

const port = 4317
const baseURL = `http://127.0.0.1:${port}`

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  use: {
    baseURL,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chromium', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command:
      'SESSION_SECRET=playwright-session-secret-at-least-32-characters ADMIN_EMAIL=admin@verabloom.test ADMIN_PASSWORD=verabloom-test-password npm run dev -- --host 127.0.0.1 --port 4317',
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
