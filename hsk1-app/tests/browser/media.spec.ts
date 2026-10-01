import { readFile } from 'node:fs/promises';
import { test, expect, type Page } from '@playwright/test';
import { createTextbookContent } from '../../src/services/content/textbook.ts';

const source = JSON.parse(await readFile(new URL('../../content/textbook.json', import.meta.url), 'utf8'));
const media = JSON.parse(await readFile(new URL('../../content/media-references.json', import.meta.url), 'utf8'));
const catalog = JSON.parse(await readFile(new URL('../../content/stage3-catalog.json', import.meta.url), 'utf8'));
const content = createTextbookContent(source, media, catalog);
type MediaObservation = { src: string; time: number; duration: number; rate: number; paused: boolean; ended: boolean; count: number };

async function authenticateAndObserveNativeMedia(page: Page): Promise<void> {
  await page.addInitScript(() => {
    sessionStorage.setItem('hsk_portal_unlocked_v2', '1');
    const state = window as unknown as {
      __nativeMedia: HTMLMediaElement[]; __nativePlayCalls: number;
      __mediaHistory: Record<string, unknown>[]; __mediaEventCounts: Record<string, number>;
    };
    state.__nativeMedia = []; state.__nativePlayCalls = 0; state.__mediaHistory = []; state.__mediaEventCounts = {};
    const watched = new WeakSet<HTMLMediaElement>();
    let sequence = 0;
    function record(event: string, audio?: HTMLMediaElement, detail?: string): void {
      state.__mediaEventCounts[event] = (state.__mediaEventCounts[event] ?? 0) + 1;
      state.__mediaHistory.push({ sequence: ++sequence, atMs: Math.round(performance.now()), event, detail,
        sourceAttribute: audio?.getAttribute('src'), src: audio?.currentSrc, time: audio?.currentTime,
        duration: audio?.duration, rate: audio?.playbackRate, paused: audio?.paused, ended: audio?.ended,
        readyState: audio?.readyState, networkState: audio?.networkState, seeking: audio?.seeking,
        errorCode: audio?.error?.code, errorMessage: audio?.error?.message,
        uiState: document.querySelector<HTMLElement>('#audio-player')?.dataset.state,
        uiLabel: document.querySelector('#audio-status')?.textContent,
        position: document.querySelector('#audio-position')?.textContent });
      if (state.__mediaHistory.length > 240) state.__mediaHistory.shift();
    }
    function observe(audio: HTMLMediaElement): void {
      if (watched.has(audio)) return;
      watched.add(audio);
      for (const name of ['loadstart', 'loadedmetadata', 'durationchange', 'loadeddata', 'canplay', 'canplaythrough',
        'play', 'playing', 'waiting', 'stalled', 'suspend', 'pause', 'seeking', 'seeked', 'timeupdate', 'ended', 'emptied', 'error', 'ratechange']) {
        audio.addEventListener(name, () => record(name, audio));
      }
    }
    const originalLoad = HTMLMediaElement.prototype.load;
    HTMLMediaElement.prototype.load = function () { observe(this); record('load-call', this); return originalLoad.call(this); };
    const originalPause = HTMLMediaElement.prototype.pause;
    HTMLMediaElement.prototype.pause = function () { observe(this); record('pause-call', this); return originalPause.call(this); };
    const originalPlay = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
      observe(this);
      if (!state.__nativeMedia.includes(this)) state.__nativeMedia.push(this);
      state.__nativePlayCalls++;
      record('play-call', this);
      // Observe real events and promise settlement; native playback and timing remain intact.
      const result = originalPlay.call(this);
      void result.then(() => record('play-promise-resolved', this), error => record('play-promise-rejected', this, `${error?.name}: ${error?.message}`));
      return result;
    };
    document.addEventListener('DOMContentLoaded', () => {
      let last = '';
      const observer = new MutationObserver(() => {
        const panel = document.querySelector<HTMLElement>('#audio-player');
        const key = `${panel?.dataset.state}:${document.querySelector('#audio-status')?.textContent}:${document.querySelector('#audio-position')?.textContent}`;
        if (key !== last) { last = key; record('ui-change', state.__nativeMedia[0]); }
      });
      observer.observe(document.body, { subtree: true, attributes: true, attributeFilter: ['data-state'], childList: true, characterData: true });
    }, { once: true });
  });
}
test.afterEach(async ({ page }, testInfo) => {
  if (page.isClosed()) return;
  const failed = testInfo.status !== testInfo.expectedStatus;
  const diagnostic = await page.evaluate(() => {
    const state = window as unknown as { __mediaHistory?: Record<string, unknown>[]; __nativePlayCalls?: number; __mediaEventCounts?: Record<string, number> };
    return { url: location.href, userAgent: navigator.userAgent, nativePlayCalls: state.__nativePlayCalls,
      eventCounts: state.__mediaEventCounts ?? {}, history: state.__mediaHistory ?? [], moduleState: document.querySelector<HTMLElement>('#module-host')?.dataset.state };
  }).catch(error => ({ diagnosticError: String(error) }));
  if (!failed && 'history' in diagnostic) diagnostic.history = diagnostic.history.slice(-80);
  await testInfo.attach(failed ? 'native-media-failure-history' : 'native-media-success-sample', { body: Buffer.from(JSON.stringify(diagnostic, null, 2)), contentType: 'application/json' });
});

async function native(page: Page): Promise<MediaObservation> {
  return page.evaluate(() => {
    const state = window as unknown as { __nativeMedia: HTMLMediaElement[]; __nativePlayCalls: number };
    const audio = state.__nativeMedia[0];
    return { src: audio?.currentSrc ?? '', time: audio?.currentTime ?? 0, duration: audio?.duration ?? 0, rate: audio?.playbackRate ?? 0,
      paused: audio?.paused ?? true, ended: audio?.ended ?? false, count: state.__nativeMedia.length };
  });
}
async function ready(page: Page, lesson: number): Promise<void> {
  await expect(page.locator('#module-host')).toHaveAttribute('data-state', 'ready');
  await expect(page.locator('#module-host')).toHaveAttribute('data-feature', 'textbook');
  await expect(page.locator('#module-host')).toHaveAttribute('data-lesson', String(lesson));
}
async function playing(page: Page, expectedPath: string, minimum: number): Promise<void> {
  await expect(page.locator('#audio-player')).toHaveAttribute('data-state', 'playing');
  await expect.poll(async () => (await native(page)).src).toContain(expectedPath);
  await expect.poll(async () => (await native(page)).time).toBeGreaterThan(minimum + .035);
  const observed = await native(page);
  expect(observed.duration).toBeGreaterThan(0);
  expect(observed.paused).toBe(false);
  expect(observed.count).toBe(1);
  await expect(page.locator('#audio-status')).toContainText('Âm thanh gốc giáo trình');
}
async function seekNative(page: Page, time: number): Promise<void> {
  await page.evaluate(value => {
    const audio = (window as unknown as { __nativeMedia: HTMLMediaElement[] }).__nativeMedia[0]!;
    audio.currentTime = value;
  }, time);
}


test('representative words and scenes in lessons 1, 10 and 15 and all three tongue twisters use real original MP3 playback', async ({ page }) => {
  test.setTimeout(60_000);
  await authenticateAndObserveNativeMedia(page);
  for (const lesson of [1, 10, 15]) {
    await page.goto(`/#/textbook?lesson=${lesson}&section=vocab`);
    await ready(page, lesson);
    const word = content.lessons[lesson - 1]!.vocab[0]!;
    const sound = content.resolveWord(lesson, word.id);
    expect(sound.available).toBe(true);
    if (!sound.available) throw new Error('Representative word has no original audio.');
    await page.locator(`[data-vocab-audio="${word.id}"]`).click();
    await playing(page, `/course-assets/audio/${sound.track.id}.mp3`, sound.request.start ?? 0);
    expect((await native(page)).time).toBeLessThan(sound.request.end! + .15);
    await page.locator('#audio-stop').click();
    await expect(page.locator('#audio-player')).toHaveAttribute('data-state', 'idle');
    await page.locator('[data-section="text"]').click();
    await ready(page, lesson);
    const scene = content.lessons[lesson - 1]!.scenes[0]!;
    const sceneSound = content.resolveScene(lesson, scene.id);
    if (!sceneSound.available) throw new Error('Representative scene has no original audio.');
    await page.locator(`[data-scene-audio="${scene.id}"]`).click();
    await playing(page, `/course-assets/audio/${sceneSound.track.id}.mp3`, 0);
    await page.locator('#audio-stop').click();
  }
  for (const lesson of [1, 2, 3]) {
    await page.goto(`/#/textbook?lesson=${lesson}&section=text`);
    await ready(page, lesson);
    await page.locator(`[data-tongue-audio="${lesson}"]`).click();
    await playing(page, `/course-assets/audio/${lesson}-7.mp3`, 0);
    await page.locator('#audio-stop').click();
  }
});

test('native word and line segments stop at their boundaries and the three original vocabulary tracks continue in order', async ({ page }) => {
  await authenticateAndObserveNativeMedia(page);
  await page.goto('/#/textbook?lesson=1&section=vocab');
  await ready(page, 1);
  await page.locator('#audio-rate').selectOption('1.5');
  const word = content.lessons[0]!.vocab[0]!;
  const sound = content.resolveWord(1, word.id);
  if (!sound.available) throw new Error('Missing frozen segment.');
  await page.locator(`[data-vocab-audio="${word.id}"]`).click();
  await playing(page, `/course-assets/audio/${sound.track.id}.mp3`, sound.request.start!);
  await expect(page.locator('#audio-player')).toHaveAttribute('data-state', 'ended');
  const ended = await native(page);
  expect(ended.paused).toBe(true);
  expect(ended.time).toBeGreaterThanOrEqual(sound.request.end! - .08);
  expect(ended.time).toBeLessThanOrEqual(sound.request.end! + .15);
  await page.locator('#vocab-play-all').click();
  const playlist = content.vocabPlaylist(1);
  await playing(page, '/course-assets/audio/1-2.mp3', 0);
  await expect(page.locator('#audio-position')).toHaveText('Mục 1 / 3');
  const firstDuration = (await native(page)).duration;
  await seekNative(page, firstDuration - .08);
  await expect(page.locator('#audio-position')).toHaveText('Mục 2 / 3');
  await playing(page, '/course-assets/audio/1-4.mp3', 0);
  expect(playlist.map(value => value.url)).toEqual(['course-assets/audio/1-2.mp3', 'course-assets/audio/1-4.mp3', 'course-assets/audio/1-6.mp3']);
  await seekNative(page, (await native(page)).duration - .08);
  await expect(page.locator('#audio-position')).toHaveText('Mục 3 / 3');
  await playing(page, '/course-assets/audio/1-6.mp3', 0);
  await seekNative(page, (await native(page)).duration - .08);
  await expect(page.locator('#audio-player')).toHaveAttribute('data-state', 'ended');
  expect((await native(page)).ended).toBe(true);
  await page.locator('[data-section="text"]').click();
  await ready(page, 1);
  const scene = content.lessons[0]!.scenes[0]!;
  const line = scene.lines[0]!;
  const segment = content.resolveLine(1, scene.id, line.id);
  if (!segment.available) throw new Error('Missing frozen line segment.');
  await page.locator(`[data-line-audio="${line.id}"]`).click();
  await playing(page, '/course-assets/audio/1-1.mp3', segment.request.start!);
  await expect(page.locator('#audio-player')).toHaveAttribute('data-state', 'ended');
  expect((await native(page)).time).toBeLessThanOrEqual(segment.request.end! + .15);
});

test('pause, resume, slow rate and replay control the native clock, listening mode hides and restores text, and navigation stops playback', async ({ page }) => {
  await authenticateAndObserveNativeMedia(page);
  await page.goto('/#/textbook?lesson=15&section=text');
  await ready(page, 15);
  await page.locator('#text-listen-mode').check();
  await expect(page.locator('[data-original-text]').first()).toBeHidden();
  await page.locator('#text-show-original').check();
  await expect(page.locator('[data-original-text]').first()).toBeVisible();
  await page.locator('#text-show-original').uncheck();
  await expect(page.locator('[data-original-text]').first()).toBeHidden();
  await page.locator('#text-listen-mode').uncheck();
  await expect(page.locator('[data-original-text]').first()).toBeVisible();
  await page.locator('#scene-slow').click();
  await playing(page, '/course-assets/audio/15-1.mp3', 0);
  expect((await native(page)).rate).toBe(.75);
  await page.locator('#audio-pause').click();
  await expect(page.locator('#audio-player')).toHaveAttribute('data-state', 'paused');
  const paused = await native(page);
  expect(paused.paused).toBe(true);
  await page.waitForTimeout(150);
  expect((await native(page)).time).toBeCloseTo(paused.time, 2);
  await page.locator('#audio-resume').click();
  await expect(page.locator('#audio-player')).toHaveAttribute('data-state', 'playing');
  await expect.poll(async () => (await native(page)).time).toBeGreaterThan(paused.time + .035);
  await seekNative(page, 2);
  await page.locator('#audio-replay').click();
  await playing(page, '/course-assets/audio/15-1.mp3', 0);
  expect((await native(page)).time).toBeLessThan(1);
  await page.locator('#audio-rate').selectOption('0.65');
  expect((await native(page)).rate).toBe(.65);
  await page.locator('#feature-nav [data-feature="homework"]').click();
  await expect(page.locator('#module-host')).toHaveAttribute('data-feature', 'homework');
  await expect(page.locator('#module-host')).toHaveAttribute('data-state', 'ready');
  expect((await native(page)).paused).toBe(true);
  await expect(page.locator('#audio-player')).toHaveCount(0);
});

test('an original MP3 HTTP failure reports error and native replay recovers without a fake success', async ({ page }) => {
  await authenticateAndObserveNativeMedia(page);
  let failures = 0;
  await page.route('**/course-assets/audio/10-1.mp3', async route => {
    if (failures++ === 0) await route.fulfill({ status: 404, body: 'Missing original audio', contentType: 'text/plain' });
    else await route.continue();
  });
  await page.goto('/#/textbook?lesson=10&section=text');
  await ready(page, 10);
  await page.locator('[data-scene-audio]').click();
  await expect(page.locator('#audio-player')).toHaveAttribute('data-state', 'error');
  await expect(page.locator('#audio-status')).not.toHaveText('');
  expect((await native(page)).paused).toBe(true);
  await page.locator('#audio-replay').click();
  await playing(page, '/course-assets/audio/10-1.mp3', 0);
  expect(failures).toBeGreaterThanOrEqual(2);
});

test('a delayed native play promise from an abandoned view cannot replace or stop the newest request', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await authenticateAndObserveNativeMedia(page);
  await page.addInitScript(() => {
    const state = window as unknown as { __releaseDelayedNativePlay?: () => void; __delayFirstNativePlay: boolean };
    state.__delayFirstNativePlay = true;
    const original = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
      const real = original.call(this);
      if (!state.__delayFirstNativePlay) return real;
      state.__delayFirstNativePlay = false;
      const held = new Promise<void>(resolve => { state.__releaseDelayedNativePlay = resolve; });
      return real.then(() => held);
    };
  });
  await page.goto('/#/textbook?lesson=1&section=text');
  await ready(page, 1);
  await page.locator('[data-scene-audio]').click();
  await playing(page, '/course-assets/audio/1-1.mp3', 0);
  await page.locator('#lesson-select').selectOption('10');
  await ready(page, 10);
  expect((await native(page)).paused).toBe(true);
  await page.locator('[data-scene-audio]').click();
  await playing(page, '/course-assets/audio/10-1.mp3', 0);
  await page.evaluate(() => (window as unknown as { __releaseDelayedNativePlay?: () => void }).__releaseDelayedNativePlay?.());
  await playing(page, '/course-assets/audio/10-1.mp3', 0);
  let delayedFetch: any;
  await page.route('**/course-assets/audio/15-1.mp3', route => { delayedFetch = route; });
  await page.locator('#lesson-select').selectOption('15');
  await ready(page, 15);
  await page.locator('[data-scene-audio]').click();
  await expect.poll(() => Boolean(delayedFetch)).toBe(true);
  await expect(page.locator('#audio-player')).toHaveAttribute('data-state', 'loading');
  await page.locator('#lesson-select').selectOption('10');
  await ready(page, 10);
  await delayedFetch.abort('failed');
  await page.locator('[data-scene-audio]').click();
  await playing(page, '/course-assets/audio/10-1.mp3', 0);
  await page.locator('[data-section="vocab"]').click();
  await ready(page, 10);
  const words = content.lessons[9]!.vocab;
  const firstWord = words[0]!;
  const firstSound = content.resolveWord(10, firstWord.id);
  if (!firstSound.available) throw new Error('Missing detail audio.');
  await page.locator(`[data-vocab-detail="${firstWord.id}"]`).click();
  await page.locator('#word-detail [data-vocab-audio]').click();
  await playing(page, `/course-assets/audio/${firstSound.track.id}.mp3`, firstSound.request.start!);
  await page.locator('#word-next').click();
  expect((await native(page)).paused).toBe(true);
  const nextSound = content.resolveWord(10, words[1]!.id);
  if (!nextSound.available) throw new Error('Missing next detail audio.');
  await page.locator('#word-detail [data-vocab-audio]').click();
  await playing(page, `/course-assets/audio/${nextSound.track.id}.mp3`, nextSound.request.start!);
  await page.locator('#word-close').click();
  expect((await native(page)).paused).toBe(true);
  await page.locator(`[data-vocab-detail="${firstWord.id}"]`).click();
  await page.locator('#word-detail [data-vocab-audio]').click();
  await playing(page, `/course-assets/audio/${firstSound.track.id}.mp3`, firstSound.request.start!);
  await page.locator(`.vocab-card[data-word-id="${firstWord.id}"] [data-vocab-audio]`).click();
  await playing(page, `/course-assets/audio/${firstSound.track.id}.mp3`, firstSound.request.start!);
  await page.locator('#word-close').click();
  await playing(page, `/course-assets/audio/${firstSound.track.id}.mp3`, firstSound.request.start!);
  expect(errors).toEqual([]);
});

test('missing official word audio stays disabled and a device without a Chinese voice gets an explicit TTS message', async ({ page }) => {
  await authenticateAndObserveNativeMedia(page);
  await page.addInitScript(() => {
    if ('speechSynthesis' in window) Object.defineProperty(speechSynthesis, 'getVoices', { configurable: true, value: () => [] });
  });
  for (const lesson of [...new Set(media.missingWordAudio.map((item: any) => item.lesson))] as number[]) {
    await page.goto(`/#/textbook?lesson=${lesson}&section=vocab`);
    await ready(page, lesson);
    for (const item of media.missingWordAudio.filter((item: any) => item.lesson === lesson)) {
      const word = content.lessons[lesson - 1]!.vocab.find(value => value.catalogIds.includes(item.id))!;
      await expect(page.locator(`[data-vocab-audio="${word.id}"]`)).toBeDisabled();
      await expect(page.locator(`[data-vocab-audio="${word.id}"]`)).toContainText('Chưa có âm thanh gốc riêng');
    }
  }
  expect((await native(page)).count).toBe(0);
  await page.goto('/#/textbook?lesson=1&section=grammar');
  await ready(page, 1);
  await page.locator('[data-tts]').first().click();
  await expect(page.locator('#audio-player')).toHaveAttribute('data-state', 'error');
  await expect(page.locator('#audio-status')).toContainText(/tiếng Trung|giọng/);
  expect((await native(page)).count).toBe(0);
});
