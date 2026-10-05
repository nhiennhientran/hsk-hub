import {defineConfig} from './hsk1-runtime.mjs';
import {fileURLToPath} from 'node:url';
const browser=process.env.HSK_PHASE2_BROWSER;
if(browser!=='chromium'&&browser!=='webkit')throw Error('HSK_PHASE2_BROWSER must identify the actual engine');
const output=fileURLToPath(new URL(`../../../.repro-output/continue-phase2/${browser}/`,import.meta.url));
const distRoot=process.env.HSK_PHASE2_HSK1_DIST_ROOT??fileURLToPath(new URL(`../../../.repro-output/continue-phase2/${browser}/package/standalone-dist/`,import.meta.url));
export default defineConfig({
  testDir:'.',testMatch:'hsk1-retained.spec.ts',workers:1,retries:0,timeout:120000,
  grepInvert:/a downloaded nonempty backup restores identical data in a new context and one import-before recovery/,
  reporter:[['list'],['json',{outputFile:output+'history-hsk1-results.json'}]],outputDir:output+'history-hsk1-native-output',
  projects:[{name:browser,use:{browserName:browser}}],use:{baseURL:'http://127.0.0.1:19783',headless:true,screenshot:'on',trace:'retain-on-failure'},
  webServer:{command:'node serve-compiled.mjs',cwd:fileURLToPath(new URL('.',import.meta.url)),url:'http://127.0.0.1:19783',reuseExistingServer:false,env:{HSK_PHASE2_MOUNT:'hsk1',HSK_PHASE2_PORT:'19783',HSK_PHASE2_HSK1_DIST_ROOT:distRoot}},
});
