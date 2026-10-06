import test from 'node:test';
import assert from 'node:assert/strict';
import { AUDIO_RATES, createAudioService } from '../src/services/audio/index.ts';

const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};
const turns = async () => { for (let index = 0; index < 5; index++) await Promise.resolve(); };
class Events extends EventTarget {
  listeners = new Map();
  addEventListener(type, listener) { super.addEventListener(type, listener); this.listeners.set(listener, type); }
  removeEventListener(type, listener) { super.removeEventListener(type, listener); this.listeners.delete(listener); }
  emit(type) { this.dispatchEvent(new Event(type)); }
}
class Audio extends Events {
  src = '';
  duration = NaN;
  readyState = 0;
  playbackRate = 1;
  defaultPlaybackRate = 1;
  preservesPitch = false;
  calls = [];
  paused = true;
  seeking = false;
  seekAssignments = [];
  mediaTime = 0;
  pauseCount = 0;
  error = null;
  get currentTime() { return this.mediaTime; }
  set currentTime(value) { this.mediaTime = value; this.seekAssignments.push(value); }
  play() { const call = deferred(); this.calls.push(call); return call.promise; }
  pause() { this.pauseCount++; this.paused = true; this.emit('pause'); }
  load() { this.readyState = 0; this.currentTime = 0; this.duration = NaN; }
  removeAttribute(name) { if (name === 'src') this.src = ''; }
  metadata(duration = 100) { this.readyState = 1; this.duration = duration; this.emit('loadedmetadata'); }
  playing(index = this.calls.length - 1) { this.paused = false; this.emit('playing'); this.calls[index]?.resolve(); }
  time(time) { this.currentTime = time; this.emit('timeupdate'); }
}
class Speech extends Events {
  voices = [];
  spoken = [];
  cancelCount = 0;
  pauseCount = 0;
  getVoices() { return this.voices; }
  createUtterance(text) { const result = new Events(); Object.assign(result, { text, lang: '', rate: 1, voice: null }); return result; }
  speak(utterance) { this.spoken.push(utterance); }
  cancel() { this.cancelCount++; }
  pause() { this.pauseCount++; }
  resume() { this.spoken.at(-1)?.emit('resume'); }
}
function timers() {
  let counter = 0;
  const entries = new Map();
  return {
    setTimer(callback, delay) { const id = ++counter; entries.set(id, { callback, delay }); return id; },
    clearTimer(id) { entries.delete(id); },
    get count() { return entries.size; },
    get delays() { return [...entries.values()].map(value => value.delay); },
    fire() { const all = [...entries.values()]; entries.clear(); for (const entry of all) entry.callback(); },
  };
}
function setup(options = {}) {
  const audio = new Audio(), speech = new Speech(), clock = timers();
  const service = createAudioService({ audio, speech, setTimer: clock.setTimer, clearTimer: clock.clearTimer, ...options });
  return { audio, speech, clock, service };
}
const track = (label = 'Xin chào') => ({ url: '../audio/1-1.mp3', label, start: 1, end: 3, sourceKind: 'segment' });

test('a resolved play promise alone never claims actual playback; metadata sets the real range', async () => {
  const { audio, service } = setup();
  const pending = service.play(track());
  assert.equal(service.snapshot().status, 'loading');
  audio.calls[0].resolve(); await turns();
  assert.equal(service.snapshot().status, 'loading');
  audio.metadata(); assert.equal(audio.currentTime, 1);
  audio.playing(); assert.deepEqual(await pending, { ok: true, code: 'playing' });
  assert.equal(service.snapshot().status, 'playing');
  assert.equal(service.snapshot().sourceKind, 'segment');
  service.dispose();
});

test('generation cancellation ignores a late rejection and an old view abort cannot stop the new request', async () => {
  const { audio, service } = setup();
  const oldView = new AbortController(), newView = new AbortController();
  const old = service.play(track('Cũ'), { signal: oldView.signal });
  const recent = service.play(track('Mới'), { signal: newView.signal });
  assert.deepEqual(await old, { ok: false, code: 'cancelled' });
  oldView.abort();
  audio.calls[0].reject(new Error('late network failure')); await turns();
  assert.equal(service.snapshot().label, 'Mới');
  assert.equal(service.snapshot().status, 'loading');
  audio.metadata(); audio.playing(); await recent;
  newView.abort();
  assert.equal(service.snapshot().status, 'idle');
  assert.equal(audio.paused, true);
  assert.equal(audio.listeners.size, 0);
  service.dispose();
});

test('segment boundaries stop before the next recording; changing speed reschedules the actual media boundary', async () => {
  const { audio, service, clock } = setup();
  const pending = service.play(track()); audio.metadata(); audio.playing(); await pending;
  assert.deepEqual(clock.delays, [2000]);
  audio.currentTime = 2;
  for (const rate of AUDIO_RATES) {
    service.setRate(rate);
    assert.equal(audio.playbackRate, rate);
    assert.equal(audio.preservesPitch, true);
    assert.deepEqual(clock.delays, [1000 / rate]);
  }
  service.setRate(99); assert.equal(audio.playbackRate, 1.5);
  audio.currentTime = 3; clock.fire();
  assert.equal(service.snapshot().status, 'ended');
  assert.equal(audio.paused, true);
  assert.equal(clock.count, 0);
  service.dispose();
});

test('bounded playback preserves the final phoneme tail instead of stopping fifteen milliseconds early',async()=>{
  const {audio,service,clock}=setup();
  const pending=service.play(track());audio.metadata();audio.playing();await pending;
  audio.time(2.986);assert.equal(service.snapshot().status,'playing');assert.equal(audio.paused,false);
  service.setRate(1);assert.ok(clock.delays[0]>13&&clock.delays[0]<15);
  audio.currentTime=2.999;clock.fire();assert.equal(service.snapshot().status,'playing');assert.deepEqual(clock.delays,[2]);
  audio.time(3);assert.equal(service.snapshot().status,'ended');assert.equal(audio.paused,true);assert.equal(clock.count,0);service.dispose();
});

test('playlist advances once per range and stops on a real error instead of skipping or claiming success', async () => {
  const { audio, service } = setup();
  const pending = service.playSequence([track('Một'), { ...track('Hai'), start: 5, end: 8 }]);
  audio.metadata(); audio.playing(); await pending;
  audio.time(3);
  assert.equal(audio.calls.length, 2);
  assert.equal(service.snapshot().index, 2);
  assert.equal(service.snapshot().status, 'loading');
  audio.metadata(); assert.equal(audio.currentTime, 5);
  audio.playing(); audio.error = { message: '404' }; audio.emit('error');
  assert.equal(service.snapshot().status, 'error');
  assert.match(service.snapshot().issue, /404/);
  assert.equal(audio.calls.length, 2);
  service.dispose();
});

test('a late play rejection from a preceding playlist item or paused play cannot poison its successor', async () => {
  const { audio, service } = setup();
  const pending = service.playSequence([track('Một'), track('Hai')]);
  audio.metadata(); audio.paused = false; audio.emit('playing'); await pending;
  audio.time(3);
  audio.calls[0].reject(new Error('obsolete first-item request')); await turns();
  assert.equal(service.snapshot().label, 'Hai');
  assert.equal(service.snapshot().status, 'loading');
  service.pause(); audio.calls[1].reject(new DOMException('paused pending play', 'AbortError')); await turns();
  assert.equal(service.snapshot().status, 'paused');
  const resumed = service.resume(); audio.metadata(); audio.playing(); await resumed;
  assert.equal(service.snapshot().status, 'playing');
  service.dispose();
});

test('pause during a delayed start remains paused; resume waits for playing and replay resets the range', async () => {
  const { audio, service, clock } = setup();
  const pending = service.play(track());
  service.pause(); assert.deepEqual(await pending, { ok: false, code: 'cancelled' });
  audio.metadata(); audio.playing();
  assert.equal(service.snapshot().status, 'paused');
  assert.equal(audio.paused, true);
  assert.equal(clock.count, 0);
  const resumed = service.resume(); audio.playing(); assert.equal((await resumed).ok, true);
  audio.time(2); service.pause();
  assert.equal(service.snapshot().currentTime, 2);
  const replayed = service.replay(); audio.metadata(); audio.playing(); await replayed;
  assert.equal(audio.currentTime, 1);
  assert.equal(audio.calls.length, 3);
  service.dispose();
});

test('an already started clock at HAVE_CURRENT_DATA can recover after waiting; zero/metadata readiness and seek jumps cannot', async () => {
  const { audio, service, clock } = setup();
  const pending = service.play({ ...track(), end: 10 });
  audio.metadata(); audio.playing(); await pending;
  audio.readyState = 2; audio.emit('waiting');
  assert.equal(service.snapshot().status, 'loading');
  assert.deepEqual(clock.delays, [15000]);
  audio.readyState = 0; audio.time(1.2);
  assert.equal(service.snapshot().status, 'loading');
  audio.readyState = 1; audio.time(1.3);
  assert.equal(service.snapshot().status, 'loading');
  audio.seeking = true; audio.emit('seeking');
  audio.readyState = 2; audio.time(5);
  assert.equal(service.snapshot().status, 'loading');
  audio.seeking = false; audio.emit('seeked'); audio.time(5);
  assert.equal(service.snapshot().status, 'loading');
  audio.time(5.1);
  assert.equal(service.snapshot().status, 'playing');
  assert.deepEqual(clock.delays, [4900]);
  audio.time(10);
  assert.equal(service.snapshot().status, 'ended');
  service.dispose();
});

test('clock and readiness cannot invent a first playing event; genuinely stalled resumed media times out', async () => {
  const { audio, service, clock } = setup();
  const first = service.play(track()); audio.metadata();
  audio.calls[0].resolve(); audio.readyState = 4; audio.paused = false; audio.time(1.2);
  assert.equal(service.snapshot().status, 'loading');
  audio.playing();
  // A first playing event at an already advanced, still-muted clock must not
  // discard the opening. Model the subsequent correctly settled native seek.
  assert.equal(service.snapshot().status, 'loading'); assert.equal(audio.muted, true);
  audio.mediaTime = 1; audio.emit('seeked'); await first;
  audio.time(1.2); audio.emit('waiting'); audio.time(1.2);
  assert.equal(service.snapshot().status, 'loading');
  clock.fire();
  assert.equal(service.snapshot().status, 'error');
  service.dispose();
});

test('loading an original track already at zero avoids a redundant initial seek', async () => {
  const { audio, service } = setup();
  const pending = service.play({ url: '../audio/1-2.mp3', label: 'Từ vựng' });
  const assignments = audio.seekAssignments.length;
  audio.metadata(); audio.playing(); await pending;
  assert.equal(audio.seekAssignments.length, assignments);
  service.dispose();
});

test('autoplay denial stays an error until an explicit retry really starts playback', async () => {
  const { audio, service } = setup();
  const denied = service.play(track());
  audio.calls[0].reject(new DOMException('gesture required', 'NotAllowedError'));
  assert.equal((await denied).ok, false);
  assert.equal(service.snapshot().status, 'error');
  assert.match(service.snapshot().issue, /Bấm Nghe lại/);
  const retry = service.replay(); audio.metadata(); audio.playing();
  assert.equal((await retry).ok, true);
  assert.equal(service.snapshot().status, 'playing');
  service.dispose();
});

test('a stalled media start and a silent synthesis start terminate with a retryable error', async () => {
  const { speech, service, clock } = setup();
  const audio = service.play(track());
  clock.fire();
  assert.equal((await audio).code, 'error');
  assert.match(service.snapshot().issue, /chưa bắt đầu/);
  speech.voices = [{ lang: 'zh-CN', name: '普通话' }];
  const tts = service.speak('你好'); clock.fire();
  assert.equal((await tts).code, 'error');
  assert.equal(service.snapshot().status, 'error');
  service.dispose();
});

test('bad ranges are rejected and range beyond media duration never plays', async () => {
  const { audio, service } = setup();
  assert.equal((await service.play({ ...track(), end: 0.5 })).ok, false);
  assert.equal(audio.calls.length, 0);
  const invalid = service.play({ ...track(), start: 101, end: 102 });
  audio.metadata(100);
  assert.equal((await invalid).ok, false);
  assert.equal(service.snapshot().status, 'error');
  assert.equal(audio.paused, true);
  service.dispose();
});

test('metadata rejects a truncated segment and later duration corrections cannot silently shorten it', async () => {
  const { audio, service } = setup();
  const invalid = service.play({ ...track(), end: 10 });
  audio.metadata(9);
  assert.equal((await invalid).ok, false);
  assert.equal(service.snapshot().status, 'error');
  assert.match(service.snapshot().issue, /ngắn hơn/);
  const corrected = service.play({ ...track(), end: 10 });
  audio.metadata(10.1); audio.playing(); await corrected;
  audio.duration = 9.9; audio.emit('durationchange');
  assert.equal(service.snapshot().status, 'error');
  assert.equal(audio.paused, true);
  const smallDecoderDifference = service.play({ ...track(), end: 10 });
  audio.metadata(9.975); audio.playing();
  assert.equal((await smallDecoderDifference).ok, true);
  service.dispose();
});

test('ended before a playing or speech start event reports error and never advances a playlist', async () => {
  const { audio, speech, service } = setup();
  const playlist = service.playSequence([track('Một'), track('Hai')]);
  audio.metadata(); audio.emit('ended');
  assert.equal((await playlist).ok, false);
  assert.equal(service.snapshot().status, 'error');
  assert.equal(service.snapshot().index, 1);
  assert.equal(audio.calls.length, 1);
  speech.voices = [{ lang: 'zh-CN', name: '普通话' }];
  const tts = service.speak('你好'); speech.spoken[0].emit('end');
  assert.equal((await tts).ok, false);
  assert.equal(service.snapshot().status, 'error');
  assert.match(service.snapshot().issue, /trước khi bắt đầu/);
  service.dispose();
});

test('speech waits for a Chinese voice and for a start event, with clear TTS source and selected replay speed', async () => {
  const { speech, service, clock } = setup();
  service.setRate(0.75);
  const pending = service.speak('你好', { label: 'Giọng máy (TTS)' });
  assert.equal(service.snapshot().sourceKind, 'tts');
  speech.voices = [{ lang: 'en-US', name: 'English' }]; speech.emit('voiceschanged');
  assert.equal(speech.spoken.length, 0);
  speech.voices.push({ lang: 'zh-CN', name: '中文' }); speech.emit('voiceschanged');
  assert.equal(speech.spoken.length, 1);
  assert.equal(speech.spoken[0].voice.lang, 'zh-CN');
  assert.equal(speech.spoken[0].rate, 0.75);
  assert.equal(clock.count, 1);
  assert.equal(service.snapshot().status, 'loading');
  speech.spoken[0].emit('start'); assert.equal((await pending).ok, true);
  assert.equal(clock.count, 0);
  service.pause(); assert.equal(service.snapshot().status, 'paused');
  assert.equal((await service.resume()).ok, true);
  speech.spoken[0].emit('end'); assert.equal(service.snapshot().status, 'ended');
  service.dispose();
});

test('a device with only foreign voices reports unsupported, then can retry after Chinese voices arrive', async () => {
  const { speech, service, clock } = setup();
  speech.voices = [{ lang: 'vi-VN', name: 'Vietnamese' }, { lang: 'en-US', name: 'Chinese named English' }];
  const pending = service.speak('我是学生'); clock.fire();
  assert.equal((await pending).code, 'unsupported');
  assert.equal(service.snapshot().status, 'error');
  assert.equal(speech.spoken.length, 0);
  assert.equal(speech.listeners.size, 0);
  speech.voices.push({ lang: 'zh-TW', name: '國語' });
  const retry = service.replay(); speech.spoken[0].emit('start');
  assert.equal((await retry).ok, true);
  service.dispose();
});

test('switching media cancels speech, and a cancelled waiting voice request cannot start after leaving its view', async () => {
  const { speech, audio, service, clock } = setup();
  const view = new AbortController();
  const waiting = service.speak('你好', { signal: view.signal });
  const original = service.play(track());
  assert.equal((await waiting).code, 'cancelled');
  const cancelledCount = speech.cancelCount;
  assert.ok(cancelledCount >= 2);
  speech.voices = [{ lang: 'zh-CN', name: '普通话' }]; speech.emit('voiceschanged');
  view.abort(); assert.deepEqual(clock.delays, [15000]);
  assert.equal(speech.spoken.length, 0);
  audio.metadata(); audio.playing(); await original;
  const utterance = service.speak('再见'); speech.spoken[0].emit('start'); await utterance;
  assert.equal(audio.paused, true);
  assert.equal(service.snapshot().sourceKind, 'tts');
  assert.equal(audio.listeners.size, 0);
  assert.equal(speech.cancelCount, cancelledCount + 1);
  assert.equal(clock.count, 0);
  service.dispose();
});

test('disposal cancels pending work, clears timers and listeners, and isolates observers and snapshots', async () => {
  const { audio, service, clock } = setup();
  let notifications = 0;
  service.subscribe(() => { throw new Error('bad view'); });
  service.subscribe(() => { notifications++; });
  const pending = service.play(track());
  const copy = service.snapshot(); copy.request.label = 'tampered';
  assert.equal(service.snapshot().label, 'Xin chào');
  service.dispose();
  assert.equal((await pending).code, 'cancelled');
  assert.equal(clock.count, 0);
  assert.equal(audio.listeners.size, 0);
  const count = notifications;
  audio.metadata(); audio.playing(); service.setRate(0.75);
  assert.equal(notifications, count);
  assert.equal(service.snapshot().status, 'idle');
  assert.equal((await service.play(track())).code, 'cancelled');
});

test('a view stopping synchronously on a loading notification cannot resurrect media or leave voice timers', async () => {
  const { audio, speech, service, clock } = setup();
  service.subscribe(() => { if (service.snapshot().status === 'loading') service.stop(); });
  assert.equal((await service.play(track())).code, 'cancelled');
  assert.equal(audio.calls.length, 0);
  assert.equal(audio.listeners.size, 0);
  assert.equal((await service.speak('你好')).code, 'cancelled');
  assert.equal(speech.listeners.size, 0);
  assert.equal(clock.count, 0);
  service.dispose();
});


test('a late native resume rejection after the intentional segment boundary cannot replace ended with error', async () => {
  const { audio, service } = setup();
  const first = service.play(track()); audio.metadata(); audio.playing(); await first;
  service.pause();
  const resumed = service.resume();
  // A real engine can dispatch playing while the native resume promise is
  // still unresolved; finishTrack will intentionally pause that attempt.
  audio.paused = false; audio.emit('playing');
  assert.deepEqual(await resumed, { ok: true, code: 'playing' });
  audio.time(3);
  assert.equal(service.snapshot().status, 'ended');
  audio.calls[1].reject(Object.assign(new Error('play interrupted by boundary pause'), { name: 'AbortError' }));
  await turns();
  assert.equal(service.snapshot().status, 'ended'); assert.equal(service.snapshot().issue, null);
  assert.equal(audio.paused, true); service.dispose();
});

test('a retired native play rejection at a sequence boundary cannot fail the next segment', async () => {
  const { audio, service } = setup();
  const first = service.playSequence([track('first'), { ...track('second'), start: 4, end: 6 }]);
  audio.metadata(); audio.paused = false; audio.emit('playing'); await first;
  audio.time(3); assert.equal(service.snapshot().label, 'second');
  audio.calls[0].reject(Object.assign(new Error('old boundary interruption'), { name: 'AbortError' })); await turns();
  assert.equal(service.snapshot().status, 'loading'); audio.metadata(); audio.playing(1);
  assert.equal(service.snapshot().status, 'playing'); assert.equal(service.snapshot().label, 'second'); service.dispose();
});


test('native play plus real advancing ready clock confirms resume when WebKit omits another playing event', async () => {
  const { audio, service } = setup();
  const first = service.play({ url: 'lesson.mp3', label: 'Lesson' }); audio.metadata(); audio.playing(); await first;
  audio.readyState = 2; audio.time(.28); service.pause(); const resumed = service.resume();
  audio.paused = false; audio.emit('play'); audio.emit('waiting');
  assert.equal(service.snapshot().status, 'loading');
  audio.time(.28); assert.equal(service.snapshot().status, 'loading');
  audio.time(.47); assert.equal(service.snapshot().status, 'playing');
  assert.deepEqual(await resumed, { ok: true, code: 'playing' }); service.dispose();
});

test('native play alone cannot invent a first playing event, a stalled resume or a seek jump', async () => {
  const { audio, service, clock } = setup();
  const first = service.play({ url: 'lesson.mp3', label: 'Lesson' }); audio.metadata(); audio.readyState = 2;
  audio.paused = false; audio.emit('play'); audio.time(.2); assert.equal(service.snapshot().status, 'loading');
  audio.playing(); await first; service.pause(); const resumed = service.resume();
  audio.paused = false; audio.emit('play'); audio.seeking = true; audio.emit('seeking'); audio.time(2);
  assert.equal(service.snapshot().status, 'loading');
  audio.seeking = false; audio.emit('seeked'); audio.time(2);
  assert.equal(service.snapshot().status, 'loading');
  clock.fire(); assert.equal(service.snapshot().status, 'error'); assert.equal((await resumed).code, 'error'); service.dispose();
});


test('transient WebKit zero-duration metadata does not reject an original recording or claim playback early', async () => {
  const { audio, service } = setup();
  const pending = service.play({ url: 'original.mp3', label: 'Original', sourceKind: 'original' });
  audio.metadata(0);
  assert.equal(service.snapshot().status, 'loading');
  assert.equal(service.snapshot().issue, null);
  audio.duration = 44.4; audio.emit('durationchange');
  audio.playing(); assert.deepEqual(await pending, { ok: true, code: 'playing' });
  audio.time(0.2); assert.equal(service.snapshot().currentTime, 0.2);
  service.dispose();
});

test('zero-duration placeholder never bypasses a later real truncated-segment check', async () => {
  const { audio, service } = setup();
  const pending = service.play({ url: 'short.mp3', label: 'Segment', start: 1, end: 5 });
  audio.metadata(0); assert.equal(service.snapshot().status, 'loading');
  audio.duration = 3; audio.emit('durationchange');
  assert.equal((await pending).ok, false);
  assert.equal(service.snapshot().status, 'error');
  service.dispose();
});


test('playing before positive metadata waits; positive duration then confirms the actual native start', async () => {
  const { audio, service } = setup();
  const pending = service.play({ url: 'delayed.mp3', label: 'Delayed metadata' });
  audio.metadata(0); audio.playing();
  assert.equal(service.snapshot().status, 'loading');
  audio.duration = 12; audio.emit('durationchange');
  assert.equal((await pending).ok, true);
  assert.equal(service.snapshot().status, 'playing');
  service.dispose();
});

test('canplay or permanent zero duration never substitutes for confirmed usable playback', async () => {
  const { audio, service, clock } = setup();
  const pending = service.play({ url: 'empty.mp3', label: 'Empty recording' });
  audio.metadata(0); audio.emit('canplay'); audio.playing();
  assert.equal(service.snapshot().status, 'loading');
  clock.fire();
  assert.equal((await pending).ok, false);
  assert.equal(service.snapshot().status, 'error');
  service.dispose();
});

test('empty/corrupt media ending at zero and metadata seek exceptions remain hard failures', async () => {
  const first = setup();
  const empty = first.service.play({ url: 'empty.mp3', label: 'Empty' });
  first.audio.metadata(0); first.audio.emit('ended');
  assert.equal((await empty).ok, false); first.service.dispose();
  const second = setup();
  const seeking = second.service.play(track());
  Object.defineProperty(second.audio, 'currentTime', { get() { return 0; }, set(value) { if (value !== 0) throw new DOMException('Seek failed', 'InvalidStateError'); } });
  second.audio.metadata(100);
  assert.equal((await seeking).ok, false);
  assert.equal(second.service.snapshot().status, 'error');
  second.service.dispose();
});


test('persistent zero metadata on a whole recording requires two real native clock advances', async () => {
 const {audio,service}=setup();const pending=service.play({url:'whole.mp3',label:'Whole original'});
 audio.metadata(0);audio.readyState=2;audio.playing();audio.time(.2);
 assert.equal(service.snapshot().status,'loading');audio.time(.4);
 assert.equal((await pending).ok,true);assert.equal(service.snapshot().status,'playing');service.dispose();
});
test('zero-metadata clock recovery cannot certify bounded clips, paused clocks or seek jumps', async () => {
 const a=setup();const bounded=a.service.play({url:'segment.mp3',label:'Bounded',start:0,end:5});
 a.audio.metadata(0);a.audio.readyState=2;a.audio.playing();a.audio.time(.2);a.audio.time(.4);
 assert.equal(a.service.snapshot().status,'loading');a.clock.fire();assert.equal((await bounded).ok,false);a.service.dispose();
 const b=setup();const whole=b.service.play({url:'whole.mp3',label:'Whole'});b.audio.metadata(0);b.audio.readyState=2;b.audio.playing();
 b.audio.seeking=true;b.audio.emit('seeking');b.audio.time(20);b.audio.seeking=false;b.audio.emit('seeked');b.audio.time(20);
 assert.equal(b.service.snapshot().status,'loading');b.audio.paused=true;b.audio.time(21);
 assert.equal(b.service.snapshot().status,'loading');b.clock.fire();assert.equal((await whole).ok,false);b.service.dispose();
});


test('WebKit silent positive duration on timeupdate confirms playback without restarting the original', async () => {
 const {audio,service}=setup();const pending=service.play({url:'original.mp3',label:'Original'});
 audio.metadata(0);audio.readyState=4;audio.playing();assert.equal(service.snapshot().status,'loading');
 audio.duration=27.408;audio.mediaTime=.2505;const seeks=audio.seekAssignments.length;audio.emit('timeupdate');
 assert.equal((await pending).ok,true);assert.equal(service.snapshot().status,'playing');
 assert.equal(audio.currentTime,.2505);assert.equal(audio.seekAssignments.length,seeks);service.dispose();
});
test('silent positive duration still rejects truncated segments and does not certify a paused or seeking clock', async () => {
 const a=setup();const bounded=a.service.play({url:'short.mp3',label:'Short',start:0,end:5});
 a.audio.metadata(0);a.audio.playing();a.audio.duration=3;a.audio.time(.25);
 assert.equal((await bounded).ok,false);assert.equal(a.service.snapshot().status,'error');a.service.dispose();
 const b=setup();const whole=b.service.play({url:'whole.mp3',label:'Whole'});
 b.audio.metadata(0);b.audio.playing();b.audio.duration=10;b.audio.seeking=true;b.audio.time(2);
 assert.equal(b.service.snapshot().status,'loading');b.audio.seeking=false;b.audio.paused=true;b.audio.time(3);
 assert.equal(b.service.snapshot().status,'loading');b.clock.fire();assert.equal((await whole).ok,false);b.service.dispose();
});
test('bounded original clips stay silent through WebKit zero duration and until the initial seek settles',async()=>{
 const {audio,service}=setup();const pending=service.play(track());assert.equal(audio.muted,true);audio.readyState=4;audio.duration=0;audio.playing();assert.equal(service.snapshot().status,'loading');assert.equal(audio.muted,true);audio.duration=100;audio.seeking=true;audio.emit('durationchange');assert.equal(audio.currentTime,1);assert.equal(audio.muted,true);assert.equal(service.snapshot().status,'loading');audio.seeking=false;audio.emit('seeked');assert.equal(audio.muted,false);assert.equal(service.snapshot().status,'playing');assert.equal((await pending).ok,true);service.dispose();
});
test('an original whole track is not accidentally left muted after a cancelled bounded clip',async()=>{
 const {audio,service}=setup();const pending=service.play(track());assert.equal(audio.muted,true);service.stop();assert.equal((await pending).code,'cancelled');const whole=service.play({url:'whole.mp3',label:'Whole original'});assert.equal(audio.muted,false);audio.metadata();audio.playing();assert.equal((await whole).ok,true);service.dispose();
});
