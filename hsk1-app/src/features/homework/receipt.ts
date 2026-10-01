import type { Answer, HomeworkAttempt } from '../../domain/types.ts';
import './receipt.css';

export interface ReceiptQuestion {
  readonly id: string;
  readonly prompt: string;
  readonly stem?: string;
  readonly options?: readonly string[];
  readonly tokens?: readonly string[];
}

export interface ReceiptOptions {
  lesson: number;
  lessonTitle?: string;
  part: 'choice' | 'sort' | 'translation';
  questions: readonly ReceiptQuestion[];
  profile: { name: string; className: string };
  first: HomeworkAttempt | null;
  latest: HomeworkAttempt | null;
  selected?: 'first' | 'latest';
  onClose(): void;
}

const partLabels = { choice: 'Chọn đáp án', sort: 'Sắp xếp câu', translation: 'Dịch tự do' };

function element<K extends keyof HTMLElementTagNameMap>(tag: K, text?: string, className?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function answerText(question: ReceiptQuestion, answer: Answer | undefined): string {
  if (typeof answer === 'string') return answer;
  if (typeof answer === 'number') return question.options?.[answer] ?? 'Chưa có câu trả lời trong phiếu này.';
  if (Array.isArray(answer)) return answer.map(index => question.tokens?.[index] ?? '').join(' ');
  return 'Chưa có câu trả lời trong phiếu này.';
}

/** A receipt reads submitted snapshots only; edits to a redo draft cannot change it. */
export function createReceipt(host: HTMLElement, options: ReceiptOptions): { dispose(): void } {
  const events = new AbortController();
  const attempts = { first: structuredClone(options.first), latest: structuredClone(options.latest) };
  const profile = { ...options.profile };
  const questions = options.questions.map(question => ({ ...question, options: question.options?.slice(), tokens: question.tokens?.slice() }));
  let selected = options.selected ?? 'latest';
  if (!attempts[selected]) selected = attempts.latest ? 'latest' : 'first';

  const root = element('section', undefined, 'homework-receipt');
  root.id = 'homework-receipt';
  root.dataset.homeworkReceipt = '';
  root.setAttribute('role', 'region');
  root.setAttribute('aria-labelledby', 'receipt-title');
  const toolbar = element('div', undefined, 'receipt-toolbar');
  const versionLabel = element('label', 'Lần nộp');
  versionLabel.htmlFor = 'receipt-version';
  const version = element('select');
  version.id = 'receipt-version';
  for (const [value, label] of [['first', 'Lần đầu'], ['latest', 'Gần nhất']] as const) {
    const option = element('option', label);
    option.value = value;
    option.disabled = !attempts[value];
    version.append(option);
  }
  version.value = selected;
  const print = element('button', 'In / lưu PDF');
  print.type = 'button';
  print.id = 'print-receipt';
  const close = element('button', 'Quay lại bài tập');
  close.type = 'button';
  close.id = 'close-receipt';
  toolbar.append(versionLabel, version, print, close);

  const title = element('h2', 'Phiếu bài tập đã nộp');
  title.id = 'receipt-title';
  title.tabIndex = -1;
  const identity = element('dl', undefined, 'receipt-identity');
  for (const [label, value] of [
    ['Họ và tên', profile.name || 'Chưa điền'],
    ['Lớp', profile.className || 'Chưa điền'],
    ['Bài', `Bài ${options.lesson}${options.lessonTitle ? ` · ${options.lessonTitle}` : ''}`],
    ['Phần', partLabels[options.part]],
  ]) identity.append(element('dt', label), element('dd', value));
  const submission = element('p', undefined, 'receipt-submission');
  const note = element('p', options.part === 'translation'
    ? 'Các câu trả lời dưới đây là bản đã nộp. Hãy chụp phiếu này và gửi cô giáo để nhận nhận xét.'
    : 'Các câu trả lời dưới đây là bản đã nộp.', 'receipt-note');
  const answers = element('ol', undefined, 'receipt-answers');
  root.append(toolbar, title, identity, submission, note, answers);
  host.append(root);

  function render(): void {
    const attempt = attempts[selected];
    root.dataset.version = selected;
    answers.replaceChildren();
    if (!attempt) {
      submission.textContent = 'Chưa có lần nộp để tạo phiếu.';
      return;
    }
    const at = new Date(attempt.at).toLocaleString('vi-VN', { dateStyle: 'medium', timeStyle: 'medium' });
    const description = selected === 'first' ? 'Lần đầu' : 'Gần nhất';
    submission.textContent = `${description} · Nộp lúc ${at}`;
    if (options.part !== 'translation' && attempt.assessment === 'automatic' && attempt.correct !== null) {
      const score = element('span', ` · Kết quả ${attempt.correct}/${attempt.total}`, 'receipt-score');
      score.dataset.receiptScore = '';
      submission.append(score);
    }
    for (const question of questions) {
      const item = element('li');
      item.dataset.questionId = question.id;
      item.append(element('p', question.prompt, 'receipt-prompt'));
      if (question.stem) item.append(element('p', question.stem, 'receipt-stem'));
      const answer = element('p', answerText(question, attempt.answers[question.id]), 'receipt-answer');
      answer.dataset.receiptAnswerId = question.id;
      item.append(answer);
      answers.append(item);
    }
  }
  version.addEventListener('change', () => {
    selected = version.value === 'first' ? 'first' : 'latest';
    render();
  }, { signal: events.signal });
  print.addEventListener('click', () => window.print(), { signal: events.signal });
  close.addEventListener('click', options.onClose, { signal: events.signal });
  render();
  title.focus({ preventScroll: true });
  return { dispose() { events.abort(); root.remove(); } };
}
