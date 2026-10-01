import assert from 'node:assert/strict';
import { spawn, execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { once } from 'node:events';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium, webkit } from '@playwright/test';

// Diagnostic for the unchanged baseline, not a passing regression test for the new app.
const browserName = process.argv.find(arg => arg.startsWith('--browser='))?.split('=')[1] ?? 'chromium';
assert.ok(['chromium', 'webkit'].includes(browserName), 'Use chromium or webkit.');
const output = resolve(process.argv.find(arg => arg.startsWith('--output='))?.slice(9) ?? '.repro-output/init-race.json');
const port = process.env.HSK_REPRO_PORT ?? '18769';
const baseline = '71b39192133c82f684384f450dda6079d3253440';
const repository = fileURLToPath(new URL('../..', import.meta.url));
const server = spawn(process.execPath, [fileURLToPath(new URL('../../tools/serve-integration-step1.cjs', import.meta.url))], {
  env: { ...process.env, HSK_STAGE41_PORT: port }, stdio: ['ignore', 'pipe', 'pipe'],
});
const serverReady = once(server.stdout, 'data', { signal: AbortSignal.timeout(5_000) });
let browser;
let release;
let phase = 'verify-baseline';
const delayedScript = new Promise(resolveGate => { release = resolveGate; });
try {
  const sourceHashes = {};
  for (const name of ['tools/serve-integration-step1.cjs', 'new-hsk1/hsk1/learning.html',
    'new-hsk1/hsk1/learning-integrated.js', 'new-hsk1/hsk1/auth-patch.js',
    ...['catalog', 'media-index', 'engine', 'player', 'app'].map(name => `new-hsk1/hsk1/stage3/${name}.js`)]) {
    const actual = await readFile(resolve(repository, name));
    const expected = execFileSync('git', ['show', `${baseline}:${name}`], { cwd: repository, maxBuffer: 4 * 1024 * 1024 });
    assert.ok(actual.equals(expected), `Diagnostic source differs from frozen baseline: ${name}`);
    sourceHashes[name] = createHash('sha256').update(actual).digest('hex');
  }
  phase = 'start-browser';
  await serverReady;
  browser = await ({ chromium, webkit })[browserName].launch({
    headless: true,
    ...(browserName === 'chromium' && process.env.HSK_BROWSER_PATH ? {
      executablePath: process.env.HSK_BROWSER_PATH,
      args: ['--no-sandbox', '--disable-dev-shm-usage'],
    } : {}),
  });
  const page = await browser.newPage();
  page.setDefaultTimeout(10_000);
  // Model an existing unlocked classroom session; this diagnostic does not audit authentication.
  await page.addInitScript(() => sessionStorage.setItem('hsk_portal_unlocked_v2', '1'));
  let requested;
  const scriptRequested = new Promise(resolveRequest => { requested = resolveRequest; });
  await page.route('**/stage3/app.js*', async route => {
    requested();
    await delayedScript;
    await route.continue();
  });
  const base = `http://127.0.0.1:${port}/hsk-hub/new-hsk1/hsk1/`;
  phase = 'open-homework';
  await page.goto(base + 'learning.html?mode=homework&lesson=10', { waitUntil: 'domcontentloaded' });
  await page.locator('#exercise [data-option]').first().waitFor();
  await page.locator('#integratedNav [data-mode="listening"]').click({ noWaitAfter: true });
  await Promise.race([scriptRequested, delay(10_000, null, { ref: false }).then(() => { throw new Error('Stage3 script was not requested.'); })]);
  phase = 'click-before-ready';
  const button = page.locator('#start-listening');
  await button.waitFor({ state: 'visible' });
  const enabledBeforeInitialization = await button.isEnabled();
  assert.equal(enabledBeforeInitialization, true);
  await button.click();
  assert.equal(await page.locator('#listening-question').count(), 0);
  release();
  phase = 'verify-lost-click';
  await page.locator('#lesson-checks input').first().waitFor();
  const questionAfterInitialization = await page.locator('#listening-question').count();
  assert.equal(questionAfterInitialization, 0, 'The early click is lost after initialization.');
  await button.click();
  await page.locator('#listening-question').waitFor({ state: 'visible' });
  const report = {
    issue: 'INIT-001', baseline, sourceHashes, browser: browserName, browserVersion: browser.version(), reproduced: true,
    scope: 'Controlled delay of stage3/app.js after navigation from Lesson10 homework; existing unlocked session.',
    enabledBeforeInitialization, questionAfterInitialization,
    questionAfterSecondClick: await page.locator('#listening-question').count(),
    conclusion: 'An enabled start button can lose a click before its handler is attached.',
    limitation: 'This confirms a baseline initialization race. It does not establish the sole cause of historical WebKit CI failure.',
  };
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ issue: report.issue, browser: browserName, reproduced: true, output }));
} catch (error) {
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, JSON.stringify({ issue: 'INIT-001', baseline, browser: browserName, reproduced: false, phase, error: error.message }, null, 2) + '\n');
  throw error;
} finally {
  release?.();
  await browser?.close();
  if (server.exitCode === null) {
    server.kill('SIGTERM');
    await once(server, 'exit', { signal: AbortSignal.timeout(5_000) });
  }
}
