import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  workers: 1,
  retries: 0,
  timeout: 20_000,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173', headless: true,
    launchOptions: process.env.HSK_BROWSER_PATH ? {
      executablePath: process.env.HSK_BROWSER_PATH,
      args: ['--no-sandbox', '--disable-dev-shm-usage'],
    } : {},
  },
  webServer: {
    command: 'npm run preview -- --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: false,
  },
});
