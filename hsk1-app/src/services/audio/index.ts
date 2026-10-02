export const AUDIO_RATES = [0.65, 0.75, 1, 1.25, 1.5] as const;
export type AudioStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'ended' | 'error';
export type AudioRequest = Readonly<{
  url: string;
  label: string;
  start?: number;
  end?: number;
  sourceKind?: 'original' | 'segment';
}>;
export type PlaybackResult = Readonly<{
  ok: boolean;
  code: 'playing' | 'cancelled' | 'error' | 'unsupported';
  issue?: string;
}>;
export type AudioSnapshot = Readonly<{
  status: AudioStatus;
  label: string;
  sourceKind: 'original' | 'segment' | 'tts' | null;
  issue: string | null;
  rate: number;
  currentTime: number;
  request: AudioRequest | null;
  index: number;
  total: number;
}>;

interface EventPort {
  addEventListener(type: string, listener: EventListener): void;
  removeEventListener(type: string, listener: EventListener): void;
}
export interface AudioPort extends EventPort {
  src: string;
  currentTime: number;
  duration: number;
  readyState: number;
  playbackRate: number;
  defaultPlaybackRate: number;
  preservesPitch: boolean;
  readonly paused: boolean;
  readonly seeking: boolean;
  error?: { message?: string } | null;
  play(): Promise<void>;
  pause(): void;
  load(): void;
  removeAttribute(name: string): void;
}
export type SpeechVoice = Readonly<{ lang: string; name: string }>;
export interface SpeechUtterancePort extends EventPort {
  lang: string;
  rate: number;
  voice: SpeechVoice | null;
}
export interface SpeechPort extends EventPort {
  getVoices(): readonly SpeechVoice[];
  createUtterance(text: string): SpeechUtterancePort;
  speak(utterance: SpeechUtterancePort): void;
  cancel(): void;
  pause(): void;
  resume(): void;
}
export interface AudioService {
  play(request: AudioRequest, options?: { signal?: AbortSignal }): Promise<PlaybackResult>;
  playSequence(requests: readonly AudioRequest[], options?: { signal?: AbortSignal }): Promise<PlaybackResult>;
  speak(text: string, options?: { label?: string; signal?: AbortSignal }): Promise<PlaybackResult>;
  pause(): void;
  resume(): Promise<PlaybackResult>;
  replay(): Promise<PlaybackResult>;
  stop(): void;
  setRate(rate: number): void;
  snapshot(): AudioSnapshot;
  subscribe(listener: () => void): () => void;
  dispose(): void;
}

type Active = {
  generation: number;
  signal?: AbortSignal;
  requests?: readonly AudioRequest[];
  text?: string;
  label: string;
  index: number;
  paused: boolean;
  playVersion: number;
  trackStarted: boolean;
  utterance?: SpeechUtterancePort;
  cleanups: (() => void)[];
  trackCleanups: (() => void)[];
  pending: ((result: PlaybackResult) => void)[];
  startupTimer?: ReturnType<typeof setTimeout>;
};
const cancelled: PlaybackResult = { ok: false, code: 'cancelled' };

// The DOM adapter is the only browser-specific part. The player owns one audio
// element and keeps request cancellation separate from application disposal.
export function createAudioService(options: {
  audio: AudioPort;
  speech?: SpeechPort;
  setTimer?: (callback: () => void, delay: number) => ReturnType<typeof setTimeout>;
  clearTimer?: (id: ReturnType<typeof setTimeout>) => void;
  voiceWaitMs?: number;
  playbackWaitMs?: number;
}): AudioService {
  const { audio, speech } = options;
  const setTimer = options.setTimer ?? ((callback, delay) => setTimeout(callback, delay));
  const clearTimer = options.clearTimer ?? (id => clearTimeout(id));
  const listeners = new Set<() => void>();
  let state: AudioSnapshot = { status: 'idle', label: '', sourceKind: null, issue: null,
    rate: 1, currentTime: 0, request: null, index: 0, total: 0 };
  let generation = 0;
  let active: Active | undefined;
  let boundaryTimer: ReturnType<typeof setTimeout> | undefined;
  let disposed = false;

  function publish(changes: Partial<AudioSnapshot>): void {
    state = { ...state, ...changes };
    for (const listener of [...listeners]) {
      try { listener(); } catch { /* A failed view must not stop another view's player. */ }
    }
  }
  const current = (request: Active) => !disposed && active === request && request.generation === generation;
  function clearBoundary(): void {
    if (boundaryTimer !== undefined) clearTimer(boundaryTimer);
    boundaryTimer = undefined;
  }
  function settle(request: Active, result: PlaybackResult): void {
    if (request.startupTimer !== undefined) clearTimer(request.startupTimer);
    request.startupTimer = undefined;
    for (const resolve of request.pending.splice(0)) resolve(result);
  }
  function wait(request: Active): Promise<PlaybackResult> {
    return new Promise(resolve => request.pending.push(resolve));
  }
  function guardStartup(request: Active): void {
    if (request.startupTimer !== undefined) clearTimer(request.startupTimer);
    request.startupTimer = setTimer(() => {
      request.startupTimer = undefined;
      if (current(request) && state.status === 'loading') fail(request,
        'Âm thanh chưa bắt đầu phát. Kiểm tra kết nối rồi bấm Nghe lại.');
    }, options.playbackWaitMs ?? 15000);
  }
  function listen(port: EventPort, type: string, handler: () => void, cleanups: (() => void)[]): void {
    const listener: EventListener = handler;
    port.addEventListener(type, listener);
    cleanups.push(() => port.removeEventListener(type, listener));
  }
  function release(request: Active): void {
    for (const cleanup of request.trackCleanups.splice(0)) cleanup();
    for (const cleanup of request.cleanups.splice(0)) cleanup();
    settle(request, cancelled);
  }
  function halt(): void {
    generation++;
    clearBoundary();
    if (active) release(active);
    active = undefined;
    audio.pause();
    try { speech?.cancel(); } catch { /* Some browsers expose an unavailable synthesis engine. */ }
  }
  function fail(request: Active, issue: string, code: 'error' | 'unsupported' = 'error'): void {
    if (!current(request)) return;
    clearBoundary();
    for (const cleanup of request.trackCleanups.splice(0)) cleanup();
    audio.pause();
    try { speech?.cancel(); } catch { /* Retain the useful original playback error. */ }
    publish({ status: 'error', issue });
    settle(request, { ok: false, code, issue });
  }
  function start(optionsSignal?: AbortSignal): Active | undefined {
    if (disposed || optionsSignal?.aborted) return undefined;
    halt();
    if (disposed || optionsSignal?.aborted) return undefined;
    const request: Active = { generation, signal: optionsSignal, label: '', index: 0,
      paused: false, playVersion: 0, trackStarted: false, cleanups: [], trackCleanups: [], pending: [] };
    active = request;
    if (optionsSignal) {
      const abort = () => {
        // A late unmount from an old view cannot cancel the next view's request.
        if (current(request)) stop();
      };
      optionsSignal.addEventListener('abort', abort, { once: true });
      request.cleanups.push(() => optionsSignal.removeEventListener('abort', abort));
    }
    return request;
  }
  function validate(track: AudioRequest): AudioRequest {
    if (!track || typeof track.url !== 'string' || !track.url.trim() ||
        /^(?:javascript|data):/i.test(track.url.trim()) || typeof track.label !== 'string' || !track.label.trim() ||
        (track.start !== undefined && (!Number.isFinite(track.start) || track.start < 0)) ||
        (track.end !== undefined && (!Number.isFinite(track.end) || track.end <= (track.start ?? 0)))) {
      throw new Error('Đoạn âm thanh không hợp lệ.');
    }
    return { ...track };
  }
  function finishTrack(request: Active): void {
    if (!current(request) || state.status === 'ended' || state.status === 'error') return;
    if (!request.trackStarted) {
      fail(request, 'Âm thanh đã kết thúc trước khi bắt đầu phát. Hãy thử lại.');
      return;
    }
    clearBoundary();
    for (const cleanup of request.trackCleanups.splice(0)) cleanup();
    // WebKit may reject an unresolved resume play() when this intentional
    // segment-boundary pause runs. That retired attempt cannot turn ended
    // into an error (or affect the next item of a sequence).
    request.playVersion++;
    audio.pause();
    if (request.requests && request.index + 1 < request.requests.length) {
      request.index++;
      loadTrack(request);
    } else {
      publish({ status: 'ended', currentTime: audio.currentTime });
      settle(request, { ok: true, code: 'playing' });
    }
  }
  function scheduleBoundary(request: Active): void {
    if (!current(request) || state.status !== 'playing') return;
    clearBoundary();
    const end = state.request?.end;
    if (end === undefined) return;
    const remaining = end - audio.currentTime;
    if (remaining <= 0.015) { finishTrack(request); return; }
    boundaryTimer = setTimer(() => {
      boundaryTimer = undefined;
      if (!current(request) || state.status !== 'playing') return;
      publish({ currentTime: audio.currentTime });
      scheduleBoundary(request);
    }, Math.max(20, remaining / state.rate * 1000));
  }
  function nativePlay(request: Active): void {
    if (!current(request) || request.paused) return;
    const version = ++request.playVersion;
    guardStartup(request);
    try {
      void audio.play().catch(error => {
        if (current(request) && request.playVersion === version && !request.paused) fail(request, playbackIssue(error));
      });
    } catch (error) { fail(request, playbackIssue(error)); }
  }
  function loadTrack(request: Active): void {
    if (!current(request) || !request.requests) return;
    clearBoundary();
    for (const cleanup of request.trackCleanups.splice(0)) cleanup();
    const track = request.requests[request.index];
    request.paused = false;
    request.trackStarted = false;
    let positioned = false;
    let nativePlaying = false;
    let zeroDurationClock: number | undefined;
    let waitingTime: number | undefined;
    const confirmPlaying = () => {
      if (!nativePlaying || !positioned || !current(request) || request.paused || state.status === 'error') return;
      request.trackStarted = true;
      waitingTime = undefined;
      publish({ status: 'playing', issue: null, currentTime: audio.currentTime });
      settle(request, { ok: true, code: 'playing' });
      scheduleBoundary(request);
    };
    const position = () => {
      if (!current(request) || audio.readyState < 1) return;
      try {
        const startTime = track.start ?? 0;
        // WebKit MP3 metadata can transiently report zero before the positive
        // decoded duration arrives. Zero is not yet a usable range boundary.
        // Later durationchange still validates every requested segment in full.
        if (audio.duration === 0) return;
        const durationKnown = Number.isFinite(audio.duration) && audio.duration > 0;
        if (durationKnown && startTime >= audio.duration) {
          fail(request, 'Đoạn âm thanh nằm ngoài bản ghi.');
          return;
        }
        // MP3 decoder duration estimates can differ by approximately one frame.
        // A larger truncation means this is not the promised complete segment.
        if (track.end !== undefined && durationKnown && track.end > audio.duration + 0.05) {
          fail(request, 'Bản ghi ngắn hơn đoạn âm thanh đã chọn. Hãy thử lại.');
          return;
        }
        if (positioned) return;
        if (Math.abs(audio.currentTime - startTime) > 0.001) audio.currentTime = startTime;
        positioned = true;
        publish({ currentTime: startTime });
        confirmPlaying();
      } catch (error) { fail(request, playbackIssue(error)); }
    };
    publish({ status: 'loading', label: track.label, request: track,
      sourceKind: track.sourceKind ?? (track.start !== undefined || track.end !== undefined ? 'segment' : 'original'),
      issue: null, currentTime: track.start ?? 0, index: request.index + 1, total: request.requests.length });
    if (!current(request)) return;
    listen(audio, 'loadedmetadata', position, request.trackCleanups);
    listen(audio, 'durationchange', position, request.trackCleanups);
    listen(audio, 'play', () => {
      // WebKit can resume a previously confirmed track without another
      // playing event. Capture a real native-play baseline; only subsequent
      // non-seeking clock advancement at usable readiness can confirm resume.
      if (current(request) && request.trackStarted && !request.paused && state.status === 'loading') waitingTime = audio.currentTime;
    }, request.trackCleanups);
    listen(audio, 'playing', () => {
      if (!current(request)) return;
      if (request.paused) { audio.pause(); return; }
      nativePlaying = true;
      zeroDurationClock = undefined;
      position();
      confirmPlaying();
    }, request.trackCleanups);
    listen(audio, 'pause', () => {
      if (!current(request) || !audio.paused || state.status !== 'playing') return;
      clearBoundary();
      publish({ status: 'paused', currentTime: audio.currentTime });
    }, request.trackCleanups);
    listen(audio, 'waiting', () => {
      if (!current(request) || state.status !== 'playing') return;
      clearBoundary();
      waitingTime = audio.currentTime;
      publish({ status: 'loading', currentTime: audio.currentTime });
      if (current(request)) guardStartup(request);
    }, request.trackCleanups);
    listen(audio, 'seeking', () => {
      if (current(request) && state.status === 'loading') { waitingTime = undefined; zeroDurationClock = undefined; }
    }, request.trackCleanups);
    listen(audio, 'seeked', () => {
      if (current(request) && request.trackStarted && state.status === 'loading') waitingTime = audio.currentTime;
    }, request.trackCleanups);
    listen(audio, 'timeupdate', () => {
      if (!current(request)) return;
      // Some WebKit MP3 decoders retain duration=0 even while the original
      // recording genuinely advances. Only a whole, unbounded recording can
      // recover from this: require native playing plus two non-seeking clock
      // observations. A canplay event, seek jump, resolved promise, or empty
      // recording cannot pass this gate; bounded segments still need metadata.
      if (!request.trackStarted && state.status === 'loading' && nativePlaying && audio.duration === 0 &&
          (track.start ?? 0) === 0 && track.end === undefined && !request.paused && !audio.paused &&
          !audio.seeking && audio.readyState >= 2) {
        const previous = zeroDurationClock;
        zeroDurationClock = audio.currentTime;
        if (previous !== undefined && audio.currentTime > previous + 0.01) {
          positioned = true;
          confirmPlaying();
        }
      }
      // Some engines resume the real clock after seeking without another
      // playing event. Only a track already confirmed by playing may recover;
      // seek jumps, a paused clock and a merely resolved play promise do not.
      // WebKit MP3 playback can advance at HAVE_CURRENT_DATA (readyState 2).
      if (request.trackStarted && state.status === 'loading' && waitingTime !== undefined &&
          !request.paused && !audio.paused && !audio.seeking && audio.readyState >= 2 && audio.currentTime > waitingTime + 0.01) {
        waitingTime = undefined;
        publish({ status: 'playing', issue: null, currentTime: audio.currentTime });
        settle(request, { ok: true, code: 'playing' });
        scheduleBoundary(request);
      }
      if (!current(request)) return;
      publish({ currentTime: audio.currentTime });
      if (track.end !== undefined && audio.currentTime >= track.end - 0.015) finishTrack(request);
    }, request.trackCleanups);
    listen(audio, 'ended', () => finishTrack(request), request.trackCleanups);
    listen(audio, 'error', () => fail(request, audio.error?.message
      ? `Không phát được âm thanh: ${audio.error.message}` : 'Không tải được âm thanh. Kiểm tra kết nối rồi thử lại.'), request.trackCleanups);
    try {
      audio.src = track.url;
      audio.defaultPlaybackRate = state.rate;
      audio.playbackRate = state.rate;
      audio.preservesPitch = true;
      audio.load();
      position();
      // Call play within the original gesture. Metadata seeking happens before
      // confirming playback, without awaiting a fetch that loses user activation.
      if (state.status !== 'error') nativePlay(request);
    } catch (error) { fail(request, playbackIssue(error)); }
  }
  function playbackIssue(error: unknown): string {
    return error instanceof Error && error.name === 'NotAllowedError'
      ? 'Trình duyệt chưa cho phép phát. Bấm Nghe lại để thử.'
      : 'Không phát được âm thanh. Kiểm tra kết nối rồi thử lại.';
  }
  function playSequence(requests: readonly AudioRequest[], playbackOptions: { signal?: AbortSignal } = {}): Promise<PlaybackResult> {
    if (disposed || playbackOptions.signal?.aborted) return Promise.resolve(cancelled);
    let tracks: AudioRequest[];
    try {
      if (!requests.length) throw new Error('Chưa có âm thanh để phát.');
      tracks = requests.map(validate);
    } catch (error) {
      stop();
      const issue = error instanceof Error ? error.message : 'Đoạn âm thanh không hợp lệ.';
      publish({ status: 'error', issue });
      return Promise.resolve({ ok: false, code: 'error', issue });
    }
    const request = start(playbackOptions.signal);
    if (!request) return Promise.resolve(cancelled);
    request.requests = tracks;
    request.label = tracks[0].label;
    const result = wait(request);
    loadTrack(request);
    return result;
  }
  function chineseVoice(): SpeechVoice | undefined {
    const voices = speech?.getVoices().filter(voice => /^zh(?:[-_]|$)/i.test(voice.lang));
    return voices?.find(voice => /^zh[-_]CN$/i.test(voice.lang)) ?? voices?.find(voice => /^zh[-_]TW$/i.test(voice.lang)) ?? voices?.[0];
  }
  function startSpeech(request: Active): void {
    if (!current(request) || request.paused || !speech || request.text === undefined) return;
    const voice = chineseVoice();
    if (!voice) return;
    for (const cleanup of request.trackCleanups.splice(0)) cleanup();
    try {
      const utterance = speech.createUtterance(request.text);
      request.utterance = utterance;
      utterance.lang = voice.lang;
      utterance.voice = voice;
      utterance.rate = state.rate;
      const playing = () => {
        if (!current(request)) return;
        if (request.paused) { speech.pause(); return; }
        request.trackStarted = true;
        publish({ status: 'playing', issue: null });
        settle(request, { ok: true, code: 'playing' });
      };
      listen(utterance, 'start', playing, request.trackCleanups);
      listen(utterance, 'resume', playing, request.trackCleanups);
      listen(utterance, 'pause', () => { if (current(request)) publish({ status: 'paused' }); }, request.trackCleanups);
      listen(utterance, 'end', () => {
        if (!current(request)) return;
        if (!request.trackStarted) {
          fail(request, 'Giọng máy đã kết thúc trước khi bắt đầu đọc. Hãy thử lại.');
          return;
        }
        publish({ status: 'ended' });
        settle(request, { ok: true, code: 'playing' });
      }, request.trackCleanups);
      listen(utterance, 'error', () => fail(request, 'Không đọc được bằng giọng máy. Hãy thử lại.'), request.trackCleanups);
      guardStartup(request);
      speech.speak(utterance);
    } catch { fail(request, 'Trình duyệt không hỗ trợ giọng máy tiếng Trung.', 'unsupported'); }
  }
  function speak(text: string, playbackOptions: { label?: string; signal?: AbortSignal } = {}): Promise<PlaybackResult> {
    const request = start(playbackOptions.signal);
    if (!request) return Promise.resolve(cancelled);
    request.text = text;
    request.label = playbackOptions.label ?? text;
    const result = wait(request);
    publish({ status: 'loading', label: request.label, sourceKind: 'tts', request: null,
      currentTime: 0, index: 1, total: 1, issue: null });
    if (!current(request)) return result;
    if (!text.trim()) { fail(request, 'Chưa có chữ để đọc.'); return result; }
    if (!speech) { fail(request, 'Trình duyệt không hỗ trợ giọng máy tiếng Trung.', 'unsupported'); return result; }
    if (chineseVoice()) startSpeech(request);
    else {
      // Voice lists often arrive asynchronously. Only a real Chinese voice is
      // accepted; a foreign default voice must never read Mandarin silently.
      const timer = setTimer(() => {
        if (!current(request) || request.utterance) return;
        if (chineseVoice()) startSpeech(request);
        else fail(request, 'Chưa có giọng máy tiếng Trung trên thiết bị. Cài giọng tiếng Trung rồi thử lại.', 'unsupported');
      }, options.voiceWaitMs ?? 1500);
      request.trackCleanups.push(() => clearTimer(timer));
      listen(speech, 'voiceschanged', () => { if (chineseVoice()) startSpeech(request); }, request.trackCleanups);
    }
    return result;
  }
  function pause(): void {
    if (disposed || !active || !['playing', 'loading'].includes(state.status)) return;
    active.paused = true;
    active.playVersion++;
    clearBoundary();
    if (active.requests) audio.pause();
    else { try { speech?.pause(); } catch { /* The view still shows a paused request. */ } }
    publish({ status: 'paused', currentTime: active.requests ? audio.currentTime : 0 });
    settle(active, cancelled);
  }
  function resume(): Promise<PlaybackResult> {
    if (disposed || !active) return Promise.resolve(cancelled);
    if (state.status === 'playing') return Promise.resolve({ ok: true, code: 'playing' });
    if (state.status === 'ended' || state.status === 'error') return replay();
    const request = active;
    request.paused = false;
    const result = wait(request);
    publish({ status: 'loading', issue: null });
    if (request.requests) nativePlay(request);
    else if (request.utterance) {
      guardStartup(request);
      try { speech?.resume(); } catch { fail(request, 'Không tiếp tục được giọng máy. Hãy bấm Nghe lại.'); }
    } else if (chineseVoice()) startSpeech(request);
    return result;
  }
  function replay(): Promise<PlaybackResult> {
    if (disposed || !active) return Promise.resolve(cancelled);
    const request = active;
    return request.requests
      ? playSequence(request.requests, { signal: request.signal })
      : speak(request.text ?? '', { label: request.label, signal: request.signal });
  }
  function stop(): void {
    halt();
    audio.removeAttribute('src');
    audio.load();
    publish({ status: 'idle', label: '', sourceKind: null, issue: null,
      request: null, currentTime: 0, index: 0, total: 0 });
  }
  function setRate(rate: number): void {
    if (disposed || !AUDIO_RATES.some(value => value === rate)) return;
    audio.playbackRate = rate;
    audio.defaultPlaybackRate = rate;
    audio.preservesPitch = true;
    publish({ rate });
    if (active?.requests) scheduleBoundary(active);
    // Speech engines do not consistently apply a changed utterance rate. The
    // selected speed is applied on replay instead of interrupting mid-sentence.
  }
  function dispose(): void {
    if (disposed) return;
    stop();
    disposed = true;
    listeners.clear();
  }
  return {
    play: (request, playbackOptions) => playSequence([request], playbackOptions), playSequence,
    speak, pause, resume, replay, stop, setRate,
    snapshot: () => ({ ...state, request: state.request ? { ...state.request } : null }),
    subscribe: listener => { if (disposed) return () => {}; listeners.add(listener); return () => listeners.delete(listener); },
    dispose,
  };
}

export function createBrowserAudioService(): AudioService {
  const audio = new Audio();
  audio.preload = 'metadata';
  const synthesis = globalThis.speechSynthesis;
  const speech: SpeechPort | undefined = synthesis && typeof SpeechSynthesisUtterance !== 'undefined' ? {
    getVoices: () => synthesis.getVoices(),
    createUtterance: text => new SpeechSynthesisUtterance(text),
    speak: utterance => synthesis.speak(utterance as SpeechSynthesisUtterance),
    cancel: () => synthesis.cancel(), pause: () => synthesis.pause(), resume: () => synthesis.resume(),
    addEventListener: (type, listener) => synthesis.addEventListener(type, listener),
    removeEventListener: (type, listener) => synthesis.removeEventListener(type, listener),
  } : undefined;
  return createAudioService({ audio, speech });
}
