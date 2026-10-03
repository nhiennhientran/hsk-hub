import { bilingualText, setBilingual } from '../../app/bilingual.ts';
import { audioStatusCopy, textbookCopy, textbookIssue } from '../../app/i18n/textbook.ts';
import { AUDIO_RATES, type AudioService } from '../../services/audio/index.ts';
import { button, element } from './dom.ts';

/** A view of the shared player. It never owns a second media element. */
export function mountPlayer(host: HTMLElement, audio: AudioService, signal: AbortSignal): () => void {
  const copy = textbookCopy.player;
  const panel = element('section'); panel.id = 'audio-player'; panel.className = 'textbook-player';
  panel.setAttribute('aria-label', bilingualText(copy.controls));
  const status = element('p'); status.id = 'audio-status'; status.setAttribute('role', 'status');
  const position = element('p'); position.id = 'audio-position';
  const actions = element('div'); actions.className = 'textbook-actions';
  const pause = button(copy.pause, () => audio.pause(), signal); pause.id = 'audio-pause';
  const resume = button(copy.resume, () => { void audio.resume(); }, signal); resume.id = 'audio-resume';
  const replay = button(copy.replay, () => { void audio.replay(); }, signal); replay.id = 'audio-replay';
  const stop = button(copy.stop, () => audio.stop(), signal); stop.id = 'audio-stop';
  const rateLabel = element('label', copy.rate); const rate = element('select'); rate.id = 'audio-rate';
  for (const value of AUDIO_RATES) { const option = element('option', `${value}×`); option.value = String(value); rate.append(option); }
  rate.addEventListener('change', () => audio.setRate(Number(rate.value)), { signal }); rateLabel.append(rate);
  const seek=element('input');seek.type='range';seek.step='0.1';seek.setAttribute('aria-label','播放位置 · Vị trí phát');seek.addEventListener('input',()=>audio.seek(Number(seek.value)),{signal});
  actions.append(seek,pause, resume, replay, stop, rateLabel); panel.append(status, position, actions); host.append(panel);
  function update(): void {
    const state = audio.snapshot(); panel.dataset.state = state.status;
    const label = textbookIssue(state.issue, audioStatusCopy[state.status]);
    const source = state.sourceKind === 'tts' ? copy.tts : state.sourceKind ? copy.original : null;
    setBilingual(status, label);
    if (state.label) { const title = element('span', ` · ${state.label}`); title.className = 'audio-item-label'; status.append(title); }
    if (source) status.append(element('span', ' · '), element('span', source));
    if (state.sourceKind === 'tts') setBilingual(position, copy.rateHint);
    else if (state.total > 1) setBilingual(position, copy.position(state.index, state.total));
    else position.replaceChildren();
    const start=state.request?.start??0,end=state.request?.end??state.duration;seek.min=String(start);seek.max=String(end||1);seek.value=String(state.currentTime);seek.disabled=!end||state.sourceKind==='tts';if(end&&state.sourceKind!=='tts')position.append(element('span',` · ${Math.max(0,state.currentTime-start).toFixed(1)} / ${(end-start).toFixed(1)}s`));
    rate.value = String(state.rate); pause.disabled = state.status !== 'playing';
    resume.disabled = state.status !== 'paused'; replay.disabled = ['idle', 'loading'].includes(state.status);
    stop.disabled = state.status === 'idle';
  }
  const unsubscribe = audio.subscribe(update); update();
  signal.addEventListener('abort', unsubscribe, { once: true });
  return () => { unsubscribe(); panel.remove(); };
}
