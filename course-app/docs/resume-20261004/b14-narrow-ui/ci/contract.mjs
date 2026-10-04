import assert from 'node:assert/strict';
export const branch='refs/heads/work/hsk-b14-narrow-ui-ci-20261004';
export const widths=[320,390,768,1280,1440];
export const surfaces=['shared','standalone'];
export const title=width=>`${width}px full nav captions, separated hidden roles and complete native table hints`;
export const evidenceRoot=browser=>`course-app/.repro-output/b14-narrow-ui-ci/${browser}`;
export function actualBrowser(browser){assert.ok(['chromium','webkit'].includes(browser),'Explicit actual matrix browser required');return browser}
export function commandPlan(browser){
  actualBrowser(browser);
  const prefix='course-app/docs/resume-20261004/b14-narrow-ui';
  return [
    ['course-install','.', 'npm','ci','--prefix','course-app'],
    ['hsk1-install','.', 'npm','ci','--prefix','hsk1-app'],
    ['course-units','.', 'npm','test','--prefix','course-app'],
    ['hsk1-units','.', 'npm','test','--prefix','hsk1-app'],
    ['course-source','.', 'npm','run','content:check','--prefix','course-app'],
    ['hsk1-source','.', 'npm','run','catalog:check','--prefix','hsk1-app'],
    ['hsk1-migration-fixtures','.', 'npm','run','fixtures:check','--prefix','hsk1-app'],
    ['course-types','.', 'npm','run','check','--prefix','course-app'],
    ['hsk1-types','.', 'npm','run','check','--prefix','hsk1-app'],
    ['native-fixture-types','.', 'course-app/node_modules/.bin/tsc','-p',prefix+'/ci/tsconfig.json'],
    ['native-report-guards','.', 'node','--test',prefix+'/ci/guards.test.mjs'],
    ['browser-install','course-app', 'node','node_modules/@playwright/test/cli.js','install','--with-deps',browser],
    ['font-install','.', 'sudo','apt-get','install','-y','fonts-noto-cjk'],
    ['hsk1-build','.', 'npm','run','build','--prefix','hsk1-app'],
    ['course-build','.', 'npm','run','build','--prefix','course-app'],
    ['hsk1-asset-bytes','.', 'npm','run','assets:check','--prefix','hsk1-app'],
    ['native-collection','.', 'node','course-app/node_modules/@playwright/test/cli.js','test','--config='+prefix+'/ci/playwright.ci.config.ts','--list','--reporter=list'],
    ['native','.', 'node','course-app/node_modules/@playwright/test/cli.js','test','--config='+prefix+'/ci/playwright.ci.config.ts','--project=shared-'+browser,'--project=standalone-'+browser],
  ].map(([label,cwd,...command])=>({label,cwd,command}));
}
