'use strict';
// Isolated CI software testing only. No production site, login, user-browser
// session, injected application state, or direct localStorage access is used.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const {spawn} = require('node:child_process');
const {solveSort} = require('./question-helpers.cjs');
const E = require('../../new-hsk1/hsk1/stage2/engine.js');
const bank = require('../../new-hsk1/hsk1/stage2/bank.js');
const root = path.resolve(__dirname, '../..');
const output = path.join(__dirname, 'results');
const port = Number(process.env.HSK_STEP2_PORT || 18766);
const baseURL = `http://127.0.0.1:${port}/`;
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const row = id => bank.find(L => L.lesson === id);
const report = {test: 'stage2-isolated-browser', startedAt: new Date().toISOString(),
  scope: '15 lessons; 225 homework tasks; no listening module', browser: null,
  checks: [], screenshots: [], errors: [], networkFailures: [], passed: false,
  limitations: [
    'Isolated CI Chromium only; viewport checks are not physical-phone or Safari certification.',
    'Unicode, multiline text and keyboard button operation are tested; operating-system IME keyboards are not emulated.',
    'The 192 MiB theoretical import ceiling is not a claim of practical phone-memory support. Capacity tests use smaller legitimate backups.'
  ]};

async function step(name, task) {
  const start = Date.now();
  try { await task(); report.checks.push({name, status: 'passed', durationMs: Date.now() - start}); console.log('PASS ' + name); }
  catch (error) { report.checks.push({name, status: 'failed', error: error.message}); throw error; }
}
async function ready(server) {
  for (let i = 0; i < 60; i++) {
    if (server.exitCode !== null) throw new Error('Step 2 preview exited before readiness.');
    const okay = await new Promise(resolve => {
      const request = http.get(baseURL, response => { response.resume(); resolve(response.statusCode === 200); });
      request.on('error', () => resolve(false));
      request.setTimeout(1000, () => { request.destroy(); resolve(false); });
    });
    if (okay) return;
    await delay(150);
  }
  throw new Error('Step 2 preview did not become ready.');
}
function observe(page) {
  page.setDefaultTimeout(15000);
  page.on('pageerror', error => report.errors.push({type: 'pageerror', message: error.message}));
  page.on('response', response => {
    if (response.url().startsWith(baseURL) && response.status() >= 400) {
      report.networkFailures.push({url: response.url().slice(baseURL.length), status: response.status()});
    }
  });
  page.on('requestfailed', request => report.networkFailures.push({url: request.url().startsWith(baseURL) ?
    request.url().slice(baseURL.length) : 'external-request-blocked', error: request.failure()?.errorText}));
}
async function context(browser, width = 1104) {
  const ctx = await browser.newContext({viewport: {width, height: 900}, acceptDownloads: true, locale: 'vi-VN'});
  await ctx.route('**/*', route => {
    const url = route.request().url();
    return url.startsWith(baseURL) || url.startsWith('data:') || url.startsWith('blob:') ? route.continue() : route.abort('blockedbyclient');
  });
  return ctx;
}
async function newPage(ctx, url = baseURL) {
  const page = await ctx.newPage(); observe(page);
  await page.goto(url, {waitUntil: 'networkidle'});
  await page.locator('#page-title').waitFor({state: 'visible'});
  return page;
}
async function lesson(page, id) {
  await page.locator(`#lesson-list [data-lesson="${id}"]`).click();
  assert.match(await page.locator('#page-title').innerText(), new RegExp(`^Bài ${id} ·`));
  assert.equal(await page.locator(`#lesson-list [data-lesson="${id}"]`).getAttribute('aria-current'), 'page');
}
async function part(page, kind) { await page.locator(`#stages [data-stage="${kind}"]`).click(); }
async function choose(page, L, wrongCount = 1) {
  for (const [i, q] of L.choice.entries()) {
    await page.locator(`[data-option="${q.id}"][data-index="${(q.answer + (i < wrongCount ? 1 : 0)) % 4}"]`).click();
  }
}
function translations(L) {
  if (L.lesson === 3) return ['  我的中文老师\n是法国人。  ', '她是你姐姐吗？', '这是我的同学。\n这是我同学。', '我姐姐不是老师。', '我很想你们。'];
  // Clearly synthetic input for storage and snapshot tests, not an answer key.
  return L.translation.map((_, i) => `  第${L.lesson}课测试作答${i + 1}。\n我是学生。  `);
}
async function writeTranslation(page, L, values) {
  for (const [i, q] of L.translation.entries()) await page.locator(`[data-translation="${q.id}"]`).fill(values[i]);
}
async function overflow(page, label, widths = [320, 390, 1104]) {
  for (const width of widths) {
    await page.setViewportSize({width, height: 900});
    const sizes = await page.evaluate(() => ({viewport: window.innerWidth,
      document: document.documentElement.scrollWidth, body: document.body.scrollWidth}));
    assert.ok(Math.max(sizes.document, sizes.body) <= sizes.viewport + 1, `${label} at ${width}px overflows: ${JSON.stringify(sizes)}`);
  }
}
async function screenshot(page, name) {
  await page.screenshot({path: path.join(output, name), fullPage: true});
  report.screenshots.push({file: 'tools/tests/results/' + name, viewport: page.viewportSize()});
}
async function receipt(page, L, expected) {
  await page.locator('#exercise [data-receipt]').click();
  await page.locator('#receipt').waitFor({state: 'visible'});
  assert.match(await page.locator('#receipt h1').innerText(), new RegExp(`^Bài ${L.lesson} ·`));
  assert.deepEqual(await page.locator('#receipt .s1-written-answer').allTextContents(), expected);
  assert.equal(await page.locator('#receipt .s1-receipt-item').count(), 5);
  assert.equal(await page.locator('#receipt .la-feedback, #receipt .answer-correct, #receipt .answer-wrong').count(), 0);
  assert.match(await page.locator('#receipt .s1-receipt-meta').innerText(), /5\/5 câu · Không chấm điểm/);
  assert.match(await page.locator('#receipt .s1-receipt-tip').innerText(), /chưa gửi bài/);
}
async function closeReceipt(page) { await page.locator('#receipt [data-close-receipt]').click(); }
async function backupPanel(page) {
  if (!(await page.locator('#backup-input').isVisible())) await page.locator('#backup-details > summary').click();
}
async function download(page, filename, button = '#export-backup') {
  if (button === '#export-backup') await backupPanel(page);
  const event = page.waitForEvent('download'); await page.locator(button).click();
  const file = path.join(output, filename); await (await event).saveAs(file);
  return {file, data: JSON.parse(fs.readFileSync(file, 'utf8'))};
}
async function inspect(page, source, isFile = false) {
  await backupPanel(page);
  if (isFile) {
    await page.locator('#backup-file').setInputFiles(source);
    await page.waitForFunction(() => document.querySelector('#backup-result').textContent.includes('Đã đọc tệp'));
  } else await page.locator('#backup-input').fill(JSON.stringify(source));
  await page.locator('#inspect-backup').click();
  await page.locator('#apply-backup').waitFor({state: 'visible'});
}
async function apply(page) {
  await page.locator('#apply-backup').click();
  assert.match(await page.locator('#backup-result').innerText(), /Đã mở bản sao/);
}
function step1Fixture() {
  const Old = require('../../new-hsk1/hsk1/stage1/engine.js');
  const L = require('../../new-hsk1/hsk1/stage1/sample-bank.js')[0], state = Old.blank();
  for (const [index, kind] of Old.PATH.entries()) {
    const g = Old.group(state, 3, kind);
    L[kind].forEach((q, i) => { g.draft[q.id] = kind === 'sort' ? solveSort(q) : kind === 'translation' ?
      translations(L)[i] : (q.answer + (i === 0 ? 1 : 0)) % 4; });
    Old.submit(state, 3, kind, L[kind], 1000 + index);
  }
  state.profile = {name: 'Học sinh mẫu', className: 'CI · Step 1'};
  return state;
}
function legacyFixture() {
  const Old = require('../../new-hsk1/hsk1/learning-engine.js'), state = Old.blank();
  const rows = ['bank-01-05.json', 'bank-06-10.json', 'bank-11-15.json'].flatMap(file =>
    require('../../new-hsk1/hsk1/question-bank/' + file));
  for (const L of rows) for (const [index, kind] of Old.KINDS.entries()) {
    const qs = L[kind].map(q => ({...q, kind})), g = Old.group(state, L.lesson, kind);
    for (const q of qs) g.draft[q.id] = kind === 'sort' ? solveSort(q) : q.answer;
    Old.submit(state, L.lesson, kind, qs, L.lesson * 1000 + index);
  }
  state.profile = {name: 'Học sinh kiểm thử cũ', className: 'CI · synthetic legacy'};
  return state;
}
function largeFixture() {
  const state = E.blank(), text = '这是用于检查完整保存的长稿。Tôi đang kiểm tra bản lưu.\n'.repeat(400).slice(0, 12000);
  for (const L of bank) {
    for (const kind of ['choice', 'sort']) {
      const g = E.group(state, L.lesson, kind);
      for (const q of L[kind]) g.draft[q.id] = kind === 'sort' ? solveSort(q) : q.answer;
      E.submit(state, L.lesson, kind, L[kind], L.lesson * 1000);
    }
    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt) E.restart(state, L.lesson, 'translation');
      const g = E.group(state, L.lesson, 'translation');
      for (const q of L.translation) g.draft[q.id] = text;
      E.submit(state, L.lesson, 'translation', L.translation, L.lesson * 1000 + attempt + 1);
    }
  }
  state.profile = {name: 'Học sinh kiểm thử dung lượng', className: 'CI · synthetic capacity'};
  return {state, text};
}

async function run() {
  if (process.env.CI !== 'true') throw new Error('CI-only script: do not run it against a user browser or production.');
  if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Invalid HSK_STEP2_PORT.');
  assert.equal(bank.length, 15);
  fs.mkdirSync(output, {recursive: true});
  let server, browser, serverLog = '';
  try {
    server = spawn(process.execPath, [path.join(root, 'tools/serve-stage2.cjs')], {
      cwd: root, env: {...process.env, HSK_STEP2_PORT: String(port)}, stdio: ['ignore', 'pipe', 'pipe']});
    server.stdout.on('data', chunk => { serverLog = (serverLog + chunk).slice(-5000); });
    server.stderr.on('data', chunk => { serverLog = (serverLog + chunk).slice(-5000); });
    await ready(server);
    const {chromium} = require('playwright'); browser = await chromium.launch({headless: true});
    report.browser = 'Chromium ' + browser.version();
    const main = await context(browser), page = await newPage(main);
    let completedBackup;
    await step('All 15 lesson entries are open; locked hash routes fall back to a permitted group', async () => {
      assert.match(await page.locator('#page-title').innerText(), /^Bài 1 ·/);
      assert.equal(await page.locator('#lesson-list [data-lesson]').count(), 15);
      assert.equal(await page.locator('#lesson-list [data-lesson]').evaluateAll(nodes => nodes.every(node => !node.disabled)), true);
      assert.equal(await page.locator('#stages [data-stage="sort"]').isDisabled(), true);
      assert.equal(await page.locator('#stages [data-stage="translation"]').isDisabled(), true);
      assert.match(await page.locator('#course-overview').innerText(), /0\/225 câu/);
      assert.equal(await page.locator('#pwOverlay').count(), 0);
      assert.deepEqual(await page.locator('script[src]').evaluateAll(nodes => nodes.map(node => node.getAttribute('src'))), ['bank.js', 'engine.js', 'app.js']);
      await lesson(page, 15);
      await page.goto(baseURL + '#lesson=15&part=translation', {waitUntil: 'networkidle'});
      assert.equal(await page.locator('#stages [data-stage="choice"]').getAttribute('aria-current'), 'step');
      assert.equal(new URL(page.url()).hash, '#lesson=15&part=choice');
      await overflow(page, 'Unfinished final lesson');
    });

    const order = [3, 1, 2, ...Array.from({length: 12}, (_, i) => i + 4)];
    for (const [completed, id] of order.entries()) await step(`Lesson ${id}: 15 UI answers, 4/5 choice + 5/5 sorting, five ungraded originals and receipt`, async () => {
      const L = row(id), values = translations(L);
      await lesson(page, id);
      assert.equal(await page.locator('#question-list .la-question').count(), 5);
      assert.equal(await page.locator('[data-option]').count(), 20);
      assert.equal(await page.locator('#stages [data-stage="sort"]').isDisabled(), true);
      if (id === 3) {
        await page.locator('#submit-group').click();
        assert.equal(await page.locator('.s1-missing').count(), 5);
      }
      await choose(page, L);
      if (id === 1) {
        await page.reload({waitUntil: 'networkidle'});
        assert.match(await page.locator('#answered-count').innerText(), /5\/5/);
      }
      await page.locator('#submit-group').click();
      assert.match(await page.locator('#submitted-result .s1-result-head').innerText(), /Đúng 4\/5 câu/);
      assert.equal(await page.locator('.la-feedback.good').count(), 4);
      assert.equal(await page.locator('.la-feedback.bad').count(), 1);
      assert.equal(await page.locator('.s1-selected-feedback').count(), 1);
      assert.equal(await page.locator('#stages [data-stage="sort"]').isEnabled(), true);
      assert.equal(await page.locator('#stages [data-stage="translation"]').isDisabled(), true);
      await part(page, 'sort');
      for (const [qIndex, q] of L.sort.entries()) {
        const testedQuestion = q.id === 'l13-s2-sort-02' ? {...q, answers: [q.answers[1]]} : q;
        if (q.id === 'l13-s2-sort-02') assert.equal(q.answers[1], '我问你一个问题，可以吗？');
        for (const [position, token] of solveSort(testedQuestion).entries()) {
          const button = page.locator(`[data-token="${q.id}"][data-index="${token}"]`);
          if (id === 3 && qIndex === 0 && position === 0) {
            await button.focus(); await button.press('Enter');
            assert.equal(await page.locator(`#question-${q.id} .la-sentence [data-remove]`).count(), 1);
            assert.equal(await page.evaluate(qid => document.activeElement.closest('.la-question')?.id === `question-${qid}` &&
              document.activeElement.tagName === 'BUTTON' && !document.activeElement.disabled, q.id), true);
          } else await button.click();
        }
      }
      await page.locator('#submit-group').click();
      assert.match(await page.locator('#submitted-result .s1-result-head').innerText(), /Đúng 5\/5 câu/);
      assert.equal(await page.locator('.la-feedback.good').count(), 5);
      if (id === 13) report.sortingVariant = {id: 'l13-s2-sort-02', answer: '我问你一个问题，可以吗？', accepted: true};
      for (const q of L.sort) {
        const tokens = page.locator(`#question-${q.id} .la-sentence [data-remove]`);
        assert.equal(await tokens.count(), q.tokens.length);
        for (let i = 0; i < q.tokens.length; i++) assert.equal(await tokens.nth(i).isVisible(), true);
      }
      assert.match(await page.locator('#overview').innerText(), /9\/10 đúng/);
      assert.equal(await page.locator('#stages [data-stage="translation"]').isEnabled(), true);
      await part(page, 'translation');
      if (id === 3) {
        await page.locator(`[data-translation="${L.translation[0].id}"]`).fill('\n\u3000\u200b');
        await page.locator('#submit-group').click();
        assert.equal(await page.locator('.s1-missing').count(), 5);
        assert.match(await page.locator('#form-error').innerText(), /0\/5/);
        await page.locator('#student-name').fill('Học sinh mẫu');
        await page.locator('#student-class').fill('Lớp mẫu HSK 1');
      }
      if (id === 15) {
        const selector = `[data-translation="${L.translation[0].id}"]`;
        const long = '这是完整的长稿。Tôi đang viết bài bằng tiếng Trung.\n'.repeat(40).slice(0, 1500);
        await page.locator(selector).fill(long); await page.setViewportSize({width: 320, height: 900});
        await page.waitForFunction(sel => { const node = document.querySelector(sel); return node.scrollHeight <= node.clientHeight + 2; }, selector);
        assert.equal(await page.locator(selector).inputValue(), long); await overflow(page, 'Final lesson long draft', [320]);
      }
      await writeTranslation(page, L, values); await page.locator('#submit-group').click();
      assert.equal(await page.locator('#exercise .la-feedback').count(), 0);
      assert.match(await page.locator('#overview').innerText(), /15\/15 câu/);
      assert.match(await page.locator('#overview').innerText(), /5\/5 đã lưu/);
      assert.match(await page.locator('#course-overview').innerText(), new RegExp(`${completed + 1}/15 bài hoàn thành`));
      if (id === 3) {
        await page.setViewportSize({width: 390, height: 844}); await screenshot(page, 'stage2-lesson3-translation-390.png');
      }
      await receipt(page, L, values); await overflow(page, `Lesson ${id} receipt`);
      if (id === 15) { await page.setViewportSize({width: 390, height: 844}); await screenshot(page, 'stage2-lesson15-receipt-390.png'); }
      await closeReceipt(page); await page.setViewportSize({width: 1104, height: 900});
    });

    await step('Full-course result is 225/225 with 150 automatic and 75 manual records; reload preserves current lesson', async () => {
      assert.match(await page.locator('#course-overview').innerText(), /15\/15 bài hoàn thành · 225\/225 câu đã nộp/);
      await part(page, 'sort'); await screenshot(page, 'stage2-all-lessons-desktop.png');
      completedBackup = await download(page, 'stage2-completed-synthetic.json');
      const totals = E.courseTotals(completedBackup.data, bank);
      assert.equal(totals.automatic.submitted, 150); assert.equal(totals.automatic.firstCorrect, 135);
      assert.equal(totals.manual.submitted, 75); assert.equal(totals.manual.correct, null);
      for (const L of bank) {
        assert.equal(completedBackup.data.lessons[L.lesson].translation.first.results, null);
        for (const q of L.translation) assert.equal(completedBackup.data.questionReviews[q.id], undefined);
      }
      await page.reload({waitUntil: 'networkidle'});
      assert.match(await page.locator('#page-title').innerText(), /^Bài 15 ·/);
      assert.equal(new URL(page.url()).hash, '#lesson=15&part=sort');
      assert.match(await page.locator('#course-overview').innerText(), /225\/225/);
    });
    await step('A 0/5 L3 redo preserves first 4/5 and all lessons stay unlocked', async () => {
      const L = row(3); await lesson(page, 3); await part(page, 'choice');
      await page.locator('#submitted-result [data-restart]').click();
      assert.equal(await page.locator('#stages [data-stage="translation"]').isEnabled(), true);
      await choose(page, L, 5); await page.locator('#submit-group').click();
      assert.match(await page.locator('#submitted-result .s1-result-head').innerText(), /Đúng 0\/5/);
      assert.match(await page.locator('#submitted-result .s1-result-meta').first().innerText(), /Lần đầu: 4\/5.*Lần nộp này: 0\/5/);
      assert.match(await page.locator('#overview').innerText(), /Lần đầu: 9\/10 đúng/);
      assert.match(await page.locator('#overview').innerText(), /Gần nhất: 5\/10 đúng/);
      assert.equal(await page.locator('#lesson-list [data-lesson]').evaluateAll(nodes => nodes.every(node => !node.disabled)), true);
    });
    await step('Translation redo remains a draft across lesson changes and reload while the prior receipt remains intact', async () => {
      const L = row(3); await part(page, 'translation'); await page.locator('#submitted-result [data-restart]').click();
      await page.locator(`[data-translation="${L.translation[0].id}"]`).fill('新草稿，尚未提交。');
      await lesson(page, 5); await lesson(page, 3); await part(page, 'translation');
      await page.reload({waitUntil: 'networkidle'});
      assert.equal(await page.locator(`[data-translation="${L.translation[0].id}"]`).inputValue(), '新草稿，尚未提交。');
      await receipt(page, L, translations(L)); await closeReceipt(page);
      const markup = '<img data-ci-malicious="true" src="/untrusted-image" onerror="this.dataset.executed=1">';
      const values = [markup + '\n原文', ...translations(L).slice(1)];
      await writeTranslation(page, L, values); await page.locator('#submit-group').click();
      await receipt(page, L, values);
      assert.equal(await page.locator('#receipt img, #receipt script').count(), 0);
      await closeReceipt(page);
    });
    await main.close();

    const restoredContext = await context(browser, 390), restored = await newPage(restoredContext);
    await step('A downloaded all-course JSON file restores through the visible file picker; invalid JSON does not replace it', async () => {
      await inspect(restored, completedBackup.file, true); await apply(restored);
      assert.match(await restored.locator('#course-overview').innerText(), /225\/225/);
      await lesson(restored, 15); await part(restored, 'translation'); await receipt(restored, row(15), translations(row(15))); await closeReceipt(restored);
      await backupPanel(restored); await restored.locator('#backup-input').fill('{broken JSON');
      await restored.locator('#inspect-backup').click();
      assert.equal(await restored.locator('#backup-result .la-alert').isVisible(), true);
      assert.equal(await restored.locator('#apply-backup').count(), 0);
      assert.match(await restored.locator('#course-overview').innerText(), /225\/225/);
    });
    await step('Explicit Step1 import restores only the unchanged L3, including its ungraded original translation', async () => {
      const source = step1Fixture(); await inspect(restored, source); await apply(restored);
      assert.match(await restored.locator('#course-overview').innerText(), /1\/15 bài hoàn thành · 15\/225/);
      await lesson(restored, 3); await part(restored, 'translation'); await receipt(restored, row(3), translations(row(3))); await closeReceipt(restored);
      await lesson(restored, 1); assert.equal(await restored.locator('#stages [data-stage="sort"]').isDisabled(), true);
      const imported = await download(restored, 'stage2-step1-migrated.json');
      assert.deepEqual(imported.data.archive.step1, source);
    });
    await step('Legacy v2 imports are archived; old translation choices cannot become completed free-writing tasks', async () => {
      const source = legacyFixture(); const file = path.join(output, 'stage2-legacy-synthetic.json'); fs.writeFileSync(file, JSON.stringify(source));
      await inspect(restored, file, true); await apply(restored);
      assert.match(await restored.locator('#course-overview').innerText(), /0\/15 bài hoàn thành · 10\/225/);
      await lesson(restored, 3); await part(restored, 'translation');
      for (const q of row(3).translation) assert.equal(await restored.locator(`[data-translation="${q.id}"]`).inputValue(), '');
      const imported = await download(restored, 'stage2-v2-migrated.json');
      assert.deepEqual(imported.data.archive.legacy, source);
      assert.equal(E.courseTotals(imported.data, bank).manual.submitted, 0);
    });
    await restoredContext.close();

    await step('A legitimate large backup imports despite full browser storage; download and in-memory previous-backup recovery remain usable', async () => {
      const capacityContext = await context(browser), capacityPage = await newPage(capacityContext);
      const large = largeFixture(), file = path.join(output, 'stage2-large-synthetic.json');
      fs.writeFileSync(file, JSON.stringify(large.state));
      const bytes = fs.statSync(file).size; assert.ok(bytes > E.MAX_BACKUP_WARNING_BYTES);
      report.largeBackupTestBytes = bytes;
      await inspect(capacityPage, file, true);
      assert.match(await capacityPage.locator('#backup-result').innerText(), /Bản sao lớn/);
      await apply(capacityPage);
      assert.match(await capacityPage.locator('#course-overview').innerText(), /225\/225/);
      assert.equal(await capacityPage.locator('#storage-notice').isVisible(), true);
      const exported = await download(capacityPage, 'stage2-large-roundtrip.json');
      for (const L of bank) for (const q of L.translation) assert.equal(exported.data.lessons[L.lesson].translation.latest.answers[q.id], large.text);
      await inspect(capacityPage, completedBackup.file, true); await apply(capacityPage);
      assert.match(await capacityPage.locator('#backup-result').innerText(), /Bản khôi phục chỉ được giữ trong tab này/);
      assert.equal(await capacityPage.locator('#restore-previous').isVisible(), true);
      await capacityPage.locator('#restore-previous').click();
      await capacityPage.locator('#apply-backup').waitFor({state: 'visible'}); await apply(capacityPage);
      await lesson(capacityPage, 15); await part(capacityPage, 'translation');
      assert.equal(await capacityPage.locator(`[data-translation="${row(15).translation[0].id}"]`).inputValue(), large.text);
      await capacityContext.close();
    });
    await step('Two real tabs cannot silently overwrite one another; stale-tab work can be exported and the newer version inspected', async () => {
      const tabs = await context(browser);
      // Open the stale tab first, then the writer. Both use only ordinary UI actions.
      const tabB = await newPage(tabs, baseURL + '#lesson=2&part=choice');
      const tabA = await newPage(tabs, baseURL + '#lesson=1&part=choice');
      const q1 = row(1).choice[0], q2 = row(2).choice[0];
      await tabA.locator(`[data-option="${q1.id}"][data-index="${q1.answer}"]`).click();
      const savedA = await download(tabA, 'stage2-tab-a.json');
      assert.equal(savedA.data.lessons[1].choice.draft[q1.id], q1.answer);
      await tabB.locator('#storage-sync').waitFor({state: 'visible'});
      assert.match(await tabB.locator('#storage-notice').innerText(), /tab khác/);
      await tabB.locator(`[data-option="${q2.id}"][data-index="${q2.answer}"]`).click();
      const savedB = await download(tabB, 'stage2-tab-b-draft.json', '#export-conflict');
      assert.equal(savedB.data.lessons[2].choice.draft[q2.id], q2.answer);
      const verify = await newPage(tabs, baseURL + '#lesson=1&part=choice');
      assert.equal(await verify.locator(`[data-option="${q1.id}"][data-index="${q1.answer}"]`).getAttribute('aria-pressed'), 'true');
      await lesson(verify, 2); assert.equal(await verify.locator('[data-option][aria-pressed="true"]').count(), 0);
      await tabB.locator('#inspect-latest').click(); await tabB.locator('#apply-backup').waitFor({state: 'visible'});
      await tabs.close();
    });
    await step('The built single HTML has no external scripts/styles and preserves a last-lesson UI answer on reload', async () => {
      const offlineContext = await context(browser, 390), offline = await newPage(offlineContext, baseURL + 'offline.html');
      assert.equal(await offline.locator('script[src], link[rel="stylesheet"][href]').count(), 0);
      assert.equal(await offline.locator('#lesson-list [data-lesson]').count(), 15);
      await lesson(offline, 15); const q = row(15).choice[0];
      await offline.locator(`[data-option="${q.id}"][data-index="${q.answer}"]`).click();
      await offline.reload({waitUntil: 'networkidle'});
      assert.match(await offline.locator('#page-title').innerText(), /^Bài 15 ·/);
      assert.equal(await offline.locator(`[data-option="${q.id}"][data-index="${q.answer}"]`).getAttribute('aria-pressed'), 'true');
      assert.match(await offline.locator('#answered-count').innerText(), /1\/5/);
      await overflow(offline, 'Standalone offline final lesson'); await offlineContext.close();
    });
    assert.deepEqual(report.errors, []); assert.deepEqual(report.networkFailures, []);
    report.passed = true;
  } catch (error) { report.errors.push({type: 'test', message: error.message, stack: error.stack}); throw error; }
  finally {
    if (browser) await browser.close(); if (server) server.kill('SIGTERM');
    report.completedAt = new Date().toISOString(); report.serverLog = serverLog;
    fs.writeFileSync(path.join(output, 'stage2-browser.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify({passed: report.passed, checks: report.checks.length, errors: report.errors.length,
      networkFailures: report.networkFailures.length, screenshots: report.screenshots.map(item => item.file)}));
  }
}
run().catch(error => { console.error(error.stack); process.exitCode = 1; });
