import {fileURLToPath} from 'node:url';
import original from '../../../../hsk1-app/playwright.vi-presentation.config.ts';
const browser=process.env.HSK_ADAPTER_CI_BROWSER??'collection-only';
const app=fileURLToPath(new URL('../../../../hsk1-app/',import.meta.url));
const output=fileURLToPath(new URL(`../../../.repro-output/b10-adapter-ci/${browser}/`,import.meta.url));
const config:typeof original={...original,testDir:fileURLToPath(new URL('../../../../hsk1-app/tests/browser/',import.meta.url)),
 projects:original.projects?.map(p=>({...p,metadata:{...p.metadata,browserName:p.use?.browserName}})),
 outputDir:output+'hsk1-native-output',workers:1,retries:0,
 reporter:[['list'],['json',{outputFile:output+'hsk1-results.json'}]],
 use:{...original.use,baseURL:'http://127.0.0.1:18911',screenshot:'on',trace:'retain-on-failure'},
 webServer:{command:'npm run dev -- --port 18911 --strictPort',cwd:app,url:'http://127.0.0.1:18911',reuseExistingServer:false}};
export default config;
