import {defineConfig} from '@playwright/test';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
const own=fileURLToPath(new URL('.',import.meta.url)),course=resolve(own,'../../..');
const browser=process.env.HSK_PHASE2_BROWSER;
if(browser!=='chromium'&&browser!=='webkit')throw Error('Explicit phase2 browser required');
const out=resolve(course,'.repro-output/continue-phase2',browser);
export default defineConfig({
  testDir:resolve(course,'tests/packaged'),testMatch:'unified-source.spec.ts',workers:1,retries:0,timeout:60000,
  outputDir:resolve(out,'package-native'),projects:[{name:browser,use:{browserName:browser}}],
  reporter:[['list'],['json',{outputFile:resolve(out,'package-results.json')}]],
  use:{baseURL:'http://127.0.0.1:19785/hsk-hub/',headless:true,screenshot:'only-on-failure'},
  webServer:{command:'node tools/serve-package.mjs',cwd:course,url:'http://127.0.0.1:19785/hsk-hub/course-engine/unified-release-manifest.json',reuseExistingServer:false,
    env:{HSK_PACKAGE_PORT:'19785',HSK_PACKAGE_ROOT:resolve(out,'package/unified-site')}},
});
