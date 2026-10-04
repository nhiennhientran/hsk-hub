import {defineConfig} from '@playwright/test';
import {fileURLToPath} from 'node:url';
import original from '../playwright.b14.config.ts';
const browser=process.env.HSK_B14_CI_BROWSER;
if(browser!=='chromium'&&browser!=='webkit')throw Error('Explicit HSK_B14_CI_BROWSER required');
const output=fileURLToPath(new URL(`../../../../.repro-output/b14-narrow-ui-ci/${browser}/`,import.meta.url));
const servers=Array.isArray(original.webServer)?original.webServer:[];
if(servers.length!==2)throw Error('Two actual compiled preview consumers required');
export default defineConfig({...original,
  workers:1,retries:0,repeatEach:1,outputDir:output+'native-output',
  projects:original.projects?.filter(project=>project.use?.browserName===browser).map(project=>({
    ...project,metadata:{...project.metadata,browserName:browser},retries:0,repeatEach:1,
  })),
  reporter:[['list'],['json',{outputFile:output+'native-results.json'}]],
  use:{...original.use,trace:'retain-on-failure'},
  webServer:servers.map((server,index)=>({...server,
    command:`npm run preview -- --host 127.0.0.1 --port ${[18914,18915][index]} --strictPort`,
    reuseExistingServer:false,
  })),
});
