import {defineConfig} from '@playwright/test';
export default defineConfig({
 testDir:'.',testMatch:process.env.FLOW_TEST_MATCH??['durable-attempts.candidate.spec.ts','homework-all-lessons.candidate.spec.ts','shared-practice-listening.candidate.spec.ts','input-abort.candidate.spec.ts','mobile-boundaries.candidate.spec.ts'],workers:1,retries:0,timeout:120000,
 outputDir:'./native-output',
 reporter:[['list'],['json',{outputFile:new URL('./native-flow-results.json',import.meta.url).pathname}]],
 projects:[
  {name:'chromium',use:{browserName:'chromium',launchOptions:process.env.FLOW_BROWSER_PATH?{executablePath:process.env.FLOW_BROWSER_PATH,args:['--no-sandbox','--disable-dev-shm-usage','--no-zygote','--disable-gpu','--disable-vulkan','--disable-software-rasterizer']}:{}}},
  {name:'webkit',use:{browserName:'webkit'}},
 ],
 use:{baseURL:`http://127.0.0.1:${process.env.FLOW_PORT??18782}`,headless:true},
 webServer:{command:'node serve-frozen.mjs',url:`http://127.0.0.1:${process.env.FLOW_PORT??18782}`,reuseExistingServer:false},
});
