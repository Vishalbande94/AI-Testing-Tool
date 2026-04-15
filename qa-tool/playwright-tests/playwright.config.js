// @ts-check
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir:       './tests',
  timeout:       25000,
  retries:       0,
  workers:       3,
  fullyParallel: true,

  reporter: [
    ['json',  { outputFile: 'test-results/results.json' }],
    ['html',  { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
  ],

  use: {
    baseURL:           process.env.BASE_URL || 'http://localhost:3000',
    screenshot:        'only-on-failure',
    video:             'off',
    trace:             'off',
    actionTimeout:     10000,
    navigationTimeout: 15000,
    ignoreHTTPSErrors: true,
  },

  projects: [
    {
      name:    'chromium',
      use:     { ...devices['Desktop Chrome'] },
    },
  ],

  outputDir:   'test-results/artifacts',
  preserveOutput: 'failures-only',
});
