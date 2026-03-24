// @ts-check
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/performance',
  testMatch: '**/*.perf.js',
  fullyParallel: false,   // Sequential for accurate perf measurements
  retries: 0,
  workers: 1,
  timeout: 60000,
  reporter: [
    ['html', { outputFolder: 'performance-report', open: 'never' }],
    ['list']
  ],

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'off',
    screenshot: 'only-on-failure',
    // No throttling — raw performance of the app
    launchOptions: {
      args: ['--disable-extensions', '--disable-background-networking']
    }
  },

  projects: [
    {
      name: 'Chrome - Desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      }
    },
    {
      name: 'Chrome - Mobile',
      use: {
        ...devices['Pixel 5'],
      }
    }
  ],

  // Serve the insurance app locally before running tests
  webServer: {
    command: 'npx serve insurance-app -p 3000 --no-clipboard',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 15000
  }
});
