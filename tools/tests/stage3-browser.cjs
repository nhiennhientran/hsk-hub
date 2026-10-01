'use strict';
// Isolated CI software acceptance only. All application changes use visible UI
// or the normal JSON backup importer. Media listeners observe real events; they
// never replace play(), seek, inject application state, or access localStorage.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const {spawn} = require('node:child_process');
const E = require('../../new-hsk1/hsk1/stage3/engine.js');
const catalog = require('../../new-hsk1/hsk1/stage3/catalog.js');
const root = path.resolve(__dirname, '../..');
const output = path.join(__dirname, 'results');
const mediaManifest = JSON.parse(fs.readFileSync(path.join(root, 'new-hsk1/hsk1/stage3/media-manifest.json'), 'utf8'));
const manifestClips = new Map((Array.isArray(mediaManifest.clips) ? mediaManifest.clips : Object.values(mediaManifest.clips)).map(clip => [clip.id, clip]));
const port = Number(process.env.HSK_STEP3_PORT || 18767);
const baseURL = `http://127.0.0.1:${port}/`;
const allLessons = Array.from({length: 15}, (_, i) => i + 1);
const expectedRequests = new WeakSet();
const report = {test: 'stage3-isolated-browser', startedAt: new Date().toISOString(),
  sourceCommit: process.env.GITHUB_SHA || null, runId: process.env.GITHUB_RUN_ID || null,
  scope: '75 original-audio listening questions and semantic vocabulary review; no production deployment',
  browser: null, checks: [], playback: [], screenshots: [], errors: [], networkFailures: [],
  expectedNetworkFailures: [], passed: false, limitations: [
    'CI Chromium and viewport evidence do not certify Safari, physical phones, operating-system IME, or all file-preview applications.',
    'Real media events, decoded duration, rate and pitch-preservation configuration are observed. They are not a human listening or acoustic-quality certification.',
    'Historical schedule fixtures are synthetic valid backups imported through the visible file picker, not real learner data.',
    'Vocabulary ratings are self-assessments. They are not automatic language scores or measured classroom outcomes.'
  ]};

async function step(name, action) {
  const started = Date.now();
  try { await action(); report.checks.push({name, status: 'passed', durationMs: Date.now() - started}); console.log('PASS ' + name); }
  catch (error) { report.checks.push({name, status: 'failed', error: error.message}); throw error; }
}
async function ready(server) {
  for (let i = 0; i < 70; i++) {
    if (server.exitCode !== null) throw new Error('Stage 3 preview exited before readiness.');
    const okay = await new Promise(resolve => {
      const req = http.get(baseURL, res => { res.resume(); resolve(res.statusCode === 200); });
      req.on('error', () => resolve(false)); req.setTimeout(1000, () => { req.destroy(); resolve(false); });
    });
    if (okay) return;
    await new Promise(resolve => setTimeout(resolve, 150));
  }
  throw new Error('Stage 3 preview did not become ready.');
}
function observe(page) {
  page.setDefaultTimeout(15000);
  page.on('pageerror', error => report.errors.push({type: 'pageerror', message: error.message}));
  page.on('response', response => {
    if (response.url().startsWith(baseURL) && response.status() >= 400) {
      const item = {url: response.url().slice(baseURL.length), status: response.status()};
      (expectedRequests.has(response.request()) ? report.expectedNetworkFailures : report.networkFailures).push(item);
    }
  });
  page.on('requestfailed', request => {
    const item = {url: request.url().startsWith(baseURL) ? request.url().slice(baseURL.length) : 'external-request-blocked',
      error: request.failure()?.errorText};
    (expectedRequests.has(request) ? report.expectedNetworkFailures : report.networkFailures).push(item);
  });
}
async function context(browser, width = 1104) {
  const ctx = await browser.newContext({viewport: {width, height: 900}, acceptDownloads: true, locale: 'vi-VN'});
  await ctx.route('**/*', route => {
    const url = route.request().url();
    return url.startsWith(baseURL) || url.startsWith('data:') || url.startsWith('blob:') ? route.continue() : route.abort('blockedbyclient');
  });
  return ctx;
}
async function attachMediaObserver(page) {
  await page.locator('#lesson-audio').waitFor({state: 'attached'});
  await page.evaluate(() => {
    const audio = document.querySelector('#lesson-audio');
    if (audio.__ciPlaybackEvidence) return;
    const evidence = {sequence: 0, events: []};
    Object.defineProperty(audio, '__ciPlaybackEvidence', {value: evidence});
    for (const type of ['play', 'playing', 'pause', 'ended', 'error', 'ratechange']) audio.addEventListener(type, () => {
      evidence.events.push({sequence: ++evidence.sequence, type, mediaId: audio.dataset.mediaId || '',
        sourceType: (audio.currentSrc || audio.src).split(':')[0],
        currentTime: audio.currentTime, duration: Number.isFinite(audio.duration) ? audio.duration : null,
        rate: audio.playbackRate, paused: audio.paused, ended: audio.ended,
        simultaneous: [...document.querySelectorAll('audio')].filter(a => !a.paused && !a.ended).length});
    });
  });
}
async function newPage(ctx, url = baseURL) {
  const page = await ctx.newPage(); observe(page);
  await page.goto(url, {waitUntil: 'networkidle'});
  await page.locator('#module-listening').waitFor({state: 'visible'}); await attachMediaObserver(page);
  return page;
}
async function reload(page) {
  await page.reload({waitUntil: 'networkidle'}); await attachMediaObserver(page);
}
async function media(page) {
  return page.locator('#lesson-audio').evaluate(a => ({mediaId: a.dataset.mediaId || '',
    sourceType: (a.currentSrc || a.src).split(':')[0],
    currentTime: a.currentTime, duration: Number.isFinite(a.duration) ? a.duration : null,
    rate: a.playbackRate, pitch: 'preservesPitch' in a ? a.preservesPitch :
      ('webkitPreservesPitch' in a ? a.webkitPreservesPitch : null),
    paused: a.paused, ended: a.ended, sequence: a.__ciPlaybackEvidence.sequence,
    events: a.__ciPlaybackEvidence.events.slice()}));
}
async function verifyPlayedBytes(page, expectedId) {
  const expected = manifestClips.get(expectedId); assert.ok(expected, `missing clip manifest for ${expectedId}`);
  const actual = await page.locator('#lesson-audio').evaluate(async a => {
    const src = a.currentSrc || a.src;
    if (!/^data:audio\/[^;,]+;base64,/.test(src)) throw new Error('Expected embedded original-audio data URL.');
    const data = Uint8Array.from(atob(src.slice(src.indexOf(',') + 1)), value => value.charCodeAt(0));
    const digest = await crypto.subtle.digest('SHA-256', data);
    return {mediaId: a.dataset.mediaId, bytes: data.length,
      sha256: [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, '0')).join(''), duration: a.duration};
  });
  assert.equal(actual.mediaId, expectedId); assert.equal(actual.bytes, expected.bytes); assert.equal(actual.sha256, expected.sha256);
  assert.ok(Math.abs(actual.duration - expected.duration) < 0.15, `${expectedId}: decoded duration differs from manifest`);
  return {bytes: actual.bytes, sha256: actual.sha256};
}
async function playToEnd(page, label, button = '#play-audio') {
  const before = await media(page), start = Date.now();
  await page.locator(button).click();
  await page.waitForFunction(previous => {
    const a = document.querySelector('#lesson-audio');
    return a.__ciPlaybackEvidence.events.some(e => e.sequence > previous && e.type === 'ended');
  }, before.sequence, {timeout: 120000});
  const after = await media(page), events = after.events.filter(e => e.sequence > before.sequence);
  assert.ok(events.some(e => e.type === 'playing'), `${label}: no real playing event`);
  const ended = events.findLast(e => e.type === 'ended');
  assert.ok(ended && ended.duration > 0 && ended.currentTime >= ended.duration - 0.06, `${label}: no full natural end`);
  assert.equal(events.some(e => e.type === 'error'), false, `${label}: media error`);
  assert.equal(events.some(e => e.simultaneous > 1), false, `${label}: concurrent audio`);
  assert.equal(after.paused, true);
  const bytes = await verifyPlayedBytes(page, ended.mediaId);
  const proof = {label, mediaId: ended.mediaId, sourceType: ended.sourceType, duration: ended.duration,
    rate: ended.rate, preservesPitch: after.pitch, elapsedMs: Date.now() - start, ended: true, ...bytes};
  report.playback.push(proof); return proof;
}
async function setRate(page, rate) {
  await page.locator('#audio-rate').selectOption(String(rate));
  assert.equal(Number(await page.locator('#audio-rate').inputValue()), rate);
  assert.equal((await media(page)).rate, rate);
  assert.equal((await media(page)).pitch, true);
}
async function selectLessons(page, ids) {
  await page.locator('#clear-lessons').click();
  for (const id of ids) await page.locator(`#lesson-checks input[data-lesson="${id}"]`).check();
  assert.deepEqual((await page.locator('#lesson-checks input:checked').evaluateAll(nodes =>
    nodes.map(n => Number(n.dataset.lesson)))).sort((a, b) => a - b), [...ids].sort((a, b) => a - b));
}
async function startListening(page, ids, mode = 'all') {
  await page.locator('#module-listening').click(); await selectLessons(page, ids);
  await page.locator('#listening-mode').selectOption(mode); await page.locator('#shuffle-items').uncheck();
  await page.locator('#start-listening').click();
}
async function questionId(page) { return page.locator('#listening-question').getAttribute('data-question-id'); }
async function numericData(page, selector, key) {
  const value = await page.locator(selector).getAttribute('data-' + key);
  assert.notEqual(value, null, `${selector}: missing data-${key}`); return Number(value);
}
async function hiddenAnswers(page, q) {
  assert.equal(await page.locator('#listening-feedback').isVisible(), false);
  const texts = await page.locator('#work-content').evaluate(node => ({visible: node.innerText,
    accessibleLabels: [...node.querySelectorAll('[aria-label], [title], [alt]')]
      .map(el => [el.getAttribute('aria-label'), el.getAttribute('title'), el.getAttribute('alt')].filter(Boolean).join(' ')).join(' ')}));
  for (const line of q.transcript) {
    assert.equal(texts.visible.includes(line.zh), false, `${q.id}: transcript visible before submission`);
    assert.equal(texts.accessibleLabels.includes(line.zh), false, `${q.id}: transcript in label before submission`);
    assert.equal(texts.accessibleLabels.includes(line.py), false, `${q.id}: pinyin in label before submission`);
  }
}
async function submitQuestion(page, q, wrong = false) {
  assert.equal(await questionId(page), q.id);
  await hiddenAnswers(page, q);
  const option = page.locator(`[data-listen-option="${(q.answer + (wrong ? 1 : 0)) % 4}"]`);
  if (q.id === catalog.listening[0].id && wrong) { await option.focus(); await option.press('Enter'); }
  else await option.click();
  assert.equal(await page.locator('#listening-feedback').isVisible(), false);
  await page.locator('#listen-submit').click();
  await page.locator('#listening-feedback').waitFor({state: 'visible'});
  assert.equal(await page.evaluate(() => document.activeElement?.id), 'listening-feedback');
  const text = await page.locator('#listening-feedback').innerText();
  for (const line of q.transcript) for (const field of ['zh', 'py', 'vi']) assert.ok(text.includes(line[field]), `${q.id}: missing ${field}`);
  assert.ok(text.includes(q.explanationVi), `${q.id}: missing explanation`);
  for (const keyword of q.keywords) assert.ok(text.includes(keyword.zh), `${q.id}: missing keyword`);
  if (wrong) assert.ok(text.includes(q.optionFeedback[(q.answer + 1) % 4]), `${q.id}: missing selected-option feedback`);
}
async function overflow(page, label, widths = [320, 390, 1104]) {
  for (const width of widths) {
    await page.setViewportSize({width, height: 900});
    const size = await page.evaluate(() => ({viewport: innerWidth, document: document.documentElement.scrollWidth, body: document.body.scrollWidth}));
    assert.ok(Math.max(size.document, size.body) <= size.viewport + 1, `${label}: overflow at ${width}px`);
  }
}
async function screenshot(page, name) {
  await page.screenshot({path: path.join(output, name), fullPage: true});
  report.screenshots.push({file: 'tools/tests/results/' + name, viewport: page.viewportSize()});
}
async function backupPanel(page) {
  if (!(await page.locator('#backup-file').isVisible())) await page.locator('#backup-details > summary').click();
}
async function download(page, name, selector = '#export-backup') {
  if (selector === '#export-backup') await backupPanel(page);
  const event = page.waitForEvent('download'); await page.locator(selector).click();
  const file = path.join(output, name); await (await event).saveAs(file);
  return {file, data: JSON.parse(fs.readFileSync(file, 'utf8'))};
}
async function importFile(page, file) {
  await backupPanel(page); await page.locator('#backup-file').setInputFiles(file);
  await page.locator('#apply-backup').waitFor({state: 'visible'});
  await page.locator('#apply-backup').click();
  assert.match(await page.locator('#backup-result').innerText(), /Đã mở bản vừa kiểm tra/);
}
function writeFixture(name, state) {
  const file = path.join(output, name); fs.writeFileSync(file, JSON.stringify(state)); return file;
}
async function startReview(page, ids, filter = 'all', direction = 'zh-vi') {
  await page.locator('#module-vocabulary').click(); await selectLessons(page, ids);
  await page.locator('#vocab-filter').selectOption(filter); await page.locator('#review-direction').selectOption(direction);
  await page.locator('#shuffle-items').uncheck(); await page.locator('#start-review').click();
}
async function rateCard(page, rating) {
  await page.locator('#reveal-card').click();
  await page.locator(`[data-rating="${rating}"]`).click();
}
function scheduleFixture(firstAt, otherAt) {
  const state = E.blank(), beginning = Math.min(firstAt, otherAt) - 1000;
  E.setPreferences(state, {module: 'vocabulary', lessons: allLessons, vocabularyFilter: 'all', shuffle: false}, beginning);
  const review = E.startReview(state, catalog, {}, beginning);
  review.senseIds.forEach((id, i) => {
    const at = i === 0 ? firstAt : otherAt;
    E.revealCard(state, id, at); E.rateCard(state, catalog, 'good', at);
    if (i + 1 < review.senseIds.length) E.nextCard(state, at);
  });
  return state;
}

async function run() {
  if (process.env.CI !== 'true') throw new Error('CI-only: do not run against a user browser or production.');
  if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Invalid HSK_STEP3_PORT.');
  assert.equal(catalog.listening.length, 75);
  fs.mkdirSync(output, {recursive: true});
  let server, browser, serverLog = '';
  try {
    server = spawn(process.execPath, [path.join(root, 'tools/serve-stage3.cjs')], {
      cwd: root, env: {...process.env, HSK_STEP3_PORT: String(port)}, stdio: ['ignore', 'pipe', 'pipe']});
    server.stdout.on('data', chunk => { serverLog = (serverLog + chunk).slice(-5000); });
    server.stderr.on('data', chunk => { serverLog = (serverLog + chunk).slice(-5000); });
    await ready(server);
    const {chromium} = require('playwright'); browser = await chromium.launch({headless: true});
    report.browser = 'Chromium ' + browser.version();
    const main = await context(browser), page = await newPage(main);
    let listeningBackup;

    await step('Initial scope, empty selection and no-wrong-question states preserve an independent module', async () => {
      assert.equal(await page.locator('#lesson-checks input[data-lesson]').count(), 15);
      assert.equal(await page.locator('audio').count(), 1); assert.equal((await media(page)).paused, true);
      assert.equal(await page.locator('#pwOverlay').count(), 0);
      await selectLessons(page, []); assert.equal(await page.locator('#start-listening').isDisabled(), true);
      await selectLessons(page, [1]); await page.locator('#listening-mode').selectOption('wrong');
      assert.equal(await numericData(page, '#selection-summary', 'listening-count'), 0);
      assert.equal(await page.locator('#start-listening').isDisabled(), true);
      await page.locator('#listening-mode').selectOption('all');
    });

    for (const id of allLessons) await step(`Lesson ${id}: five real clips end, five UI submissions, first result 4/5`, async () => {
      await startListening(page, [id]); await setRate(page, 1.5);
      const questions = catalog.listening.filter(q => q.lesson === id); assert.equal(questions.length, 5);
      for (const [i, q] of questions.entries()) {
        assert.equal(await questionId(page), q.id); await hiddenAnswers(page, q);
        const played = await playToEnd(page, q.id); assert.equal(played.mediaId, q.id);
        await submitQuestion(page, q, i === 0);
        assert.equal(await numericData(page, '#listen-summary', 'answered'), i + 1);
        if (i < questions.length - 1) await page.locator('#listen-next').click();
      }
      assert.equal(await numericData(page, '#listen-summary', 'total'), 5);
      assert.equal(await numericData(page, '#listen-summary', 'correct'), 4);
      if (id === 15) {
        await overflow(page, 'Submitted listening feedback');
        await page.setViewportSize({width: 390, height: 844}); await screenshot(page, 'stage3-listening-feedback-390.png');
        await page.setViewportSize({width: 1104, height: 900});
      }
    });
    await step('The 75 unique records retain 60 first-correct answers; wrong-only retry does not inflate completion', async () => {
      listeningBackup = await download(page, 'stage3-all-listening-synthetic.json');
      const initial = E.listeningSummary(listeningBackup.data, catalog);
      assert.equal(initial.overall.answered, 75); assert.equal(initial.overall.firstCorrect, 60);
      assert.equal(initial.overall.latestCorrect, 60); assert.equal(initial.wrongIds.length, 15);
      assert.equal(Object.keys(listeningBackup.data.cards.schedule).length, 0);
      assert.equal(await numericData(page, '#listening-overall', 'answered'), 75);
      assert.equal(await numericData(page, '#listening-overall', 'first-correct'), 60);
      await startListening(page, allLessons, 'wrong');
      assert.equal(await numericData(page, '#listen-summary', 'total'), 15);
      for (const [i, id] of initial.wrongIds.entries()) {
        const q = catalog.listening.find(item => item.id === id);
        await playToEnd(page, `wrong-retry:${id}`); await submitQuestion(page, q);
        if (i < 14) await page.locator('#listen-next').click();
      }
      assert.equal(await numericData(page, '#listen-summary', 'correct'), 15);
      const final = await download(page, 'stage3-listening-retried.json'), summary = E.listeningSummary(final.data, catalog);
      assert.equal(summary.overall.answered, 75); assert.equal(summary.overall.firstCorrect, 60);
      assert.equal(summary.overall.latestCorrect, 75); assert.equal(summary.wrongIds.length, 0);
      assert.equal(await numericData(page, '#listening-overall', 'latest-correct'), 75);
    });

    await step('Nonadjacent mixed lessons preserve a pending answer, option order, rate and position across reload and module changes', async () => {
      await startListening(page, [1, 7, 15]); await setRate(page, 0.75);
      const q = catalog.listening.find(item => item.lesson === 1);
      await page.locator(`[data-listen-option="${q.answer}"]`).click();
      const order = await page.locator('[data-listen-option]').evaluateAll(nodes => nodes.map(n => n.dataset.listenOption));
      await reload(page);
      assert.equal(await questionId(page), q.id); assert.equal(await page.locator(`[data-listen-option="${q.answer}"]`).getAttribute('aria-pressed'), 'true');
      assert.deepEqual(await page.locator('[data-listen-option]').evaluateAll(nodes => nodes.map(n => n.dataset.listenOption)), order);
      assert.equal(Number(await page.locator('#audio-rate').inputValue()), 0.75); assert.equal((await media(page)).paused, true);
      await page.locator('#module-vocabulary').click(); await page.locator('#module-listening').click();
      assert.equal(await questionId(page), q.id); assert.equal(await numericData(page, '#listen-summary', 'total'), 15);
      const saved = await download(page, 'stage3-mixed-draft.json');
      assert.deepEqual(saved.data.listening.session.lessons, [1, 7, 15]);
      assert.equal(saved.data.listening.session.responses[q.id].selected, q.answer);
      await page.locator('#listen-submit').click(); await page.locator('#listen-next').click();
      await reload(page); assert.equal(await questionId(page), catalog.listening.filter(item => item.lesson === 1)[1].id);
      listeningBackup = saved;
    });

    const mediaContext = await context(browser), player = await newPage(mediaContext);
    const representative = catalog.listening.find(q => {
      const duration = manifestClips.get(q.id)?.duration;
      return duration >= 2.5 && duration <= 5 && catalog.listening.filter(item => item.lesson === q.lesson).at(-1).id !== q.id;
    });
    assert.ok(representative, 'expected a nonfinal 2.5–5 second sentence clip for player controls');
    await startListening(player, [representative.lesson]);
    for (const q of catalog.listening.filter(q => q.lesson === representative.lesson)) {
      if (q.id === representative.id) break;
      await submitQuestion(player, q); await player.locator('#listen-next').click();
    }
    await step('Five supported rates play to natural ended with pitch preservation configured and exactly one audio element', async () => {
      assert.equal(await player.locator('audio').count(), 1);
      assert.deepEqual(await player.locator('#audio-rate option').evaluateAll(nodes => nodes.map(n => Number(n.value))), [0.65, 0.75, 1, 1.25, 1.5]);
      for (const rate of [0.65, 0.75, 1, 1.25, 1.5]) {
        await setRate(player, rate);
        const proof = await playToEnd(player, `rate:${rate}:${representative.id}`, '#replay-audio');
        assert.equal(proof.rate, rate); assert.equal(proof.preservesPitch, true);
      }
    });
    await step('Pause and continue preserve media position; changing rate during playback reaches the real end', async () => {
      await setRate(player, 0.65); await player.locator('#replay-audio').click();
      await player.waitForFunction(() => { const a = document.querySelector('#lesson-audio'); return !a.paused && a.currentTime > 0.2; });
      await player.locator('#pause-audio').click(); const paused = await media(player);
      assert.equal(paused.paused, true);
      await player.waitForTimeout(350); const still = await media(player);
      assert.ok(Math.abs(still.currentTime - paused.currentTime) < 0.06, 'paused clip kept advancing');
      const resumed = await playToEnd(player, `pause-resume:${representative.id}`);
      assert.ok(resumed.duration >= paused.currentTime);
      await player.locator('#replay-audio').click();
      await player.waitForFunction(() => { const a = document.querySelector('#lesson-audio'); return !a.paused && a.currentTime > 0.2; });
      const before = await media(player); await setRate(player, 1.5);
      assert.ok((await media(player)).currentTime >= before.currentTime - 0.06, 'rate change restarted the clip');
      await player.waitForFunction(sequence => document.querySelector('#lesson-audio').__ciPlaybackEvidence.events
        .some(e => e.sequence > sequence && e.type === 'ended'), before.sequence, {timeout: 60000});
      const after = await media(player), ended = after.events.findLast(e => e.type === 'ended');
      assert.ok(ended.currentTime >= ended.duration - 0.06); assert.equal(ended.rate, 1.5);
      assert.equal(after.events.some(e => e.simultaneous > 1), false);
      report.playback.push({label: `midplay-rate:${representative.id}`, mediaId: ended.mediaId,
        duration: ended.duration, rate: ended.rate, preservesPitch: after.pitch, ended: true});
    });
    await step('Answer selection keeps playback uninterrupted; changing question, selected lessons or module stops the previous clip', async () => {
      await startListening(player, [representative.lesson]);
      for (const earlier of catalog.listening.filter(item => item.lesson === representative.lesson)) {
        if (earlier.id === representative.id) break;
        await submitQuestion(player, earlier); await player.locator('#listen-next').click();
      }
      const q = representative;
      await setRate(player, 0.65); await player.locator('#play-audio').click();
      await player.waitForFunction(() => !document.querySelector('#lesson-audio').paused);
      const playing = await media(player);
      await player.locator(`[data-listen-option="${q.answer}"]`).click();
      const afterSelection = await media(player);
      assert.equal(afterSelection.mediaId, q.id); assert.equal(afterSelection.paused, false);
      assert.ok(afterSelection.currentTime >= playing.currentTime - 0.06, 'answer selection restarted audio');
      await submitQuestion(player, q); await player.locator('#listen-next').click();
      assert.equal((await media(player)).paused, true);
      await player.locator('#play-audio').click();
      await player.waitForFunction(() => !document.querySelector('#lesson-audio').paused);
      await player.locator(`#lesson-checks input[data-lesson="${representative.lesson}"]`).uncheck();
      assert.equal((await media(player)).paused, true);
      await player.locator('#play-audio').click();
      await player.waitForFunction(() => !document.querySelector('#lesson-audio').paused);
      await player.locator('#module-vocabulary').click(); assert.equal((await media(player)).paused, true);
      await player.locator('#module-listening').click(); assert.equal((await media(player)).paused, true);
      assert.equal((await media(player)).events.some(e => e.simultaneous > 1), false);
    });
    await mediaContext.close();

    await step('Pausing or changing question while the real lesson package is loading cancels late playback', async () => {
      const pendingContext = await context(browser), pending = await newPage(pendingContext);
      let release;
      const hold = () => new Promise(resolve => { release = resolve; });
      let held = hold(), intercepted = 0;
      await pending.route(/\/media\/lesson-0[12]\.js(?:\?.*)?$/, async route => {
        intercepted++; await held; await route.continue();
      });
      await startListening(pending, [1]);
      await pending.locator('#play-audio').click();
      await pending.waitForFunction(() => document.querySelector('#audio-status').dataset.state === 'loading');
      await pending.locator('#pause-audio').click(); release();
      await pending.waitForLoadState('networkidle');
      assert.ok(intercepted >= 1); assert.equal((await media(pending)).paused, true);
      assert.equal((await media(pending)).events.some(event => event.type === 'playing'), false);
      await setRate(pending, 1.5); await playToEnd(pending, 'loading-pause-retry');
      await startListening(pending, [2]); held = hold();
      const q = catalog.listening.find(item => item.lesson === 2), before = await media(pending);
      await pending.locator('#play-audio').click();
      await pending.waitForFunction(() => document.querySelector('#audio-status').dataset.state === 'loading');
      await submitQuestion(pending, q); await pending.locator('#listen-next').click(); release();
      await pending.waitForLoadState('networkidle');
      assert.ok(intercepted >= 2); assert.equal((await media(pending)).paused, true);
      assert.equal((await media(pending)).events.some(event => event.sequence > before.sequence && event.type === 'playing'), false);
      const nextId = await questionId(pending);
      const proof = await playToEnd(pending, 'loading-question-cancel-retry'); assert.equal(proof.mediaId, nextId);
      await pendingContext.close();
    });

    await step('An actual lazy media-package request failure preserves the answer; visible retry plays the original clip', async () => {
      const failureContext = await context(browser), failed = await newPage(failureContext);
      let block = true, intercepted = 0;
      await failed.route('**/media/lesson-01.js*', route => {
        if (block) { intercepted++; expectedRequests.add(route.request()); return route.abort('failed'); }
        return route.continue();
      });
      await startListening(failed, [1]); const q = catalog.listening.find(item => item.lesson === 1);
      await failed.locator(`[data-listen-option="${q.answer}"]`).click(); await failed.locator('#play-audio').click();
      await failed.locator('#audio-status[data-state="error"]').waitFor({state: 'visible'});
      assert.ok(intercepted >= 1, 'media package was not actually blocked');
      assert.equal(await failed.locator('#listening-feedback').isVisible(), false);
      const beforeRetry = await download(failed, 'stage3-audio-failure.json');
      assert.equal(beforeRetry.data.listening.session.responses[q.id].selected, q.answer);
      assert.equal(beforeRetry.data.listening.session.responses[q.id].listenCount, 0);
      block = false; await setRate(failed, 1.5); await playToEnd(failed, 'media-package-retry:' + q.id);
      const afterRetry = await download(failed, 'stage3-audio-retried.json');
      assert.equal(afterRetry.data.listening.session.responses[q.id].listenCount, 1);
      assert.equal(afterRetry.data.listening.session.responses[q.id].selected, q.answer);
      assert.equal((await media(failed)).sourceType, 'data');
      await failureContext.close();
    });

    await step('Vocabulary all-selection and empty-selection counts agree with semantic identities and sources', async () => {
      await page.locator('#module-vocabulary').click(); await page.locator('#select-all').click();
      await page.locator('#vocab-filter').selectOption('all');
      const blank = E.blank(), deck = E.makeDeck(blank, catalog, {lessons: allLessons, filter: 'all', shuffle: false});
      assert.equal(deck.mergedCount, new Set(catalog.vocabulary.map(record => record.senseId)).size);
      assert.equal(deck.distinctForms, new Set(catalog.vocabulary.map(record => record.zh)).size);
      assert.equal(await numericData(page, '#selection-summary', 'lessons'), 15);
      assert.equal(await numericData(page, '#selection-summary', 'merged-count'), deck.mergedCount);
      assert.equal(await numericData(page, '#selection-summary', 'filtered-count'), deck.filteredCount);
      assert.equal(await numericData(page, '#selection-summary', 'distinct-forms'), deck.distinctForms);
      report.vocabularyCounts = {records: catalog.vocabulary.length, mergedSenses: deck.mergedCount, distinctForms: deck.distinctForms};
      await page.locator('#clear-lessons').click();
      assert.equal(await numericData(page, '#selection-summary', 'filtered-count'), 0);
      assert.equal(await page.locator('#start-review').isDisabled(), true);
    });

    const sentinelGroups = [{lessons: [3, 6], word: '想', senses: 2}, {lessons: [7, 8, 11], word: '在', senses: 3},
      {lessons: [12], word: '天', senses: 2}, {lessons: [9, 14], word: '上', senses: 3}];
    report.senseChecks = [];
    for (const spec of sentinelGroups) await step(`Vocabulary meaning boundary: ${spec.word} keeps ${spec.senses} senses in lessons ${spec.lessons.join(', ')}`, async () => {
      await startReview(page, spec.lessons);
      const expected = E.makeDeck(E.blank(), catalog, {lessons: spec.lessons, filter: 'all', shuffle: false});
      const target = expected.cards.filter(card => card.zh === spec.word); assert.equal(target.length, spec.senses);
      const found = [];
      for (const [i, card] of expected.cards.entries()) {
        assert.equal(await page.locator('#review-card').getAttribute('data-sense-id'), card.senseId);
        assert.equal(await page.locator('#card-answer').isVisible(), false);
        assert.equal(await page.locator('[data-rating]:not([disabled])').count(), 0);
        if (card.zh === spec.word && card.cueZh) {
          assert.equal(await page.locator('#card-context').innerText(), card.cueZh);
          assert.equal(await page.locator('#card-context').getAttribute('lang'), 'zh-Hans');
          assert.equal((await page.locator('#review-card').innerText()).includes(card.vi), false);
        }
        await page.locator('#reveal-card').click();
        assert.equal(await page.evaluate(() => document.activeElement?.id), 'card-answer');
        const text = await page.locator('#card-answer').innerText(); assert.ok(text.includes(card.vi), card.senseId + ': missing meaning');
        await page.locator('#card-sources > details > summary').click();
        const sources = await page.locator('#card-sources').innerText();
        for (const lesson of card.lessons) assert.match(sources, new RegExp(`Bài\\s+${lesson}(?:\\D|$)`));
        if (card.zh === spec.word) {
          found.push({senseId: card.senseId, meaning: card.vi, lessons: card.lessons});
          if (spec.word === '天' && found.length === 2) {
            await page.setViewportSize({width: 390, height: 844}); await overflow(page, 'Multiple-meaning vocabulary', [320, 390]);
            await screenshot(page, 'stage3-vocabulary-sense-390.png'); await page.setViewportSize({width: 1104, height: 900});
          }
        }
        await page.locator('[data-rating="good"]').click();
        for (const rating of ['again', 'hard', 'good']) assert.equal(await page.locator(`[data-rating="${rating}"]`).isDisabled(), true);
        if (i < expected.cards.length - 1) await page.locator('#card-next').click();
      }
      assert.equal(found.length, spec.senses); assert.equal(new Set(found.map(item => item.senseId)).size, spec.senses);
      report.senseChecks.push({word: spec.word, found});
    });

    await step('Reverse recall hides Chinese until reveal; three self-ratings and current position persist without objective scores', async () => {
      await startReview(page, [1], 'all', 'vi-zh');
      const cards = E.makeDeck(E.blank(), catalog, {lessons: [1], filter: 'all', direction: 'vi-zh', shuffle: false}).cards;
      for (const [i, rating] of ['again', 'hard', 'good'].entries()) {
        const card = cards[i]; assert.equal(await page.locator('#review-card').getAttribute('data-sense-id'), card.senseId);
        assert.equal((await page.locator('#review-card').innerText()).includes(card.zh), false);
        assert.equal(await page.locator('#card-context').count(), 0);
        assert.equal(/\p{Script=Han}/u.test(await page.locator('#review-card').innerText()), false);
        assert.equal(await page.locator('#play-audio').isDisabled(), true);
        await rateCard(page, rating);
        if (i === 0 && card.audioRecordId) {
          const played = await playToEnd(page, 'vocabulary:' + card.senseId);
          assert.equal(played.mediaId, card.audioRecordId);
        }
        if (i < 2) await page.locator('#card-next').click();
      }
      const saved = await download(page, 'stage3-three-ratings.json');
      assert.equal(saved.data.cards.schedule[cards[0].senseId].lastRating, 'again');
      assert.equal(saved.data.cards.schedule[cards[1].senseId].lastRating, 'hard');
      assert.equal(saved.data.cards.schedule[cards[2].senseId].lastRating, 'good');
      assert.equal(E.listeningSummary(saved.data, catalog).overall.latestCorrect, 75);
      await reload(page); assert.equal(await page.locator('#review-card').getAttribute('data-sense-id'), cards[2].senseId);
      assert.equal(await page.locator('#card-answer').isVisible(), true);
      assert.equal(await page.locator('[data-rating="good"]').isDisabled(), true);
      await page.locator('#card-prev').click(); assert.equal(await page.locator('#review-card').getAttribute('data-sense-id'), cards[1].senseId);
      assert.equal(await page.locator('[data-rating="hard"]').isDisabled(), true);
      await startReview(page, [1], 'wrong');
      assert.equal(await page.locator('#review-card').getAttribute('data-sense-id'), cards[0].senseId);
      const wrong = await download(page, 'stage3-vocabulary-wrong.json');
      assert.deepEqual(wrong.data.cards.review.senseIds, [cards[0].senseId]);
      await page.locator('#vocab-filter').selectOption('unfamiliar');
      const expected = E.makeDeck(wrong.data, catalog, {lessons: [1], filter: 'unfamiliar', shuffle: false});
      assert.equal(await numericData(page, '#selection-summary', 'filtered-count'), expected.filteredCount);
    });

    await step('Lesson-4 numeric cards retain their source and work without an invented audio clip', async () => {
      const actualGroups = new Map();
      for (const record of catalog.vocabulary) {
        if (!actualGroups.has(record.senseId)) actualGroups.set(record.senseId, []);
        actualGroups.get(record.senseId).push(record.id);
      }
      report.sourceMergeCoverage = {actualSourceRecords: catalog.vocabulary.length,
        actualSenseIds: actualGroups.size, actualRepeatedSenseIds: [...actualGroups.values()].filter(ids => ids.length > 1).length,
        note: 'The current textbook catalog has no duplicate records of the same sense. Same-sense merging and selection-specific audio are covered by explicit synthetic engine fixtures, not claimed as a real duplicate UI example.'};
      await startReview(page, [4]);
      const lesson4 = E.makeDeck(E.blank(), catalog, {lessons: [4], filter: 'all', shuffle: false}).cards;
      const numeric = lesson4.find(card => /^[零一二三四五六七八九十百两]+$/.test(card.zh) && card.audio === null);
      assert.ok(numeric, 'expected numeric card with an honestly missing recording');
      for (const card of lesson4) {
        await page.locator('#reveal-card').click();
        if (card.senseId === numeric.senseId) {
          assert.equal(await page.locator('#review-card').getAttribute('data-sense-id'), card.senseId);
          assert.equal(await page.locator('#play-audio').isDisabled(), true);
          assert.equal(await page.locator('#audio-controls').isVisible(), false);
          assert.match(await page.locator('#review-card').innerText(), /chưa có đoạn đọc riêng/);
          await page.locator('#card-sources > details > summary').click();
          assert.match(await page.locator('#card-sources').innerText(), /Bài\s+4(?:\D|$)/);
          await page.locator('[data-rating="hard"]').click(); report.missingAudioCard = {senseId: card.senseId, zh: card.zh}; break;
        }
        await page.locator('[data-rating="good"]').click(); await page.locator('#card-next').click();
      }
    });

    const combined = await download(page, 'stage3-combined-review-backup.json');
    await step('Exported listening and vocabulary sessions restore through the file picker; malformed input and previous-version recovery preserve data', async () => {
      const restoredContext = await context(browser, 390), restored = await newPage(restoredContext);
      await importFile(restored, combined.file);
      const readback = await download(restored, 'stage3-combined-roundtrip.json');
      assert.deepEqual(readback.data.listening, combined.data.listening); assert.deepEqual(readback.data.cards, combined.data.cards);
      assert.equal((await media(restored)).paused, true);
      await backupPanel(restored); await restored.locator('#backup-input').fill('{broken JSON');
      await restored.locator('#inspect-backup').click();
      assert.equal(await restored.locator('#apply-backup').count(), 0);
      const unchanged = await download(restored, 'stage3-after-invalid.json');
      assert.deepEqual(unchanged.data.listening, combined.data.listening); assert.deepEqual(unchanged.data.cards, combined.data.cards);
      await restored.locator('#backup-file').setInputFiles(combined.file);
      await restored.locator('#apply-backup').waitFor({state: 'visible'});
      await restored.locator('#backup-input').fill('{edited after preview');
      assert.equal(await restored.locator('#apply-backup').count(), 0);
      await restored.locator('#backup-file').setInputFiles(combined.file);
      await restored.locator('#apply-backup').waitFor({state: 'visible'});
      await restored.locator('#shuffle-items').check();
      await restored.locator('#apply-backup').click();
      assert.match(await restored.locator('#backup-result').innerText(), /trong tab này đã thay đổi/);
      const stillCurrent = await download(restored, 'stage3-preview-invalidated.json');
      assert.deepEqual(stillCurrent.data.listening, combined.data.listening); assert.deepEqual(stillCurrent.data.cards, combined.data.cards);
      const blankFile = writeFixture('stage3-empty-synthetic.json', E.exportBackup(E.blank(), catalog));
      await importFile(restored, blankFile);
      await restored.locator('#restore-previous').click(); await restored.locator('#apply-backup').waitFor({state: 'visible'});
      await restored.locator('#apply-backup').click();
      const recovered = await download(restored, 'stage3-previous-restored.json');
      assert.deepEqual(recovered.data.listening, combined.data.listening); assert.deepEqual(recovered.data.cards, combined.data.cards);
      await restoredContext.close();
    });

    await step('Visible due filtering uses a valid historical backup; early good does not advance the level or postpone the due date', async () => {
      const dueContext = await context(browser), duePage = await newPage(dueContext);
      const now = Date.now(), DAY = 86400000;
      const dueState = scheduleFixture(now - 2 * DAY, now - 1000);
      const firstId = dueState.cards.review.senseIds[0];
      const dueFile = writeFixture('stage3-due-synthetic.json', E.exportBackup(dueState, catalog));
      await importFile(duePage, dueFile); await duePage.locator('#module-vocabulary').click();
      await duePage.locator('#vocab-filter').selectOption('due');
      assert.equal(await numericData(duePage, '#selection-summary', 'filtered-count'), 1);
      await duePage.locator('#start-review').click();
      assert.equal(await duePage.locator('#review-card').getAttribute('data-sense-id'), firstId);
      await rateCard(duePage, 'good');
      const afterDue = await download(duePage, 'stage3-after-due-rating.json');
      assert.equal(afterDue.data.cards.schedule[firstId].level, 2);
      const fullFuture = scheduleFixture(Date.now() - 1000, Date.now() - 1000);
      const futureFile = writeFixture('stage3-future-synthetic.json', E.exportBackup(fullFuture, catalog));
      await importFile(duePage, futureFile); await duePage.locator('#module-vocabulary').click();
      await duePage.locator('#vocab-filter').selectOption('due');
      assert.equal(await numericData(duePage, '#selection-summary', 'filtered-count'), 0);
      assert.equal(await duePage.locator('#start-review').isDisabled(), true);
      await duePage.locator('#vocab-filter').selectOption('all'); await duePage.locator('#start-review').click();
      const id = await duePage.locator('#review-card').getAttribute('data-sense-id');
      const old = fullFuture.cards.schedule[id]; await rateCard(duePage, 'good');
      const early = await download(duePage, 'stage3-early-good.json'), updated = early.data.cards.schedule[id];
      assert.equal(updated.level, old.level); assert.equal(updated.dueAt, old.dueAt);
      assert.equal(updated.reviewCount, old.reviewCount + 1); assert.equal(early.data.cards.review.ratings[id].early, true);
      await duePage.setViewportSize({width: 1104, height: 900}); await screenshot(duePage, 'stage3-review-schedule-desktop.png');
      await dueContext.close();
    });

    await step('Two genuine tabs detect stale writes; the stale draft exports and the newer browser version can be inspected', async () => {
      const tabs = await context(browser), tabB = await newPage(tabs), tabA = await newPage(tabs);
      await startListening(tabA, [1]); const q1 = catalog.listening.find(q => q.lesson === 1);
      await tabA.locator(`[data-listen-option="${q1.answer}"]`).click();
      const savedA = await download(tabA, 'stage3-tab-a.json');
      assert.equal(savedA.data.listening.session.responses[q1.id].selected, q1.answer);
      await tabB.locator('#storage-sync').waitFor({state: 'visible'});
      await startListening(tabB, [2]); const q2 = catalog.listening.find(q => q.lesson === 2);
      await tabB.locator(`[data-listen-option="${q2.answer}"]`).click();
      const savedB = await download(tabB, 'stage3-tab-b-draft.json', '#export-conflict');
      assert.equal(savedB.data.listening.session.responses[q2.id].selected, q2.answer);
      const verify = await newPage(tabs); const stored = await download(verify, 'stage3-tab-stored.json');
      assert.equal(stored.data.listening.session.questionIds[0], q1.id);
      assert.equal(stored.data.listening.session.responses[q1.id].selected, q1.answer);
      assert.equal(stored.data.listening.session.responses[q2.id], undefined);
      await tabB.locator('#inspect-latest').click(); await tabB.locator('#apply-backup').waitFor({state: 'visible'});
      await tabA.locator(`[data-listen-option="${(q1.answer + 1) % 4}"]`).click();
      await tabB.locator('#apply-backup').click();
      assert.match(await tabB.locator('#backup-result').innerText(), /lại thay đổi ở tab khác/);
      assert.equal(await questionId(tabB), q2.id);
      await tabB.locator('#inspect-latest').click(); await tabB.locator('#apply-backup').waitFor({state: 'visible'});
      await tabB.locator('#apply-backup').click(); assert.equal(await questionId(tabB), q1.id);
      assert.equal(await tabB.locator(`[data-listen-option="${(q1.answer + 1) % 4}"]`).getAttribute('aria-pressed'), 'true');
      await tabs.close();
    });

    await step('The final single HTML uses its embedded media, plays to ended and restores a last-lesson answer without external assets', async () => {
      const offlineContext = await context(browser, 390), offline = await newPage(offlineContext, baseURL + 'offline.html');
      assert.equal(await offline.locator('script[src], link[rel="stylesheet"][href]').count(), 0);
      let mediaRequests = 0; offline.on('request', request => { if (/\/media\//.test(request.url())) mediaRequests++; });
      await startListening(offline, [15]); await setRate(offline, 1.5);
      const q = catalog.listening.find(item => item.lesson === 15);
      await playToEnd(offline, 'offline:' + q.id);
      await offline.locator(`[data-listen-option="${q.answer}"]`).click();
      await reload(offline); assert.equal(await questionId(offline), q.id);
      assert.equal(await offline.locator(`[data-listen-option="${q.answer}"]`).getAttribute('aria-pressed'), 'true');
      assert.equal((await media(offline)).paused, true); assert.equal(mediaRequests, 0);
      await overflow(offline, 'Standalone listening');
      await offlineContext.close();
    });

    await step('The rendered teacher guide preserves all question and source IDs, answers, fifteen-lesson navigation and filtering', async () => {
      const teacherContext = await context(browser), teacher = await teacherContext.newPage(); observe(teacher);
      teacher.on('console', message => {
        if (message.type() === 'error') report.errors.push({type: 'teacher-console', message: message.text()});
      });
      await teacher.goto(baseURL + 'teacher.html', {waitUntil: 'networkidle'});
      assert.equal(await teacher.locator('script[src], link[rel="stylesheet"][href]').count(), 0);
      assert.equal(await teacher.locator('[data-toc-lesson]').count(), 15);
      assert.deepEqual(await teacher.locator('[data-toc-lesson]').evaluateAll(nodes => nodes.map(node => Number(node.dataset.tocLesson))), allLessons);
      const rendered = await teacher.locator('[data-question-id]').evaluateAll(nodes => nodes.map(node => ({
        id: node.dataset.questionId, answer: node.querySelector('.answer').innerText,
        source: node.querySelector('.source').innerText})));
      assert.deepEqual(rendered.map(row => row.id).sort(), catalog.listening.map(row => row.id).sort());
      for (const q of catalog.listening) {
        const row = rendered.find(item => item.id === q.id);
        assert.ok(row.answer.includes(q.options[q.answer]), `${q.id}: rendered teacher answer differs`);
        assert.ok(row.answer.includes('ABCD'[q.answer]), `${q.id}: teacher canonical option missing`);
        for (const page of q.source.printPages) assert.ok(row.source.includes(String(page)), `${q.id}: textbook page missing`);
      }
      const sourceIds = await teacher.locator('[data-vocabulary-id]').evaluateAll(nodes => nodes.map(node => node.dataset.vocabularyId));
      assert.deepEqual(sourceIds.sort(), catalog.vocabulary.map(row => row.id).sort());
      assert.equal(await teacher.locator('.lesson:visible').count(), 15);
      for (const lesson of [1, 8, 15]) {
        await teacher.locator('#lesson-filter').selectOption(String(lesson));
        assert.deepEqual(await teacher.locator('.lesson:visible').evaluateAll(nodes => nodes.map(node => Number(node.dataset.lesson))), [lesson]);
        assert.equal(await teacher.locator('.lesson:visible [data-question-id]').count(), 5);
        assert.equal(await teacher.locator('.lesson:visible [data-vocabulary-id]').count(), catalog.vocabulary.filter(row => row.lesson === lesson).length);
        assert.ok((await teacher.locator('#print-scope').innerText()).includes(`第${lesson}课`));
      }
      await teacher.locator('[data-toc-lesson="6"]').click();
      assert.equal(await teacher.locator('#lesson-filter').inputValue(), '6');
      assert.deepEqual(await teacher.locator('.lesson:visible').evaluateAll(nodes => nodes.map(node => Number(node.dataset.lesson))), [6]);
      await teacher.locator('#lesson-filter').selectOption('all');
      assert.equal(await teacher.locator('.lesson:visible').count(), 15);
      await teacher.locator('h1').scrollIntoViewIfNeeded();
      const name = 'stage3-teacher-desktop.png';
      await teacher.screenshot({path: path.join(output, name), fullPage: false});
      report.screenshots.push({file: 'tools/tests/results/' + name, viewport: teacher.viewportSize(), fullPage: false});
      report.teacherGuide = {renderedQuestions: rendered.length, renderedVocabularySources: sourceIds.length,
        lessonNavigation: 15, filtersChecked: [1, 8, 15], navigationWhileFiltered: 6, screenshot: name};
      await teacherContext.close();
    });

    await main.close();
    assert.deepEqual(report.errors, []); assert.deepEqual(report.networkFailures, []);
    report.passed = true;
  } catch (error) { report.errors.push({type: 'test', message: error.message, stack: error.stack}); throw error; }
  finally {
    if (browser) await browser.close(); if (server) server.kill('SIGTERM');
    report.completedAt = new Date().toISOString(); report.serverLog = serverLog;
    fs.writeFileSync(path.join(output, 'stage3-browser.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify({passed: report.passed, checks: report.checks.length, clipsEnded: report.playback.length,
      errors: report.errors.length, networkFailures: report.networkFailures.length, expectedNetworkFailures: report.expectedNetworkFailures.length}));
  }
}
run().catch(error => { console.error(error.stack); process.exitCode = 1; });
