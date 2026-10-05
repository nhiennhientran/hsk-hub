import {defineConfig} from '@playwright/test';
import {fileURLToPath} from 'node:url';
const browser=process.env.HSK_PHASE2_BROWSER;
if(browser!=='chromium'&&browser!=='webkit')throw Error('HSK_PHASE2_BROWSER must identify the actual engine');
const output=fileURLToPath(new URL(`../../../.repro-output/continue-phase2/${browser}/`,import.meta.url));
const packageRoot=process.env.HSK_PHASE2_PACKAGE_ROOT??fileURLToPath(new URL(`../../../.repro-output/continue-phase2/${browser}/package/unified-site/`,import.meta.url));
if(process.env.FLOW_LEGACY_LOCAL_PAKO==='1')throw Error('This acceptance scope requires original network dependencies without substitution');
export default defineConfig({
  testDir:'.',testMatch:'legacy-retained.spec.ts',workers:1,retries:0,timeout:90000,
  reporter:[['list'],['json',{outputFile:output+'history-legacy-results.json'}]],outputDir:output+'history-legacy-native-output',
  projects:[{name:browser,use:{browserName:browser}}],use:{baseURL:'http://127.0.0.1:19784/hsk-hub/',headless:true,screenshot:'on',trace:'retain-on-failure'},
  webServer:{command:'node serve-compiled.mjs',cwd:fileURLToPath(new URL('.',import.meta.url)),url:'http://127.0.0.1:19784/hsk-hub/',reuseExistingServer:false,env:{HSK_PHASE2_MOUNT:'legacy',HSK_PHASE2_PORT:'19784',HSK_PHASE2_PACKAGE_ROOT:packageRoot}},
});
