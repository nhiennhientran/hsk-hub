import {defineConfig} from '@playwright/test';
import {fileURLToPath} from 'node:url';
const browser=process.env.HSK_PHASE2_BROWSER;
if(browser!=='chromium'&&browser!=='webkit')throw Error('HSK_PHASE2_BROWSER must identify the actual engine');
const output=fileURLToPath(new URL(`../../../.repro-output/continue-phase2/${browser}/`,import.meta.url));
const packageRoot=process.env.HSK_PHASE2_PACKAGE_ROOT??fileURLToPath(new URL(`../../../.repro-output/continue-phase2/${browser}/package/unified-site/`,import.meta.url));
export default defineConfig({
  testDir:'.',testMatch:'shared-retained.spec.ts',workers:1,retries:0,timeout:120000,
  grep:/actual unified HSK[123] lesson \d+ all five homework parts persist exact isolated receipts|durable HSK[23] (homework|listening) (quota|waiting) rejects unconfirmed receipt across remount ordinary save and explicit retry|actual HSK[23] all independent listening questions preserve immutable first latest and wrong retry|actual HSK[23] complete canonical mixed queue renders all senses exact backs and survives responsive reload|HSK[23] data-safety (backup preview, cancelled import and confirmed import preserve course identity|current edition reset and recovery preserve nonempty old HSK3 records|separate tabs cannot silently overwrite profile changes)|shared backup exports all three course identities and restores only the selected level/,
  reporter:[['list'],['json',{outputFile:output+'history-shared-results.json'}]],outputDir:output+'history-shared-native-output',
  projects:[{name:browser,use:{browserName:browser}}],use:{baseURL:'http://127.0.0.1:19782',headless:true,screenshot:'on',trace:'retain-on-failure'},
  webServer:{command:'node serve-compiled.mjs',cwd:fileURLToPath(new URL('.',import.meta.url)),url:'http://127.0.0.1:19782',reuseExistingServer:false,env:{HSK_PHASE2_MOUNT:'shared',HSK_PHASE2_PORT:'19782',HSK_PHASE2_PACKAGE_ROOT:packageRoot}},
});
