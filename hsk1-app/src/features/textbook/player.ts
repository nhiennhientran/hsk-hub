import type { AudioService } from '../../services/audio/index.ts';
import { button, element } from './dom.ts';

/** A view of the shared player. It never owns a second media element. */
export function mountPlayer(host: HTMLElement, audio: AudioService, signal: AbortSignal): () => void {
  const panel = element('section'); panel.id = 'audio-player'; panel.className = 'textbook-player';
  panel.setAttribute('aria-label', 'Điều khiển âm thanh');
  const status = element('p'); status.id = 'audio-status'; status.setAttribute('role', 'status');
  const position = element('p'); position.id = 'audio-position';
  const actions = element('div'); actions.className = 'textbook-actions';
  const pause = button('Tạm dừng', () => audio.pause(), signal); pause.id = 'audio-pause';
  const resume = button('Tiếp tục', () => { void audio.resume(); }, signal); resume.id = 'audio-resume';
  const replay = button('Nghe lại từ đầu', () => { void audio.replay(); }, signal); replay.id = 'audio-replay';
  const stop = button('Dừng', () => audio.stop(), signal); stop.id = 'audio-stop';
  const rateLabel = element('label', 'Tốc độ '); const rate = element('select'); rate.id = 'audio-rate';
  for (const value of [.65, .75, 1, 1.25, 1.5]) { const option = element('option', `${value}×`); option.value = String(value); rate.append(option); }
  rate.addEventListener('change', () => audio.setRate(Number(rate.value)), { signal }); rateLabel.append(rate);
  actions.append(pause, resume, replay, stop, rateLabel); panel.append(status, position, actions); host.append(panel);
  function update(): void {
    const state = audio.snapshot(); panel.dataset.state = state.status;
    const labels = { idle: 'Chọn âm thanh để nghe.', loading: 'Đang tải âm thanh…', playing: 'Đang phát', paused: 'Đã tạm dừng', ended: 'Đã nghe xong', error: 'Chưa phát được âm thanh.' };
    const source = state.sourceKind === 'tts' ? 'Giọng đọc của thiết bị' : state.sourceKind ? 'Âm thanh gốc giáo trình' : '';
    status.textContent = state.issue ?? `${labels[state.status]}${state.label ? ` · ${state.label}` : ''}${source ? ` · ${source}` : ''}`;
    position.textContent = state.sourceKind === 'tts' ? 'Đổi tốc độ có hiệu lực khi nghe lại.' : state.total > 1 ? `Mục ${state.index} / ${state.total}` : '';
    rate.value = String(state.rate); pause.disabled = state.status !== 'playing';
    resume.disabled = state.status !== 'paused'; replay.disabled = ['idle', 'loading'].includes(state.status);
    stop.disabled = state.status === 'idle';
  }
  const unsubscribe = audio.subscribe(update); update();
  signal.addEventListener('abort', unsubscribe, { once: true });
  return () => { unsubscribe(); panel.remove(); };
}
