import {defineConfig} from '@playwright/test';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';

const own=fileURLToPath(new URL('.',import.meta.url));
const course=fileURLToPath(new URL('../../../',import.meta.url));
const hsk1=fileURLToPath(new URL('../../../../hsk1-app/',import.meta.url));
const artifact=join(course,'.repro-output/continue-phase2',process.env.HSK_PHASE2_BROWSER??'collection');
const packaged=process.env.HSK_VISUAL_PACKAGE_URL??'http://127.0.0.1:18926/hsk-hub/';
const shared=process.env.HSK_VISUAL_SHARED_URL??packaged;
const standalone=process.env.HSK_VISUAL_STANDALONE_URL??'http://127.0.0.1:18925/hsk-hub/new-hsk1/hsk1/';
export default defineConfig({
  testDir:own,workers:1,retries:0,timeout:90000,
  outputDir:join(artifact,'visual/native'),
  reporter:[['list'],['json',{outputFile:join(artifact,'visual/native-results.json')}]],
  projects:[...([
    {surface:'shared',baseURL:shared},
    {surface:'standalone',baseURL:standalone},
  ] as const).flatMap(({surface,baseURL})=>(['chromium','webkit'] as const).map(browserName=>({
    name:`${surface}-${browserName}`,metadata:{surface,compiled:true},
    testMatch:'current-narrow-ui.spec.ts',use:{browserName,baseURL},
  }))),...(['chromium','webkit'] as const).map(browserName=>({
    name:`package-${browserName}`,metadata:{surface:'package',compiled:true},
    testMatch:'current-package-body.spec.ts',use:{browserName,baseURL:packaged},
  }))],
  use:{headless:true,screenshot:'only-on-failure',trace:'retain-on-failure'},
  webServer:[
    ...(!process.env.HSK_VISUAL_STANDALONE_URL?[{
      command:'node tools/release-server.mjs',cwd:hsk1,url:standalone,reuseExistingServer:false,
      env:{HSK_RELEASE_PORT:'18925',HSK_RELEASE_DIST:join(artifact,'package/standalone-dist')},
    }]:[]),
    ...(!process.env.HSK_VISUAL_PACKAGE_URL?[{
      command:'node tools/serve-package.mjs',cwd:course,
      url:new URL('./course-engine/unified-release-manifest.json',packaged).href,
      reuseExistingServer:false,
      env:{HSK_PACKAGE_PORT:'18926',HSK_PACKAGE_ROOT:process.env.HSK_PACKAGE_ROOT??join(artifact,'package/unified-site')},
    }]:[]),
  ],
});
