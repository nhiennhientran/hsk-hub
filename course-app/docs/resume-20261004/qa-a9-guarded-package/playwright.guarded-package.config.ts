import {defineConfig} from '@playwright/test';
import {resolve} from 'node:path';
import original from '../../../playwright.package-closure.config.ts';
const courseRoot=resolve(import.meta.dirname,'../../..');
export default defineConfig({...original,
 testDir:resolve(courseRoot,'tests/packaged'),
 outputDir:resolve(import.meta.dirname,'native-output'),
 reporter:[['list'],['json',{outputFile:resolve(import.meta.dirname,'native-results.json')}]],
 webServer:{...(original.webServer as object),cwd:courseRoot,command:`node ${resolve(courseRoot,'tools/serve-package.mjs')}`},
});
