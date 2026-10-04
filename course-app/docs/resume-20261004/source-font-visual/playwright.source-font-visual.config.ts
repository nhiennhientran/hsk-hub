import {defineConfig} from '@playwright/test';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
const own=fileURLToPath(new URL('.',import.meta.url));
const course=resolve(own,'../../..');
const port=process.env.HSK_SOURCE_VISUAL_PORT??'18786';
export default defineConfig({
  testDir:resolve(course,'tests/unified'),testMatch:'hsk1-source-font-visual.spec.ts',
  outputDir:resolve(own,'native-output'),workers:1,retries:0,timeout:120000,
  reporter:[['list'],['json',{outputFile:resolve(own,'native-results.json')}]],
  projects:[
    {name:'chromium',use:{browserName:'chromium',launchOptions:process.env.HSK_SOURCE_VISUAL_BROWSER_PATH?{
      executablePath:process.env.HSK_SOURCE_VISUAL_BROWSER_PATH,
      args:['--no-sandbox','--disable-dev-shm-usage','--no-zygote','--disable-gpu','--disable-vulkan','--disable-software-rasterizer'],
    }:{}}},
    {name:'webkit',use:{browserName:'webkit'}},
  ],
  use:{baseURL:`http://127.0.0.1:${port}`,headless:true},
  webServer:{command:'node docs/resume-20261004/flow-compat-review/serve-frozen.mjs',cwd:course,
    url:`http://127.0.0.1:${port}`,reuseExistingServer:false,
    env:{FLOW_PORT:port,FLOW_DIST_DIR:process.env.HSK_SOURCE_VISUAL_DIST??resolve(course,'dist')}},
});
