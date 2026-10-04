import {defineConfig} from '@playwright/test';
const port=process.env.HSK_PACKAGE_PORT??'18785';
export default defineConfig({
  testDir:'./tests/packaged',testMatch:'unified-source.spec.ts',outputDir:'test-results-package-closure',workers:1,retries:0,timeout:45000,
  reporter:[['list'],['json',{outputFile:'.repro-output/package-closure-browser.json'}]],
  projects:[{name:'chromium',use:{browserName:'chromium',launchOptions:process.env.HSK_BROWSER_PATH?{executablePath:process.env.HSK_BROWSER_PATH,args:['--no-sandbox','--disable-dev-shm-usage','--no-zygote','--disable-gpu','--disable-vulkan','--disable-software-rasterizer']}:{}}},{name:'webkit',use:{browserName:'webkit'}}],
  use:{baseURL:process.env.HSK_PACKAGE_URL??`http://127.0.0.1:${port}/hsk-hub/`,headless:true},
  webServer:process.env.HSK_PACKAGE_URL?undefined:{command:'node tools/serve-package.mjs',url:`http://127.0.0.1:${port}/hsk-hub/course-engine/unified-release-manifest.json`,reuseExistingServer:false,env:{HSK_PACKAGE_PORT:port,HSK_PACKAGE_ROOT:process.env.HSK_PACKAGE_ROOT??'unified-site-checkpoint'}},
});
