/* One persistent audio element. Playback always starts from a student action. */
(function (root) {
  'use strict';
  const RATES = Object.freeze([0.65, 0.75, 1, 1.25, 1.5]);
  const scriptURL = document.currentScript && document.currentScript.src;
  const mediaBase = new URL('media/', scriptURL || document.baseURI).href;
  const lessonLoads = new Map();
  let singleton = null;

  function mediaEntry(id) {
    const clips = root.HSKStep3MediaIndex?.clips;
    if (!clips || !Object.prototype.hasOwnProperty.call(clips, id)) return null;
    const entry = clips[id];
    return entry && Number.isInteger(entry.lesson) && entry.lesson >= 1 && entry.lesson <= 15 ? entry : null;
  }
  function mediaData(id) {
    const media = root.HSKStep3Media;
    return media && Object.prototype.hasOwnProperty.call(media, id) && typeof media[id] === 'string' &&
      /^data:audio\/[A-Za-z0-9.+-]+;base64,/.test(media[id]) ? media[id] : null;
  }
  function forgetLesson(lesson) {
    const cached = lessonLoads.get(lesson);
    if (cached) { lessonLoads.delete(lesson); cached.element.remove(); }
  }
  function loadLesson(lesson) {
    if (lessonLoads.has(lesson)) return lessonLoads.get(lesson).promise;
    const element = document.createElement('script');
    element.async = true; element.src = new URL(`lesson-${String(lesson).padStart(2, '0')}.js`, mediaBase).href;
    element.dataset.hskLesson = String(lesson);
    let resolve, reject;
    const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
    const entry = {promise, element}; lessonLoads.set(lesson, entry);
    element.onload = () => { element.onload = null; element.onerror = null; resolve(); };
    element.onerror = () => {
      element.onload = null; element.onerror = null;
      if (lessonLoads.get(lesson) === entry) forgetLesson(lesson);
      reject(new Error('MEDIA_LOAD_FAILED'));
    };
    document.head.appendChild(element);
    return promise;
  }
  async function ensureMedia(id) {
    const cached = mediaData(id); if (cached) return cached;
    const entry = mediaEntry(id); if (!entry) throw new Error('MEDIA_MISSING');
    await loadLesson(entry.lesson);
    const loaded = mediaData(id);
    if (!loaded) { forgetLesson(entry.lesson); throw new Error('MEDIA_MISSING'); }
    return loaded;
  }
  function create(callbacks = {}) {
    if (singleton) { singleton.setCallbacks(callbacks); return singleton.api; }
    const byId = id => {
      const element = document.getElementById(id);
      if (!element) throw new Error(`Missing persistent player control: ${id}`);
      return element;
    };
    const audio = byId('lesson-audio'), controls = byId('audio-controls'), label = byId('audio-label');
    const status = byId('audio-status'), rateSelect = byId('audio-rate');
    const playButton = byId('play-audio'), pauseButton = byId('pause-audio'), replayButton = byId('replay-audio');
    const progress = byId('audio-progress'), time = byId('audio-time');
    let item = null, sourceId = null, generation = 0, rate = 1, phase = 'idle';
    let activeAttempt = null, runCounted = false, hooks = callbacks, lastError = null;
    audio.preload = 'none'; audio.autoplay = false;

    function available() { return !!item && !!mediaEntry(item.id); }
    function duration() {
      if (sourceId === item?.id && Number.isFinite(audio.duration) && audio.duration > 0) return audio.duration;
      const expected = item && mediaEntry(item.id)?.duration;
      return Number.isFinite(expected) && expected > 0 ? expected : 0;
    }
    function currentTime() { return sourceId === item?.id && Number.isFinite(audio.currentTime) ? Math.max(0, audio.currentTime) : 0; }
    function format(seconds) {
      const whole = Math.floor(Math.max(0, seconds));
      return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
    }
    function updateTime() {
      const total = duration(), current = total ? Math.min(currentTime(), total) : currentTime();
      progress.max = total || 1; progress.value = current;
      time.textContent = `${format(current)} / ${format(total)}`;
    }
    function updateButtons() {
      const enabled = available();
      controls.hidden = !enabled;
      playButton.disabled = !enabled || phase === 'loading' || phase === 'playing';
      pauseButton.disabled = !enabled || !['loading', 'playing'].includes(phase);
      replayButton.disabled = !enabled;
      rateSelect.disabled = !enabled;
    }
    function setPhase(next, message) {
      phase = next; status.dataset.state = next;
      status.textContent = message || ({idle: 'Nhấn phát để nghe.', loading: 'Đang mở đoạn âm…',
        playing: 'Đang phát. Bạn có thể nghe lại tùy ý.', paused: 'Đã tạm dừng. Nhấn phát để nghe tiếp.',
        ended: 'Đã nghe hết đoạn. Bạn có thể nghe lại.', error: 'Chưa mở được đoạn âm. Nhấn phát để thử lại.'})[next];
      updateButtons(); updateTime();
    }
    function applyRate() {
      audio.defaultPlaybackRate = rate; audio.playbackRate = rate;
      for (const property of ['preservesPitch', 'mozPreservesPitch', 'webkitPreservesPitch']) {
        if (property in audio) { try { audio[property] = true; } catch (_) { /* Optional browser property. */ } }
      }
      rateSelect.value = String(rate);
    }
    function setRate(value) {
      if (!RATES.includes(value)) throw new Error('Tốc độ phát không hợp lệ.');
      rate = value; applyRate(); return rate;
    }
    function clearSource() {
      audio.pause();
      try { audio.currentTime = 0; } catch (_) { /* Metadata may not have loaded. */ }
      sourceId = null; audio.removeAttribute('src'); audio.load();
    }
    function stop() {
      generation++; activeAttempt = null; runCounted = false; lastError = null;
      clearSource(); setPhase('idle'); return getState();
    }
    function setItem(next) {
      const normalized = next && typeof next.id === 'string' ? {id: next.id, label: String(next.label || 'Âm thanh giáo trình')} : null;
      if (item?.id === normalized?.id) {
        item = normalized; label.textContent = item?.label || 'Âm thanh giáo trình';
        updateButtons(); updateTime(); return getState();
      }
      stop(); item = normalized;
      if (item) audio.dataset.mediaId = item.id; else delete audio.dataset.mediaId;
      label.textContent = item?.label || 'Âm thanh giáo trình';
      setPhase('idle'); return getState();
    }
    function pause() {
      generation++; activeAttempt = null;
      audio.pause();
      if (item && ['loading', 'playing', 'paused'].includes(phase)) setPhase('paused');
      return getState();
    }
    async function begin(fromStart) {
      if (!available()) return false;
      if (!fromStart && phase === 'playing' && !audio.paused) return true;
      const id = item.id, token = ++generation;
      const restart = fromStart || phase === 'ended' || audio.ended;
      activeAttempt = null; lastError = null;
      if (restart) { audio.pause(); runCounted = false; }
      const attempt = {generation: token, id, replay: restart, count: !runCounted};
      activeAttempt = attempt; setPhase('loading');
      try {
        const data = await ensureMedia(id);
        if (token !== generation || item?.id !== id) return false;
        if (sourceId !== id || !audio.getAttribute('src')) {
          audio.pause(); audio.src = data; sourceId = id; audio.dataset.mediaId = id;
          audio.load(); runCounted = false; attempt.count = true;
        } else if (audio.error) {
          audio.load(); runCounted = false; attempt.count = true;
        }
        if (restart) { try { audio.currentTime = 0; } catch (_) { /* A new source already starts at zero. */ } }
        applyRate();
        await audio.play();
        if (token !== generation || item?.id !== id) return false;
        // The native playing event changes the UI and records the listen.
        return !audio.paused;
      } catch (error) {
        if (token !== generation || item?.id !== id) return false;
        activeAttempt = null; audio.pause();
        lastError = error?.name === 'NotAllowedError' ? 'PLAY_BLOCKED' : 'PLAY_FAILED';
        setPhase('error', lastError === 'PLAY_BLOCKED' ? 'Trình duyệt chưa cho phép phát. Hãy nhấn Phát âm thanh để thử lại.' :
          'Chưa mở được đoạn âm. Kiểm tra tệp hoặc kết nối, rồi nhấn Phát âm thanh để thử lại.');
        return false;
      }
    }
    function play() { return begin(false); }
    function replay() { return begin(true); }
    function getState() {
      return {id: item?.id || null, available: available(), state: phase, rate,
        currentTime: currentTime(), duration: duration(), paused: audio.paused, error: lastError};
    }

    audio.addEventListener('playing', () => {
      const attempt = activeAttempt;
      if (!attempt || attempt.generation !== generation || item?.id !== attempt.id || sourceId !== attempt.id || audio.paused) return;
      setPhase('playing');
      if (attempt.count && !runCounted) {
        attempt.count = false; runCounted = true;
        if (typeof hooks.onStart === 'function') hooks.onStart({id: attempt.id, replay: attempt.replay});
      }
    });
    audio.addEventListener('pause', () => {
      if (phase === 'playing' && !audio.ended && item?.id === sourceId) setPhase('paused');
    });
    audio.addEventListener('ended', () => {
      if (!item || sourceId !== item.id || !audio.ended) return;
      activeAttempt = null; setPhase('ended');
    });
    audio.addEventListener('error', () => {
      if (!item || sourceId !== item.id || !activeAttempt) return;
      generation++; activeAttempt = null; runCounted = false; lastError = 'MEDIA_ERROR';
      audio.pause(); setPhase('error', 'Đoạn âm chưa phát được. Nhấn Phát âm thanh để thử lại.');
    });
    for (const event of ['loadedmetadata', 'durationchange', 'timeupdate', 'seeking', 'seeked']) audio.addEventListener(event, updateTime);
    playButton.addEventListener('click', () => { void play(); });
    pauseButton.addEventListener('click', pause);
    replayButton.addEventListener('click', () => { void replay(); });
    rateSelect.addEventListener('change', () => {
      const selected = Number(rateSelect.value);
      if (!RATES.includes(selected)) { rateSelect.value = String(rate); return; }
      setRate(selected);
      if (typeof hooks.onRateChange === 'function') hooks.onRateChange(selected);
    });
    applyRate(); setPhase('idle');
    const api = {setItem, setRate, play, pause, replay, stop, getState};
    singleton = {api, setCallbacks: next => { hooks = next || {}; }};
    return api;
  }
  root.HSKStep3Player = Object.freeze({create, RATES});
})(window);
