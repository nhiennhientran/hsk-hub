import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  testIgnore: '**/release.spec.ts',
  workers: 1,
  retries: 0,
  timeout: 20_000,
  reporter: [['list'], ['json', { outputFile: '.repro-output/step8-browser.json' }]],
  projects: [
    { name: 'chromium', use: { browserName: 'chromium', launchOptions: process.env.HSK_BROWSER_PATH ? { executablePath: process.env.HSK_BROWSER_PATH, args: ['--no-sandbox', '--disable-dev-shm-usage'] } : {} } },
    { name: 'webkit', use: { browserName: 'webkit' } },
  ],
  use: {
    baseURL: 'http://127.0.0.1:4173', headless: true,
  },
  webServer: {
    command: 'npm run preview -- --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: false,
  },
});
