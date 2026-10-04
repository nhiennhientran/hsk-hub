import {defineConfig} from './hsk1-retained-runtime.mjs';
export default defineConfig({
 testDir:'.',testMatch:process.env.FLOW_HSK1_MATCH??'hsk1-preserved.retained.ts',workers:1,retries:0,timeout:120000,outputDir:'./hsk1-retained-output',
 reporter:[['list'],['json',{outputFile:new URL('./hsk1-retained-results.json',import.meta.url).pathname}]],
 projects:[{name:'chromium',use:{browserName:'chromium',launchOptions:process.env.FLOW_BROWSER_PATH?{executablePath:process.env.FLOW_BROWSER_PATH,args:['--no-sandbox','--disable-dev-shm-usage','--no-zygote','--disable-gpu','--disable-vulkan','--disable-software-rasterizer']}:{}}},{name:'webkit',use:{browserName:'webkit'}}],
 use:{baseURL:`http://127.0.0.1:${process.env.FLOW_PORT??18782}`,headless:true},
 webServer:{command:'node serve-frozen.mjs',url:`http://127.0.0.1:${process.env.FLOW_PORT??18782}`,reuseExistingServer:false,env:{FLOW_DIST_DIR:process.env.FLOW_DIST_DIR??new URL('../../../../hsk1-app/dist',import.meta.url).pathname}},
});
