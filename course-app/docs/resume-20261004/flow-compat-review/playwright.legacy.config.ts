import {defineConfig} from '@playwright/test';
export default defineConfig({
 testDir:'.',testMatch:process.env.FLOW_LEGACY_MATCH??'legacy-entries.packaged.ts',workers:1,retries:0,timeout:90000,outputDir:'./legacy-native-output',
 reporter:[['list'],['json',{outputFile:new URL('./legacy-native-results.json',import.meta.url).pathname}]],
 projects:[{name:'chromium',use:{browserName:'chromium',launchOptions:process.env.FLOW_BROWSER_PATH?{executablePath:process.env.FLOW_BROWSER_PATH,args:['--no-sandbox','--disable-dev-shm-usage','--no-zygote','--disable-gpu','--disable-vulkan','--disable-software-rasterizer']}:{}}},{name:'webkit',use:{browserName:'webkit'}}],
 use:{baseURL:`http://127.0.0.1:${process.env.FLOW_PACKAGE_PORT??18783}/hsk-hub/`,headless:true},
 webServer:{command:'node serve-legacy.mjs',url:`http://127.0.0.1:${process.env.FLOW_PACKAGE_PORT??18783}/hsk-hub/course-engine/unified-release-manifest.json`,reuseExistingServer:false},
});
