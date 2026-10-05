import {defineConfig} from '@playwright/test';
import {fileURLToPath} from 'node:url';
const browser=process.env.HSK_CONTINUE_BROWSER;
if(browser!=='chromium'&&browser!=='webkit')throw Error('HSK_CONTINUE_BROWSER must identify the actual engine');
const output=fileURLToPath(new URL(`../../.repro-output/continue-20261005/${browser}/`,import.meta.url));
export default defineConfig({
  testDir:fileURLToPath(new URL('../../tests/unified/',import.meta.url)),
  testMatch:'continue-*.spec.ts',workers:1,retries:0,timeout:45000,
  reporter:[['list'],['json',{outputFile:output+'shared-results.json'}]],outputDir:output+'shared-native-output',
  projects:[{name:browser,use:{browserName:browser}}],use:{baseURL:'http://127.0.0.1:4173',headless:true,screenshot:'on',trace:'retain-on-failure'},
  webServer:{command:'npm run preview -- --port 4173 --strictPort',cwd:fileURLToPath(new URL('../../',import.meta.url)),url:'http://127.0.0.1:4173',reuseExistingServer:false},
});
