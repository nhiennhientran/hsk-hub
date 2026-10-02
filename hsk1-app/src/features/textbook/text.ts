import { bilingualText, setBilingual } from '../../app/bilingual.ts';
import { textbookCopy, textbookIssue } from '../../app/i18n/textbook.ts';
import { tongueTwisters } from '../../services/content/textbook-supplements.ts';
import type { AudioService } from '../../services/audio/index.ts';
import type { BookLesson, TextbookContent } from '../../services/content/textbook.ts';
import { button, element } from './dom.ts';

export function mountText(host: HTMLElement, options: { lesson: BookLesson; content: TextbookContent; audio: AudioService; signal: AbortSignal }): { dispose(): void } {
  const { lesson, content, audio, signal } = options;
  const copy = textbookCopy.text;
  const section = element('section'); section.id = 'textbook-text'; section.append(element('h2', copy.heading));
  const toolbar = element('div'); toolbar.className = 'textbook-actions';
  const pickerLabel = element('label', copy.select); const picker = element('select'); picker.id = 'scene-select';
  const tabs = element('div'); tabs.className = 'textbook-scene-tabs'; tabs.setAttribute('role', 'tablist'); tabs.setAttribute('aria-label', bilingualText(copy.scenes));
  const tabButtons: HTMLButtonElement[] = [];
  const modeLabel = element('label'); const mode = element('input'); mode.type = 'checkbox'; mode.id = 'text-listen-mode'; modeLabel.append(mode, element('span', copy.listenMode));
  const showLabel = element('label'); const show = element('input'); show.type = 'checkbox'; show.id = 'text-show-original'; show.checked = true; showLabel.append(show, element('span', copy.showOriginal));
  const body = element('div'); body.id = 'scene-content'; body.setAttribute('role', 'tabpanel');
  let current = 0; let sceneLifetime: AbortController | undefined;
  function originalVisibility(): void { for (const node of body.querySelectorAll<HTMLElement>('[data-original-text]')) node.hidden = !show.checked; }
  function draw(index: number): void {
    const scene = lesson.scenes[index]; if (!scene || signal.aborted) return;
    // A scene switch is a new listening choice. Abort its media before rendering.
    sceneLifetime?.abort(); sceneLifetime = new AbortController(); const sceneSignal = sceneLifetime.signal; current = index;
    body.replaceChildren(); body.dataset.sceneId = scene.id; body.setAttribute('aria-labelledby', `scene-tab-${index}`); picker.value = String(index);
    for (let i = 0; i < tabButtons.length; i++) { tabButtons[i].setAttribute('aria-selected', String(i === index)); tabButtons[i].tabIndex = i === index ? 0 : -1; }
    body.append(element('h3', `${index + 1}. ${scene.place}`), element('p', scene.place_vn));
    const resolved = content.resolveScene(lesson.id, scene.id);
    const play = button(copy.playScene, () => { if (resolved.available) void audio.play({ ...resolved.request, label: bilingualText(scene.place, scene.place_vn) }, { signal: sceneSignal }); }, sceneSignal); play.dataset.sceneAudio = scene.id; play.disabled = !resolved.available;
    if (!resolved.available) play.title = bilingualText(textbookIssue(resolved.reason, copy.audioUnavailable));
    const slow = button(copy.slow, () => { if (resolved.available) { audio.setRate(.75); void audio.play({ ...resolved.request, label: bilingualText(scene.place, scene.place_vn) }, { signal: sceneSignal }); } }, sceneSignal); slow.id = 'scene-slow'; slow.disabled = !resolved.available;
    const listenActions = element('div'); listenActions.className = 'textbook-actions'; listenActions.append(play, slow); body.append(listenActions);
    for (const [lineIndex, line] of scene.lines.entries()) {
      const card = element('article'); card.className = 'textbook-line'; card.dataset.lineId = line.id;
      card.append(element('strong', line.s));
      const text = element('div'); text.dataset.originalText = ''; const zh = element('p', line.zh); zh.lang = 'zh'; zh.className = 'textbook-zh';
      text.append(zh, element('p', line.py), element('p', line.vn));
      const source = content.resolveLine(lesson.id, scene.id, line.id);
      // The shared player remains visible when the dialogue is hidden. Never put
      // the transcript in its label, including when hide mode changes mid-play.
      const one = button(copy.playLine, () => { if (source.available) void audio.play({ ...source.request, label: bilingualText(copy.lineLabel(lesson.id, index + 1, lineIndex + 1)) }, { signal: sceneSignal }); }, sceneSignal); one.dataset.lineAudio = line.id; one.disabled = !source.available;
      if (!source.available) { setBilingual(one, copy.noLineAudio); one.title = bilingualText(textbookIssue(source.reason, copy.audioUnavailable)); }
      card.append(text, one); body.append(card);
    }
    if (mode.checked) show.checked = false; originalVisibility();
  }
  for (const [index, scene] of lesson.scenes.entries()) {
    const option = element('option', `${index + 1}. ${scene.place} · ${scene.place_vn}`); option.value = String(index); picker.append(option);
    const tab = button({ zh: `${index + 1}. ${scene.place}`, vi: scene.place_vn }, () => draw(index), signal); tab.classList.add('bilingual-stacked'); tab.dataset.sceneTab = scene.id; tab.id = `scene-tab-${index}`; tab.setAttribute('role', 'tab'); tab.setAttribute('aria-controls', body.id);
    tab.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault(); const target = event.key === 'Home' ? 0 : event.key === 'End' ? lesson.scenes.length - 1 : (current + (event.key === 'ArrowRight' ? 1 : -1) + lesson.scenes.length) % lesson.scenes.length;
      draw(target); tabButtons[target].focus();
    }, { signal }); tabs.append(tab); tabButtons.push(tab);
  }
  picker.addEventListener('change', () => draw(Number(picker.value)), { signal });
  mode.addEventListener('change', () => { show.checked = !mode.checked; originalVisibility(); }, { signal });
  show.addEventListener('change', originalVisibility, { signal });
  pickerLabel.append(picker); toolbar.append(pickerLabel, modeLabel, showLabel); section.append(tabs, toolbar, body);
  const tongue = content.tongue(lesson.id);
  if (tongue.available) {
    const box = element('aside'); box.className = 'textbook-tip'; box.append(element('h3', copy.tongueHeading), element('p', copy.tongueHint));
    const original = tongueTwisters[lesson.id];
    if (original) {
      const text = element('p', original.zh); text.lang = 'zh'; text.className = 'textbook-zh'; text.dataset.tongueText = String(lesson.id);
      box.append(text, element('p', original.py), element('small', copy.original));
    }
    const control = button(copy.tonguePlay, () => { void audio.play({ ...tongue.request, label: bilingualText(copy.tongueLabel(lesson.id)) }, { signal }); }, signal); control.dataset.tongueAudio = String(lesson.id); box.append(control); section.append(box);
  }
  host.append(section); signal.addEventListener('abort', () => sceneLifetime?.abort(), { once: true }); draw(0);
  return { dispose() { sceneLifetime?.abort(); section.remove(); } };
}
