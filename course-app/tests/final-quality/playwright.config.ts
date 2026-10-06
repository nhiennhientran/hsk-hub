import {defineConfig} from '@playwright/test';
import {resolve} from 'node:path';
const live=process.env.HSK_FINAL_QA_URL;
const port=process.env.HSK_FINAL_QA_PORT??'18836';
export default defineConfig({
  testDir:'.',testMatch:process.env.HSK_FINAL_QA_MATCH??['remaining-coverage.spec.ts','requirements.spec.ts','teaching-clarifications.spec.ts'],
  fullyParallel:true,workers:2,retries:0,timeout:150000,
  outputDir:resolve(import.meta.dirname,'../../docs/final-quality-20261006/qa/browser-output'),
  reporter:[['list'],['json',{outputFile:process.env.HSK_FINAL_QA_REPORT?resolve(process.env.HSK_FINAL_QA_REPORT):resolve(import.meta.dirname,'../../docs/final-quality-20261006/qa/browser-results.json')}]],
  projects:[{name:'chromium',use:{browserName:'chromium'}},{name:'webkit',use:{browserName:'webkit'}}],
  use:{baseURL:live??`http://127.0.0.1:${port}`,headless:true,viewport:{width:390,height:900},trace:'retain-on-failure',screenshot:'only-on-failure'},
  webServer:live?undefined:{command:`node ${resolve(import.meta.dirname,'../../docs/resume-20261004/flow-compat-review/serve-frozen.mjs')}`,url:`http://127.0.0.1:${port}`,reuseExistingServer:false,env:{FLOW_PORT:port,FLOW_DIST_DIR:process.env.HSK_FINAL_QA_DIST??resolve(import.meta.dirname,'../../dist')}}
});
