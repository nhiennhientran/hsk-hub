'use strict';
// Run only in an isolated CI worker. This never connects to the published site,
// logs in, reuses a user browser, or injects state/localStorage into the app.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const {spawn} = require('node:child_process');
const {solveSort} = require('./question-helpers.cjs');
const root = path.resolve(__dirname, '../..');
const output = path.join(__dirname, 'results');
const bank = require('../../new-hsk1/hsk1/stage1/sample-bank.js');
const lesson = bank[0];
const port = Number(process.env.HSK_STEP1_PORT || 18765);
const baseURL = `http://127.0.0.1:${port}/`;
const clone = value => JSON.parse(JSON.stringify(value));
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const report = {
  test: 'stage1-isolated-browser', scope: 'Lesson 3 sample only',
  startedAt: new Date().toISOString(), browser: null, checks: [], screenshots: [],
  errors: [], networkFailures: [], passed: false,
  limitations: [
    'Chromium software test in an isolated CI browser; no production site or user session.',
    'Viewport checks are not physical-phone or Safari compatibility certification.',
    'Unicode text entry and preservation are tested; operating-system IME keyboards are not emulated.'
  ]
};

async function step(name, task) {
  const start = Date.now();
  try {
    await task();
    report.checks.push({name, status: 'passed', durationMs: Date.now() - start});
    console.log('PASS ' + name);
  } catch (error) {
    report.checks.push({name, status: 'failed', durationMs: Date.now() - start, error: error.message});
    throw error;
  }
}

async function ready(server) {
  for (let attempt = 0; attempt < 60; attempt++) {
    if (server.exitCode !== null) throw new Error('Stage 1 preview server exited before becoming ready.');
    const okay = await new Promise(resolve => {
      const request = http.get(baseURL, response => { response.resume(); resolve(response.statusCode === 200); });
      request.on('error', () => resolve(false));
      request.setTimeout(1000, () => { request.destroy(); resolve(false); });
    });
    if (okay) return;
    await delay(150);
  }
  throw new Error('Stage 1 preview did not become ready.');
}

function observe(page) {
  page.on('pageerror', error => report.errors.push({type: 'pageerror', message: error.message}));
  page.on('response', response => {
    if (response.url().startsWith(baseURL) && response.status() >= 400) {
      report.networkFailures.push({url: response.url().slice(baseURL.length), status: response.status()});
    }
  });
  page.on('requestfailed', request => report.networkFailures.push({
    url: request.url().startsWith(baseURL) ? request.url().slice(baseURL.length) : 'external-request-blocked',
    error: request.failure()?.errorText || 'request failed'
  }));
}

async function isolatedContext(browser, width = 1104) {
  const context = await browser.newContext({viewport: {width, height: 900}, acceptDownloads: true, locale: 'vi-VN'});
  await context.route('**/*', route => {
    const url = route.request().url();
    return url.startsWith(baseURL) || url.startsWith('data:') || url.startsWith('blob:') ?
      route.continue() : route.abort('blockedbyclient');
  });
  return context;
}

async function stage(page, kind) { await page.locator(`#stages [data-stage="${kind}"]`).click(); }
async function correctChoice(page, wrongFirst = false, allWrong = false) {
  for (const [index, q] of lesson.choice.entries()) {
    const answer = allWrong || (wrongFirst && index === 0) ? (q.answer + 1) % 4 : q.answer;
    await page.locator(`[data-option="${q.id}"][data-index="${answer}"]`).click();
  }
}
async function fillTranslation(page, answers) {
  for (const [index, q] of lesson.translation.entries()) {
    await page.locator(`[data-translation="${q.id}"]`).fill(answers[index]);
  }
}
async function openBackup(page) {
  if (!(await page.locator('#backup-input').isVisible())) await page.locator('#backup-details > summary').click();
}
async function exportBackup(page, filename) {
  await openBackup(page);
  const downloaded = page.waitForEvent('download');
  await page.locator('#export-backup').click();
  const artifact = await downloaded;
  const target = path.join(output, filename);
  await artifact.saveAs(target);
  return JSON.parse(fs.readFileSync(target, 'utf8'));
}
async function importBackup(page, backup) {
  await openBackup(page);
  await page.locator('#backup-input').fill(JSON.stringify(backup));
  await page.locator('#inspect-backup').click();
  await page.locator('#apply-backup').waitFor({state: 'visible'});
  await page.locator('#apply-backup').click();
  assert.match(await page.locator('#backup-result').innerText(), /Đã mở bản sao/);
}
async function overflow(page, label, widths = [390, 320, 1104]) {
  for (const width of widths) {
    await page.setViewportSize({width, height: 900});
    const sizes = await page.evaluate(() => ({viewport: window.innerWidth,
      document: document.documentElement.scrollWidth, body: document.body.scrollWidth}));
    assert.ok(Math.max(sizes.document, sizes.body) <= sizes.viewport + 1,
      `${label} at ${width}px horizontally overflows: ${JSON.stringify(sizes)}`);
  }
}
async function screenshot(page, name) {
  const file = path.join(output, name);
  await page.screenshot({path: file, fullPage: true});
  report.screenshots.push({file: 'tools/tests/results/' + name, viewport: page.viewportSize()});
}
async function manualReceipt(page, expected) {
  await page.locator('#exercise [data-receipt]').click();
  await page.locator('#receipt').waitFor({state: 'visible'});
  assert.equal(await page.locator('#receipt .s1-receipt-item').count(), 5);
  assert.deepEqual(await page.locator('#receipt .s1-written-answer').allTextContents(), expected);
  assert.equal(await page.locator('#receipt .la-feedback, #receipt .answer-correct, #receipt .answer-wrong').count(), 0);
  assert.match(await page.locator('#receipt .s1-receipt-meta').innerText(), /5\/5 câu · Không chấm điểm/);
  assert.match(await page.locator('#receipt .s1-receipt-tip').innerText(), /chưa gửi bài/);
  assert.ok(!(await page.locator('#receipt').innerText()).includes('%'), 'Manual receipt must contain no percentage grade.');
}

function legacyFixture() {
  // A synthetic student record built by the original engine. It is submitted
  // through the visible backup UI, never written to the browser storage by tests.
  const Old = require('../../new-hsk1/hsk1/learning-engine.js');
  const row = require('../../new-hsk1/hsk1/question-bank/bank-01-05.json').find(item => item.lesson === 3);
  const old = Old.blank();
  for (const [position, kind] of Old.KINDS.entries()) {
    const qs = row[kind].map(q => ({...q, kind})), g = Old.group(old, 3, kind);
    for (const [i, q] of qs.entries()) g.draft[q.id] = kind === 'sort' ? solveSort(q) :
      (kind === 'choice' && i === 0 ? (q.answer + 1) % 4 : q.answer);
    Old.submit(old, 3, kind, qs, Date.UTC(2026, 0, 1) + position * 1000);
    if (kind === 'choice') {
      for (const q of qs) g.draft[q.id] = q.answer;
      Old.correct(old, 3, kind, qs);
    }
  }
  old.profile = {name: 'Học sinh kiểm thử cũ', className: 'HSK 1 · CI synthetic'};
  old.updatedAt = Date.UTC(2026, 0, 1) + 10000;
  return old;
}

async function main() {
  if (process.env.CI !== 'true') throw new Error('This script is CI-only. Do not run it against a user browser or production.');
  if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Invalid HSK_STEP1_PORT.');
  fs.mkdirSync(output, {recursive: true});
  let server, browser, serverLog = '';
  try {
    server = spawn(process.execPath, [path.join(root, 'tools/serve-stage1.cjs')], {
      cwd: root, env: {...process.env, HSK_STEP1_PORT: String(port)}, stdio: ['ignore', 'pipe', 'pipe']
    });
    server.stdout.on('data', chunk => { serverLog = (serverLog + chunk).slice(-5000); });
    server.stderr.on('data', chunk => { serverLog = (serverLog + chunk).slice(-5000); });
    await ready(server);
    const {chromium} = require('playwright');
    browser = await chromium.launch({headless: true});
    report.browser = 'Chromium ' + browser.version();
    const context = await isolatedContext(browser), page = await context.newPage();
    page.setDefaultTimeout(10000);
    observe(page);
    const answers = [
      '  我的中文老师\n是法国人。  ', '她是你姐姐吗？',
      '这是我的同学。\n这是我同学。', '我姐姐不是老师。', '我很想你们。'
    ];
    let backup;

    await step('Initial sample: only choice is open; no production runtime or login', async () => {
      await page.goto(baseURL, {waitUntil: 'networkidle'});
      await page.locator('#page-title').waitFor({state: 'visible'});
      assert.equal(await page.locator('#stages [data-stage="choice"]').isEnabled(), true);
      assert.equal(await page.locator('#stages [data-stage="sort"]').isDisabled(), true);
      assert.equal(await page.locator('#stages [data-stage="translation"]').isDisabled(), true);
      assert.equal(await page.locator('#question-list .la-question').count(), 5);
      assert.equal(await page.locator('[data-option]').count(), 20);
      assert.equal(await page.locator('.la-feedback').count(), 0);
      assert.equal(await page.locator('#pwOverlay').count(), 0);
      assert.deepEqual(await page.locator('script[src]').evaluateAll(nodes => nodes.map(node => node.getAttribute('src'))),
        ['sample-bank.js', 'engine.js', 'app.js']);
      assert.match(await page.locator('#overview').innerText(), /0\/15 câu/);
      await overflow(page, 'Initial choice');
    });
    await step('Missing choice answers block submission; UI selections survive reload', async () => {
      await page.locator('#submit-group').click();
      assert.equal(await page.locator('#form-error').isVisible(), true);
      assert.equal(await page.locator('.s1-missing').count(), 5);
      assert.equal(await page.locator('#stages [data-stage="sort"]').isDisabled(), true);
      await correctChoice(page, true);
      await page.reload({waitUntil: 'networkidle'});
      assert.match(await page.locator('#answered-count').innerText(), /5\/5/);
      for (const [i, q] of lesson.choice.entries()) {
        const selected = i === 0 ? (q.answer + 1) % 4 : q.answer;
        assert.equal(await page.locator(`[data-option="${q.id}"][data-index="${selected}"]`).getAttribute('aria-pressed'), 'true');
      }
    });
    await step('Choice 4/5 unlocks sorting immediately and explains the selected wrong option', async () => {
      await page.locator('#submit-group').click();
      assert.match(await page.locator('#submitted-result .s1-result-head').innerText(), /Đúng 4\/5 câu/);
      assert.equal(await page.locator('.la-feedback.good').count(), 4);
      assert.equal(await page.locator('.la-feedback.bad').count(), 1);
      assert.equal(await page.locator('.s1-selected-feedback').count(), 1);
      assert.equal(await page.locator('#stages [data-stage="sort"]').isEnabled(), true);
      assert.equal(await page.locator('#stages [data-stage="translation"]').isDisabled(), true);
      assert.match(await page.locator('#overview').innerText(), /Đã chấm 5\/10 câu/);
      await overflow(page, 'Submitted choice');
    });
    await step('Five sentences are assembled by clicking tokens; 5/5 unlocks translation and tokens stay visible', async () => {
      await stage(page, 'sort');
      for (const [questionIndex, q] of lesson.sort.entries()) {
        for (const [position, index] of solveSort(q).entries()) {
          const token = page.locator(`[data-token="${q.id}"][data-index="${index}"]`);
          if (questionIndex === 0 && position === 0) {
            await token.focus();
            await token.press('Enter');
            assert.equal(await page.locator(`#question-${q.id} .la-sentence [data-remove]`).count(), 1);
            const focus = await page.evaluate(() => ({
              question: document.activeElement.closest('.la-question')?.id,
              button: document.activeElement.tagName === 'BUTTON',
              enabled: !document.activeElement.disabled
            }));
            assert.deepEqual(focus, {question: `question-${q.id}`, button: true, enabled: true},
              'Enter must assemble one token and keep usable keyboard focus in this question.');
          } else await token.click();
        }
      }
      await page.locator('#submit-group').click();
      assert.match(await page.locator('#submitted-result .s1-result-head').innerText(), /Đúng 5\/5 câu/);
      assert.equal(await page.locator('.la-feedback.good').count(), 5);
      assert.match(await page.locator('#overview').innerText(), /9\/10 đúng/);
      assert.equal(await page.locator('#stages [data-stage="translation"]').isEnabled(), true);
      for (const q of lesson.sort) {
        const tokens = page.locator(`#question-${q.id} .la-sentence [data-remove]`);
        assert.equal(await tokens.count(), q.tokens.length);
        for (let index = 0; index < q.tokens.length; index++) assert.equal(await tokens.nth(index).isVisible(), true,
          `Submitted token ${index} in ${q.id} must stay visible.`);
      }
      await overflow(page, 'Submitted sorting');
    });
    await step('Translation rejects empty/zero-width-only answers, stores raw multiline text, and has no feedback grades', async () => {
      await stage(page, 'translation');
      await page.locator(`[data-translation="${lesson.translation[0].id}"]`).fill(' \n\u3000\u200b\u200d');
      await page.locator('#submit-group').click();
      assert.equal(await page.locator('.s1-missing').count(), 5);
      assert.match(await page.locator('#form-error').innerText(), /0\/5 câu/);
      const longDraft = '这是我的中文老师。Tôi đang viết bài bằng tiếng Trung.\n'.repeat(40).slice(0, 1500);
      const firstField = `[data-translation="${lesson.translation[0].id}"]`;
      await page.locator(firstField).fill(longDraft);
      await page.setViewportSize({width: 320, height: 900});
      await page.waitForFunction(selector => {
        const field = document.querySelector(selector);
        return field && field.scrollHeight <= field.clientHeight + 2;
      }, firstField);
      assert.equal(await page.locator(firstField).inputValue(), longDraft);
      await overflow(page, '1500-character Chinese/Vietnamese multiline draft', [320]);
      await page.locator('#student-name').fill('Học sinh mẫu');
      await page.locator('#student-class').fill('Lớp mẫu HSK 1');
      await fillTranslation(page, answers);
      await page.locator('#submit-group').click();
      assert.match(await page.locator('#submitted-result .s1-result-head').innerText(), /Đã lưu đủ 5 câu dịch/);
      assert.equal(await page.locator('#exercise .la-feedback').count(), 0);
      assert.match(await page.locator('#overview').innerText(), /15\/15 câu/);
      assert.match(await page.locator('#overview').innerText(), /9\/10 đúng/);
      assert.match(await page.locator('#overview').innerText(), /5\/5 đã lưu/);
      for (const [i, q] of lesson.translation.entries()) {
        const field = page.locator(`[data-translation="${q.id}"]`);
        assert.equal(await field.inputValue(), answers[i]);
        assert.equal(await field.getAttribute('readonly'), '');
        assert.equal(await field.evaluate(node => node.scrollHeight <= node.clientHeight + 2), true);
      }
      await overflow(page, 'Submitted translation');
      await page.setViewportSize({width: 390, height: 844});
      await screenshot(page, 'stage1-translation-390.png');
    });
    await step('Receipt contains all five submitted originals and no machine grade; desktop result is reviewable', async () => {
      await manualReceipt(page, answers);
      await overflow(page, 'Translation receipt');
      await screenshot(page, 'stage1-receipt.png');
      await page.locator('#receipt [data-close-receipt]').click();
      await stage(page, 'sort');
      await screenshot(page, 'stage1-desktop-result.png');
      backup = await exportBackup(page, 'stage1-synthetic-submitted-backup.json');
      assert.equal(backup.lessons[3].choice.first.correct, 4);
      assert.equal(backup.lessons[3].sort.first.correct, 5);
      assert.equal(backup.lessons[3].translation.first.correct, null);
      assert.equal(backup.lessons[3].translation.first.results, null);
      for (const q of lesson.translation) assert.equal(backup.questionReviews[q.id], undefined);
    });
    await step('Reload retains first scores and raw submitted translation', async () => {
      await page.reload({waitUntil: 'networkidle'});
      assert.match(await page.locator('#overview').innerText(), /15\/15 câu/);
      assert.match(await page.locator('#overview').innerText(), /9\/10 đúng/);
      assert.equal(await page.locator('#stages [data-stage="translation"]').isEnabled(), true);
      await stage(page, 'translation');
      for (const [i, q] of lesson.translation.entries()) assert.equal(await page.locator(`[data-translation="${q.id}"]`).inputValue(), answers[i]);
    });
    await step('Choice redo scores 0/5 while first remains 4/5 and later groups stay open', async () => {
      await stage(page, 'choice');
      await page.locator('#submitted-result [data-restart]').click();
      assert.equal(await page.locator('#stages [data-stage="sort"]').isEnabled(), true);
      assert.equal(await page.locator('#stages [data-stage="translation"]').isEnabled(), true);
      await correctChoice(page, false, true);
      await page.locator('#submit-group').click();
      assert.match(await page.locator('#submitted-result .s1-result-head').innerText(), /Đúng 0\/5 câu/);
      assert.match(await page.locator('#submitted-result .s1-result-meta').first().innerText(), /Lần đầu: 4\/5.*Lần nộp này: 0\/5/);
      const overview = await page.locator('#overview').innerText();
      assert.match(overview, /Lần đầu: 9\/10 đúng/);
      assert.match(overview, /Gần nhất: 5\/10 đúng/);
      assert.match(overview, /15\/15 câu/);
    });
    await step('An unsubmitted translation redo keeps its previous receipt accessible and independent', async () => {
      await stage(page, 'translation');
      await page.locator('#submitted-result [data-restart]').click();
      await page.locator(`[data-translation="${lesson.translation[0].id}"]`).fill('新草稿，尚未提交。');
      await manualReceipt(page, answers);
      assert.ok(!(await page.locator('#receipt').innerText()).includes('新草稿，尚未提交。'));
      await page.locator('#receipt [data-close-receipt]').click();
      await page.reload({waitUntil: 'networkidle'});
      await stage(page, 'translation');
      assert.equal(await page.locator(`[data-translation="${lesson.translation[0].id}"]`).inputValue(), '新草稿，尚未提交。');
      await manualReceipt(page, answers);
      await page.locator('#receipt [data-close-receipt]').click();
    });
    await step('Student HTML is displayed as literal text in fields and the submitted receipt', async () => {
      const markup = '<img data-ci-malicious="true" src="/untrusted-image" onerror="this.dataset.executed=1">';
      const hostileAnswers = [markup + '\n我的中文老师是法国人。', ...answers.slice(1)];
      await page.locator('#student-name').fill('测试学生 <b data-ci-profile="true">原文</b>');
      await fillTranslation(page, hostileAnswers);
      await page.locator('#submit-group').click();
      await manualReceipt(page, hostileAnswers);
      assert.equal(await page.locator('#receipt img, #receipt script, #receipt [data-ci-profile]').count(), 0);
      assert.match(await page.locator('#receipt .s1-receipt-meta').innerText(), /<b data-ci-profile="true">原文<\/b>/);
      await overflow(page, 'Literal markup receipt');
      await page.locator('#receipt [data-close-receipt]').click();
    });

    const recoveryContext = await isolatedContext(browser, 390), recoveryPage = await recoveryContext.newPage();
    recoveryPage.setDefaultTimeout(10000); observe(recoveryPage);
    await step('Downloaded backup restores through visible UI in a fresh browser context; invalid import preserves it', async () => {
      await recoveryPage.goto(baseURL, {waitUntil: 'networkidle'});
      await importBackup(recoveryPage, backup);
      assert.match(await recoveryPage.locator('#overview').innerText(), /15\/15 câu/);
      assert.match(await recoveryPage.locator('#overview').innerText(), /9\/10 đúng/);
      await stage(recoveryPage, 'translation');
      await manualReceipt(recoveryPage, answers);
      await recoveryPage.locator('#receipt [data-close-receipt]').click();
      await openBackup(recoveryPage);
      await recoveryPage.locator('#backup-input').fill('{broken JSON');
      await recoveryPage.locator('#inspect-backup').click();
      assert.equal(await recoveryPage.locator('#backup-result .la-alert').isVisible(), true);
      assert.equal(await recoveryPage.locator('#apply-backup').count(), 0);
      assert.match(await recoveryPage.locator('#overview').innerText(), /15\/15 câu/);
    });
    await step('Synthetic legacy-v2 backup migrates through the UI; old translation is archived, never completed', async () => {
      const legacy = legacyFixture();
      fs.writeFileSync(path.join(output, 'stage1-legacy-synthetic.json'), JSON.stringify(legacy, null, 2));
      await importBackup(recoveryPage, legacy);
      const overview = await recoveryPage.locator('#overview').innerText();
      assert.match(overview, /10\/15 câu/);
      assert.match(overview, /9\/10 đúng/);
      assert.match(overview, /0\/5 đã lưu/);
      await stage(recoveryPage, 'translation');
      for (const q of lesson.translation) assert.equal(await recoveryPage.locator(`[data-translation="${q.id}"]`).inputValue(), '');
      assert.equal(await recoveryPage.locator('#exercise [data-receipt]').count(), 0);
      const migrated = await exportBackup(recoveryPage, 'stage1-legacy-migrated-backup.json');
      assert.deepEqual(migrated.archive.legacy, legacy);
      assert.equal(migrated.lessons[3].translation.first, null);
      assert.equal(migrated.lessons[3].translation.completed, false);
      assert.equal(migrated.lessons[3].choice.first.correct, 4);
    });
    await recoveryContext.close();
    await context.close();
    await step('Built offline HTML starts independently and preserves one UI answer on reload', async () => {
      const offlineContext = await isolatedContext(browser, 390), offlinePage = await offlineContext.newPage();
      offlinePage.setDefaultTimeout(10000); observe(offlinePage);
      await offlinePage.goto(baseURL + 'offline.html', {waitUntil: 'networkidle'});
      assert.match(await offlinePage.locator('#page-title').innerText(), /Bài 3/);
      assert.equal(await offlinePage.locator('script[src]').count(), 0);
      assert.equal(await offlinePage.locator('link[rel="stylesheet"][href]').count(), 0);
      assert.equal(await offlinePage.locator('#question-list .la-question').count(), 5);
      assert.equal(await offlinePage.locator('#stages [data-stage="sort"]').isDisabled(), true);
      const q = lesson.choice[0];
      await offlinePage.locator(`[data-option="${q.id}"][data-index="${q.answer}"]`).click();
      await offlinePage.reload({waitUntil: 'networkidle'});
      assert.equal(await offlinePage.locator(`[data-option="${q.id}"][data-index="${q.answer}"]`).getAttribute('aria-pressed'), 'true');
      assert.match(await offlinePage.locator('#answered-count').innerText(), /1\/5/);
      await offlineContext.close();
    });
    assert.deepEqual(report.errors, [], 'The sample must not produce uncaught browser errors.');
    assert.deepEqual(report.networkFailures, [], 'The sample must not request missing or external resources.');
    report.passed = true;
  } catch (error) {
    report.errors.push({type: 'test', message: error.message, stack: error.stack});
    throw error;
  } finally {
    if (browser) await browser.close();
    if (server) server.kill('SIGTERM');
    report.completedAt = new Date().toISOString();
    report.serverLog = serverLog;
    fs.writeFileSync(path.join(output, 'stage1-browser.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify({passed: report.passed, checks: report.checks.length,
      errors: report.errors.length, networkFailures: report.networkFailures.length,
      screenshots: report.screenshots.map(item => item.file)}));
  }
}

main().catch(error => { console.error(error.stack); process.exitCode = 1; });
