import {defineConfig} from '@playwright/test';
import {fileURLToPath} from 'node:url';

const own=fileURLToPath(new URL('.',import.meta.url));
const course=fileURLToPath(new URL('../../../',import.meta.url));
const hsk1=fileURLToPath(new URL('../../../../hsk1-app/',import.meta.url));
export default defineConfig({
  testDir:own,testMatch:'narrow-ui.spec.ts',outputDir:new URL('./native-output/',import.meta.url).pathname,
  workers:1,retries:0,timeout:90000,
  reporter:[['list'],['json',{outputFile:new URL('./native-results.json',import.meta.url).pathname}]],
  projects:([
    {surface:'shared',baseURL:'http://127.0.0.1:18914'},
    {surface:'standalone',baseURL:'http://127.0.0.1:18915'},
  ] as const).flatMap(({surface,baseURL})=>(['chromium','webkit'] as const).map(browserName=>({
    name:`${surface}-${browserName}`,metadata:{surface},use:{browserName,baseURL},
  }))),
  use:{headless:true,screenshot:'only-on-failure'},
  webServer:[
    {command:'npm run preview -- --port 18914 --strictPort',cwd:course,url:'http://127.0.0.1:18914',reuseExistingServer:false},
    {command:'npm run preview -- --port 18915 --strictPort',cwd:hsk1,url:'http://127.0.0.1:18915',reuseExistingServer:false},
  ],
});
