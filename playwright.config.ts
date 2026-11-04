import { defineConfig } from '@playwright/test';

const smokeURL = 'http://127.0.0.1:4410';
const visualURL = 'http://127.0.0.1:4411';
const accessibilityURL = 'http://127.0.0.1:4412';
const e2eURL = 'http://127.0.0.1:4413';

export default defineConfig({
  testDir: './tests/ui',
  fullyParallel: false,
  workers: 1,
  timeout: 30000,
  expect: { timeout: 10000 },
  use: {
    channel: 'chrome',
    headless: true,
    viewport: { width: 1280, height: 860 },
    reducedMotion: 'reduce',
  },
  projects: [
    {
      name: 'visual',
      testMatch: /visual\.spec\.ts/,
      use: { baseURL: visualURL },
    },
    {
      name: 'smoke',
      testMatch: /smoke\.spec\.ts/,
      use: { baseURL: smokeURL },
    },
    {
      name: 'accessibility',
      testMatch: /accessibility\.spec\.ts/,
      use: { baseURL: accessibilityURL },
    },
    {
      name: 'e2e',
      testMatch: /e2e\.spec\.ts/,
      use: { baseURL: e2eURL },
    },
  ],
  webServer: [
    {
      command: 'node scripts/ui-test-server.mjs 4410',
      url: smokeURL,
      reuseExistingServer: false,
      timeout: 30000,
    },
    {
      command: 'node scripts/ui-test-server.mjs 4411',
      url: visualURL,
      reuseExistingServer: false,
      timeout: 30000,
    },
    {
      command: 'node scripts/ui-test-server.mjs 4412',
      url: accessibilityURL,
      reuseExistingServer: false,
      timeout: 30000,
    },
    {
      command: 'node scripts/ui-test-server.mjs 4413',
      url: e2eURL,
      reuseExistingServer: false,
      timeout: 30000,
    },
  ],
});
