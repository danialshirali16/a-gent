import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/ui',
  fullyParallel: false,
  workers: 1,
  timeout: 30000,
  expect: { timeout: 10000 },
  use: {
    baseURL: 'http://127.0.0.1:4410',
    channel: 'chrome',
    headless: true,
    viewport: { width: 1280, height: 860 },
  },
  webServer: {
    command: 'node scripts/ui-test-server.mjs',
    url: 'http://127.0.0.1:4410',
    reuseExistingServer: false,
    timeout: 30000,
  },
});
