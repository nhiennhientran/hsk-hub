import {defineConfig} from '@playwright/test';
import {fileURLToPath} from 'node:url';
const browser=process.env.HSK_CONTINUE_BROWSER;
if(browser!=='chromium'&&browser!=='webkit')throw Error('HSK_CONTINUE_BROWSER must identify the actual engine');
const output=fileURLToPath(new URL(`../course-app/.repro-output/continue-20261005/${browser}/`,import.meta.url));
export default defineConfig({
  testDir:'./tests/browser',testMatch:['continue-source-vi.spec.ts','official-vi-history.spec.ts'],workers:1,retries:0,timeout:45000,
  reporter:[['list'],['json',{outputFile:output+'hsk1-results.json'}]],outputDir:output+'hsk1-native-output',
  projects:[{name:browser,use:{browserName:browser}}],use:{baseURL:'http://127.0.0.1:18916',headless:true,screenshot:'on',trace:'retain-on-failure'},
  webServer:{command:'npm run dev -- --port 18916 --strictPort',cwd:fileURLToPath(new URL('.',import.meta.url)),url:'http://127.0.0.1:18916',reuseExistingServer:false},
});
