import {defineConfig} from '@playwright/test';
import {fileURLToPath} from 'node:url';
import original from '../b10-hsk23-adapter/playwright.history.config.ts';
const browser=process.env.HSK_ADAPTER_CI_BROWSER??'collection-only';
const app=fileURLToPath(new URL('../../../',import.meta.url));
const output=fileURLToPath(new URL(`../../../.repro-output/b10-adapter-ci/${browser}/`,import.meta.url));
export default defineConfig({...original,outputDir:output+'hsk23-native-output',workers:1,retries:0,
 projects:original.projects?.map(p=>({...p,metadata:{...p.metadata,browserName:p.use?.browserName}})),
 reporter:[['list'],['json',{outputFile:output+'hsk23-results.json'}]],
 use:{...original.use,baseURL:'http://127.0.0.1:4179',screenshot:'on',trace:'retain-on-failure'},
 webServer:{command:'npx vite preview --outDir .repro-output/b10-hsk23-adapter/dist --port 4179 --strictPort',cwd:app,url:'http://127.0.0.1:4179',reuseExistingServer:false}});
