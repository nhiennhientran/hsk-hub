import {ManagedHanziWriter} from '../../services/hanzi/vendor.js';
import type {HanziData} from '../../services/hanzi/vendor.js';
import type {HanziCurriculum} from '../../services/content/textbook.ts';
import './hanzi.css';

interface HanziOptions {
  chars: string | string[];
  words?: readonly {zh: string}[];
  curriculum?: Pick<HanziCurriculum, 'strokes' | 'order' | 'structure' | 'radicals'>;
  signal: AbortSignal;
}

const dataCache = new Map<string, HanziData>();
const hanCharacters = (value: string | string[]) => [...new Set((Array.isArray(value) ? value.join('') : value).match(/\p{Script=Han}/gu) ?? [])];

async function loadCharacter(character: string, signal: AbortSignal): Promise<HanziData> {
  const cached = dataCache.get(character);
  if (cached) return cached;
  const url = new URL(`course-assets/hanzi/${encodeURIComponent(character)}.json`, document.baseURI);
  const response = await fetch(url, {signal});
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data: unknown = await response.json();
  if (!data || typeof data !== 'object') throw new Error('Invalid character data');
  const candidate = data as Partial<HanziData>;
  if (!Array.isArray(candidate.strokes) || !candidate.strokes.length || !candidate.strokes.every(stroke => typeof stroke === 'string' && stroke.length > 0) || !Array.isArray(candidate.medians) || candidate.medians.length !== candidate.strokes.length || !candidate.medians.every(stroke => Array.isArray(stroke) && stroke.length > 1 && stroke.every(point => Array.isArray(point) && point.length === 2 && point.every(Number.isFinite)))) throw new Error('Invalid character strokes');
  signal.throwIfAborted();
  const result = candidate as HanziData;
  dataCache.set(character, result);
  return result;
}

function strokeGallery(character: string, data: HanziData): HTMLElement {
  const gallery = document.createElement('div');
  gallery.dataset.hanziStrokes = '';
  gallery.className = 'hanzi-stroke-gallery';
  data.strokes.forEach((_stroke, index) => {
    const figure = document.createElement('figure');
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 1024 1024');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', `${character} · nét ${index + 1}`);
    const group = document.createElementNS(svg.namespaceURI, 'g');
    group.setAttribute('transform', 'translate(0,900) scale(1,-1)');
    for (let strokeIndex = 0; strokeIndex <= index; strokeIndex++) {
      const path = document.createElementNS(svg.namespaceURI, 'path');
      path.setAttribute('d', data.strokes[strokeIndex]);
      path.setAttribute('fill', strokeIndex === index ? '#0f766e' : '#b8c4c8');
      group.append(path);
    }
    svg.append(group);
    const caption = document.createElement('figcaption');
    caption.textContent = `Nét ${index + 1}`;
    figure.append(svg, caption);
    gallery.append(figure);
  });
  return gallery;
}

export function mountHanzi(host: HTMLElement, {chars, words = [], curriculum, signal}: HanziOptions) {
  const primaryCharacters = hanCharacters(chars);
  const additionalCharacters = hanCharacters(words.map(word => word.zh)).filter(character => !primaryCharacters.includes(character));
  const characters = [...primaryCharacters, ...additionalCharacters];
  const element = <K extends keyof HTMLElementTagNameMap>(tag: K, text?: string) => {
    const result = document.createElement(tag);
    if (text !== undefined) result.textContent = text;
    return result;
  };
  host.classList.add('textbook-hanzi');
  const intro = element('div');
  intro.className = 'hanzi-curriculum';
  const labels = {strokes: 'Nét chữ', order: 'Thứ tự nét', structure: 'Kết cấu chữ', radicals: 'Bộ thủ'};
  for (const key of ['strokes', 'order', 'structure', 'radicals'] as const) {
    if (curriculum?.[key]) intro.append(element('p', `${labels[key]} · ${curriculum[key]}`));
  }
  const choices = element('div');
  choices.className = 'hanzi-choices';
  choices.setAttribute('aria-label', 'Chọn chữ để xem thứ tự nét');
  function characterButton(character: string) {
    const button = element('button', character);
    button.type = 'button';
    button.dataset.hanziChar = character;
    const linkedWords = [...new Set(words.filter(word => word.zh.includes(character)).map(word => word.zh))];
    if (linkedWords.length) button.title = linkedWords.join(' · ');
    return button;
  }
  if (curriculum && words.length) {
    const note = element('p', 'Chữ trọng tâm theo phần Hán tự của giáo trình; các chữ còn lại lấy từ từ vựng của bài.');
    note.className = 'hanzi-choice-note';
    choices.append(note);
    for (const [label, groupCharacters] of [['Chữ trọng tâm', primaryCharacters], ['Chữ trong từ vựng', additionalCharacters]] as const) {
      if (!groupCharacters.length) continue;
      const group = element('section');
      group.className = 'hanzi-choice-group';
      const buttons = element('div');
      buttons.className = 'hanzi-choice-buttons';
      buttons.append(...groupCharacters.map(characterButton));
      group.append(element('h4', label), buttons);
      choices.append(group);
    }
  } else {
    choices.append(...characters.map(characterButton));
  }
  const details = element('div');
  details.className = 'hanzi-details';
  host.replaceChildren(intro, choices, details);
  let active = characters[0] ?? '';
  let controller: AbortController | null = null;
  let writer: ManagedHanziWriter | null = null;
  let observer: ResizeObserver | null = null;
  let currentData: HanziData | null = null;
  let generation = 0;
  let disposed = false;

  function stopWriter() {
    observer?.disconnect();
    observer = null;
    writer?.dispose();
    writer = null;
  }

  function updateMode(mode: string, text: string) {
    if (disposed || signal.aborted) return;
    host.dataset.hanziMode = mode;
    const status = details.querySelector<HTMLElement>('[data-hanzi-status]');
    if (status) status.textContent = text;
    for (const button of details.querySelectorAll<HTMLButtonElement>('[data-hanzi-action]')) button.disabled = mode === 'loading' || (mode === 'animation' && button.dataset.hanziAction === 'animate');
  }

  async function createWriter(data: HanziData, version: number) {
    stopWriter();
    const canvas = details.querySelector<HTMLElement>('[data-hanzi-canvas]');
    if (!canvas || disposed || signal.aborted || version !== generation) return null;
    canvas.replaceChildren();
    const size = Math.max(120, Math.min(240, canvas.getBoundingClientRect().width || 220));
    const next = new ManagedHanziWriter(canvas, {width: size, height: size, padding: 12, charDataLoader: () => data, strokeColor: '#253f49', radicalColor: '#a34322', outlineColor: '#d4dfe3', highlightColor: '#0f766e', delayBetweenStrokes: 250, strokeAnimationSpeed: 1});
    writer = next;
    await next.setCharacter(active);
    if (disposed || signal.aborted || version !== generation || writer !== next) {next.dispose(); return null;}
    observer = new ResizeObserver(() => {
      if (writer !== next || disposed) return;
      const width = canvas.getBoundingClientRect().width;
      if (width > 0) next.updateDimensions({width: Math.min(240, width), height: Math.min(240, width)});
    });
    observer.observe(canvas);
    return next;
  }

  async function showCharacter(character: string) {
    controller?.abort();
    stopWriter();
    active = character;
    currentData = null;
    const version = ++generation;
    controller = new AbortController();
    if (signal.aborted || disposed) {controller.abort(); return;}
    for (const button of choices.querySelectorAll<HTMLButtonElement>('button')) button.setAttribute('aria-pressed', String(button.dataset.hanziChar === character));
    const heading = element('h3', character);
    const count = element('p');
    count.dataset.hanziStrokeCount = '';
    const canvas = element('div');
    canvas.className = 'hanzi-canvas';
    canvas.dataset.hanziCanvas = '';
    canvas.setAttribute('aria-label', `Bảng viết chữ ${character}`);
    const status = element('p');
    status.dataset.hanziStatus = '';
    status.setAttribute('role', 'status');
    const actions = element('div');
    actions.className = 'hanzi-actions';
    for (const [action, label] of [['animate', 'Xem viết'], ['practice', 'Luyện viết'], ['reset', 'Đặt lại']] as const) {
      const button = element('button', label);
      button.type = 'button';
      button.dataset.hanziAction = action;
      actions.append(button);
    }
    const linkedWords = [...new Set(words.filter(word => word.zh.includes(character)).map(word => word.zh))];
    const associations = element('p', linkedWords.length ? `Từ trong bài: ${linkedWords.join(' · ')}` : '');
    associations.dataset.hanziWords = '';
    details.replaceChildren(heading, associations, count, canvas, actions, status);
    updateMode('loading', 'Đang tải nét chữ…');
    try {
      const data = await loadCharacter(character, controller.signal);
      if (disposed || signal.aborted || version !== generation) return;
      currentData = data;
      count.textContent = `${data.strokes.length} nét`;
      details.append(element('h4', 'Từng nét'), strokeGallery(character, data));
      await createWriter(data, version);
      if (version === generation) updateMode('display', 'Xem từng nét hoặc chọn “Luyện viết” để viết theo thứ tự.');
    } catch (error) {
      if (disposed || signal.aborted || version !== generation) return;
      if (error instanceof DOMException && error.name === 'AbortError') return;
      canvas.replaceChildren();
      actions.replaceChildren();
      const retry = element('button', 'Thử tải lại nét chữ');
      retry.type = 'button';
      retry.dataset.hanziAction = 'retry';
      actions.append(retry);
      updateMode('error', `Chưa tải được dữ liệu nét chữ “${character}”. Hãy thử lại khi có kết nối.`);
    }
  }

  async function performAction(action: string) {
    if (disposed || signal.aborted) return;
    if (action === 'retry') {await showCharacter(active); return;}
    const data = currentData;
    if (!data) return;
    const version = ++generation;
    updateMode('loading', 'Đang mở bảng viết…');
    const current = await createWriter(data, version);
    if (!current || disposed || signal.aborted || version !== generation) return;
    if (action === 'animate') {
      updateMode('animation', 'Đang viết lần lượt từng nét…');
      await current.animateCharacter();
      if (writer === current) updateMode('display', 'Đã xem xong. Có thể xem lại hoặc luyện viết.');
    } else if (action === 'practice') {
      updateMode('practice', `Viết chữ ${active}: bắt đầu từ nét 1. Sau 2 lần chưa đúng, gợi ý nét sẽ xuất hiện.`);
      await current.quiz({showHintAfterMisses: 2, onMistake(event) {if (writer === current) updateMode('practice', `Thử lại nét ${event.strokeNum + 1}. Đã viết chưa đúng ${event.totalMistakes} lần. Viết theo chiều và thứ tự trong hình.`);}, onCorrectStroke(event) {if (writer === current) updateMode('practice', `Đúng nét ${event.strokeNum + 1}. Còn ${event.strokesRemaining} nét.`);}, onComplete(event) {if (writer === current) updateMode('complete', `Đã viết xong chữ ${active}. Số lần chưa đúng: ${event.totalMistakes}. Chọn “Đặt lại” để luyện thêm.`);}});
    } else if (action === 'reset') updateMode('display', 'Đã đặt lại. Chọn “Xem viết” hoặc “Luyện viết”.');
  }

  function handleClick(event: MouseEvent) {
    const button = (event.target as Element).closest<HTMLButtonElement>('button');
    if (!button || !host.contains(button) || button.disabled) return;
    if (button.dataset.hanziChar && button.dataset.hanziChar !== active) void showCharacter(button.dataset.hanziChar);
    if (button.dataset.hanziAction) void performAction(button.dataset.hanziAction).catch(() => {if (!disposed) updateMode('error', 'Chưa mở được bảng viết. Chọn “Đặt lại” để thử lại.');});
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    generation++;
    controller?.abort();
    stopWriter();
    host.removeEventListener('click', handleClick);
    signal.removeEventListener('abort', dispose);
  }
  host.addEventListener('click', handleClick);
  signal.addEventListener('abort', dispose, {once: true});
  const ready = active ? showCharacter(active) : Promise.resolve();
  if (!active) details.append(element('p', 'Chưa có chữ Hán trong nội dung này.'));
  return {ready, dispose};
}

export function mountWordStrokes(host: HTMLElement, {word, signal}: {word: string; signal: AbortSignal}) {
  return mountHanzi(host, {chars: word, signal});
}
