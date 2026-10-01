import type { AudioService } from '../../services/audio/index.ts';
import type { BookLesson, TextbookContent } from '../../services/content/textbook.ts';
import { mountWordStrokes } from './hanzi.ts';
import { button, element, searchKey } from './dom.ts';

export interface VocabularyOptions {
  lesson: BookLesson; content: TextbookContent; audio: AudioService; signal: AbortSignal;
  getMastered(): Readonly<Record<string, boolean>>; markMastered(word: string, value: boolean): void;
}
export function mountVocabulary(host: HTMLElement, options: VocabularyOptions): { dispose(): void; update(mastered?: Readonly<Record<string, boolean>>): void } {
  const { lesson, content, audio, signal } = options;
  const section = element('section'); section.id = 'textbook-vocabulary'; section.append(element('h2', 'Từ vựng'));
  const searchLabel = element('label', 'Tìm tiếng Trung, tiếng Việt hoặc pinyin');
  const search = element('input'); search.id = 'vocab-search'; search.type = 'search'; search.autocomplete = 'off'; searchLabel.append(search);
  const actions = element('div'); actions.className = 'textbook-actions';
  const grid = element('div'); grid.className = 'textbook-vocab-grid';
  const count = element('p'); count.id = 'vocab-count'; count.setAttribute('role', 'status');
  const detail = element('section'); detail.id = 'word-detail'; detail.className = 'textbook-word-detail'; detail.hidden = true;
  const flipped = new Map<string, boolean>(); let detailIndex = -1;
  let detailLifetime: AbortController | undefined; let drawLifetime: AbortController | undefined; let strokes: ReturnType<typeof mountWordStrokes> | undefined;
  let opener: HTMLButtonElement | undefined;
  const playAll = button('Nghe toàn bộ từ có âm thanh gốc', () => { const requests = content.vocabPlaylist(lesson.id); if (requests.length) void audio.playSequence(requests, { signal }); }, signal); playAll.id = 'vocab-play-all';
  const flipAll = button('Lật tất cả thẻ', () => {
    const visible = visibleWords(); const next = visible.some(word => !flipped.get(word.id));
    for (const word of visible) flipped.set(word.id, next);
    draw();
  }, signal); flipAll.id = 'vocab-flip-all';
  actions.append(flipAll, playAll); section.append(searchLabel, actions, count, grid, detail); host.append(section);
  function visibleWords() { const query = searchKey(search.value); return lesson.vocab.filter(word => !query || searchKey(`${word.zh}${word.py}${word.vn}`).includes(query)); }
  function audioButton(wordId: string, label: string, localSignal: AbortSignal): HTMLButtonElement {
    const resolved = content.resolveWord(lesson.id, wordId);
    const control = button(label, () => { if (resolved.available) void audio.play(resolved.request, { signal: localSignal }); }, localSignal);
    control.dataset.vocabAudio = wordId; control.disabled = !resolved.available;
    if (!resolved.available) { control.textContent = 'Chưa có âm thanh gốc riêng'; control.title = resolved.reason; }
    return control;
  }
  function closeDetail(): void { detailLifetime?.abort(); strokes?.dispose(); strokes = undefined; detailIndex = -1; detail.hidden = true; detail.replaceChildren(); opener?.focus(); }
  function openDetail(index: number, focus = true): void {
    const word = lesson.vocab[index]; if (!word || signal.aborted) return;
    detailLifetime?.abort(); strokes?.dispose(); detailLifetime = new AbortController();
    const localSignal = detailLifetime.signal; detailIndex = index; detail.hidden = false; detail.replaceChildren(); detail.dataset.wordId = word.id;
    const title = element('h3', word.zh); title.lang = 'zh'; title.tabIndex = -1;
    const close = button('Đóng chi tiết', closeDetail, localSignal); close.id = 'word-close';
    const head = element('div'); head.className = 'textbook-detail-head'; head.append(title, close);
    detail.append(head, element('p', word.py), element('p', word.vn), element('p', word.posLabel), audioButton(word.id, 'Nghe từ trong giáo trình', localSignal));
    const wordSenses = content.wordSenses(lesson.id, word.id);
    if (wordSenses.length > 1) {
      const senses = element('div'); senses.className = 'textbook-senses'; senses.append(element('h4', 'Nghĩa trong bài'));
      for (const sense of wordSenses) {
        const row = element('div'); row.append(element('p', `${sense.senseZh} · ${sense.py} · ${sense.vi}`));
        const source = content.resolveWord(lesson.id, word.id, sense.catalogId);
        const listen = button(`Nghe: ${sense.senseZh}`, () => { if (source.available) void audio.play(source.request, { signal: localSignal }); }, localSignal);
        listen.dataset.senseAudio = sense.catalogId; listen.disabled = !source.available; row.append(listen); senses.append(row);
      }
      detail.append(senses);
    }
    const example = lesson.scenes.flatMap(scene => scene.lines).find(line => line.zh.includes(word.zh));
    if (example) {
      const box = element('div'); box.className = 'textbook-example'; box.dataset.wordExample = '';
      box.append(element('h4', 'Ví dụ trong bài khoá'), element('p', example.zh), element('p', example.py), element('p', example.vn)); detail.append(box);
    } else detail.append(element('p', 'Chưa có câu ví dụ chứa từ này trong bài khoá của bài học.'));
    const strokeHost = element('div'); detail.append(strokeHost); strokes = mountWordStrokes(strokeHost, { word: word.zh, signal: localSignal });
    const nav = element('div'); nav.className = 'textbook-actions';
    const previous = button('← Từ trước', () => openDetail(detailIndex - 1), localSignal); previous.id = 'word-prev'; previous.disabled = index === 0;
    const next = button('Từ sau →', () => openDetail(detailIndex + 1), localSignal); next.id = 'word-next'; next.disabled = index === lesson.vocab.length - 1;
    nav.append(previous, next); detail.append(nav); if (focus) title.focus();
  }
  function draw(): void {
    drawLifetime?.abort(); drawLifetime = new AbortController(); const cardSignal = drawLifetime.signal;
    const visible = visibleWords(); grid.replaceChildren(); count.textContent = `${visible.length} / ${lesson.vocab.length} từ trong bài.`;
    flipAll.disabled = visible.length === 0; playAll.disabled = content.vocabPlaylist(lesson.id).length === 0;
    if (!visible.length) grid.append(element('p', 'Không tìm thấy từ. Thử từ khóa khác hoặc xóa ô tìm kiếm.'));
    for (const word of visible) {
      const card = element('article'); card.className = 'vocab-card'; card.dataset.wordId = word.id; card.tabIndex = 0; card.setAttribute('aria-label', `${word.zh}. Enter hoặc phím cách để lật thẻ.`);
      const front = element('div'); front.className = 'vocab-front'; front.append(element('p', word.posLabel), element('h3', word.zh)); front.querySelector('h3')!.lang = 'zh';
      const back = element('div'); back.className = 'vocab-back'; back.append(element('p', word.posLabel), element('p', word.py), element('p', word.vn));
      const actionRow = element('div'); actionRow.className = 'textbook-actions';
      const flip = button('Lật thẻ', undefined, cardSignal); flip.dataset.vocabFlip = word.id;
      function updateFlip(): void { const state = flipped.get(word.id) === true; card.dataset.flipped = String(state); front.hidden = state; back.hidden = !state; flip.setAttribute('aria-pressed', String(state)); flip.textContent = state ? 'Xem tiếng Trung' : 'Xem pinyin và nghĩa'; }
      function toggle(): void { flipped.set(word.id, !flipped.get(word.id)); updateFlip(); }
      flip.addEventListener('click', toggle, { signal: cardSignal });
      card.addEventListener('keydown', event => { if (event.target === card && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); toggle(); } }, { signal: cardSignal });
      const star = button('', () => { options.markMastered(word.zh, !options.getMastered()[`${lesson.id}-${word.zh}`]); update(); }, cardSignal); star.dataset.vocabStar = word.id;
      const open = button('Chi tiết', () => { opener = open; openDetail(lesson.vocab.indexOf(word)); }, cardSignal); open.dataset.vocabDetail = word.id;
      actionRow.append(flip, audioButton(word.id, 'Nghe âm thanh gốc', cardSignal), star, open);
      card.append(front, back, element('small', word.extension ? 'Từ mở rộng' : word.kind === 'proper' ? 'Tên riêng' : 'Từ trong giáo trình'), actionRow); grid.append(card); updateFlip();
    }
    update();
  }
  function update(mastered: Readonly<Record<string, boolean>> = options.getMastered()): void {
    for (const star of grid.querySelectorAll<HTMLButtonElement>('[data-vocab-star]')) {
      const word = lesson.vocab.find(row => row.id === star.dataset.vocabStar); if (!word) continue;
      const known = mastered[`${lesson.id}-${word.zh}`] === true; star.textContent = known ? '★ Đã nhớ' : '☆ Đánh dấu đã nhớ'; star.setAttribute('aria-pressed', String(known));
    }
  }
  search.addEventListener('input', draw, { signal });
  signal.addEventListener('abort', () => { detailLifetime?.abort(); drawLifetime?.abort(); strokes?.dispose(); }, { once: true }); draw();
  return { update, dispose() { detailLifetime?.abort(); drawLifetime?.abort(); strokes?.dispose(); section.remove(); } };
}
