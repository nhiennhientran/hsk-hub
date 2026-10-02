import { bilingualText } from '../../app/bilingual.ts';
import { textbookCopy } from '../../app/i18n/textbook.ts';
import type { AudioService } from '../../services/audio/index.ts';
import type { BookLesson } from '../../services/content/textbook.ts';
import { button, element } from './dom.ts';

export function mountLanguage(host: HTMLElement, options: { lesson: BookLesson; audio: AudioService; signal: AbortSignal }): { dispose(): void } {
  const { lesson, audio, signal } = options;
  const copy = textbookCopy.language;
  const section = element('section'); section.id = 'textbook-language'; section.append(element('h2', lesson.id === 1 ? copy.phonetics : copy.grammar));
  section.append(element('p', copy.deviceHint));
  for (const item of [...lesson.phonetics, ...lesson.grammar]) {
    const card = element('article'); card.className = 'textbook-language-card'; card.dataset.languageItem = item.id;
    card.append(element('h3', item.title), element('p', item.vn_title), element('p', item.desc));
    if (item.structure) { const structure = element('p', item.structure); structure.className = 'textbook-structure'; card.append(structure); }
    for (const [index, example] of item.examples.entries()) {
      const box = element('div'); box.className = 'textbook-example'; box.dataset.languageExample = `${item.id}-${index}`;
      const zh = element('p', example.zh); zh.lang = 'zh'; zh.className = 'textbook-zh'; box.append(zh, element('p', example.py), element('p', example.vn));
      const read = button(copy.readExample, () => { void audio.speak(example.zh, { label: bilingualText(copy.exampleLabel), signal }); }, signal); read.dataset.tts = `${item.id}-${index}`; box.append(read); card.append(box);
    }
    section.append(card);
  }
  const tips = element('aside'); tips.className = 'textbook-tip'; tips.append(element('h3', copy.tips));
  for (const tip of lesson.xiaoyuTips) { const row = element('div'); row.dataset.xiaoyuTip = tip.id; row.append(element('p', tip.zh), element('p', tip.vn)); tips.append(row); }
  section.append(tips); host.append(section); return { dispose() { section.remove(); } };
}
