import {defineConfig} from '@playwright/test';
import {fileURLToPath} from 'node:url';
import original from '../../../playwright.config.ts';
const courseDir=fileURLToPath(new URL('../../../',import.meta.url));
export default defineConfig({...original,testDir:'../../../tests/unified',testMatch:'official-vi-history.spec.ts',
 outputDir:'./native-output',timeout:45000,retries:0,workers:1,
 reporter:[['list'],['json',{outputFile:fileURLToPath(new URL('./native-results.json',import.meta.url))}]],
 use:{...original.use,baseURL:process.env.HSK_LIVE_URL??'http://127.0.0.1:4179'},
 webServer:process.env.HSK_LIVE_URL?undefined:{cwd:courseDir,command:'npx vite preview --outDir .repro-output/b10-hsk23-adapter/dist --port 4179 --strictPort',url:'http://127.0.0.1:4179',reuseExistingServer:false}});
