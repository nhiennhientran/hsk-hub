import { fileURLToPath } from 'node:url';
import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser', testMatch: 'official-vi-history.spec.ts', workers: 1, retries: 0, timeout: 30_000,
  reporter: [['list'], ['json', { outputFile: fileURLToPath(new URL('../course-app/docs/resume-20261004/b10-hsk1-adapter/native-ci-results.json', import.meta.url)) }]],
  outputDir: fileURLToPath(new URL('../course-app/docs/resume-20261004/b10-hsk1-adapter/native-ci-output', import.meta.url)),
  projects: [{ name: 'chromium', use: { browserName: 'chromium', launchOptions: process.env.HSK_BROWSER_PATH ? { executablePath: process.env.HSK_BROWSER_PATH, args: ['--no-sandbox', '--disable-dev-shm-usage'] } : {} } }, { name: 'webkit', use: { browserName: 'webkit' } }],
  use: { baseURL: 'http://127.0.0.1:18911', headless: true },
  webServer: { command: 'npm run dev -- --port 18911 --strictPort', url: 'http://127.0.0.1:18911', reuseExistingServer: false },
});
