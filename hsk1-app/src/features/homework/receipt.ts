import type { Answer, HomeworkAttempt } from '../../domain/types.ts';
import { bilingualText, setBilingual, type BilingualCopy } from '../../app/bilingual.ts';
import { receiptCopy as copy, homeworkParts } from '../../app/i18n/homework.ts';
import '../../app/bilingual.css';
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

function element<K extends keyof HTMLElementTagNameMap>(tag: K, text?: string | BilingualCopy, className?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (typeof text === 'string') node.textContent = text;
  else if (text) { if (tag === 'option') node.textContent = bilingualText(text); else setBilingual(node, text); }
  if (className) node.className = className;
  return node;
}

function answerText(question: ReceiptQuestion, answer: Answer | undefined): string {
  if (typeof answer === 'string') return answer;
  if (typeof answer === 'number') return question.options?.[answer] ?? bilingualText(copy.noAnswer);
  if (Array.isArray(answer)) return answer.map(index => question.tokens?.[index] ?? '').join(' ');
  return bilingualText(copy.noAnswer);
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
  const versionLabel = element('label', copy.version);
  versionLabel.htmlFor = 'receipt-version';
  const version = element('select');
  version.id = 'receipt-version';
  for (const [value, label] of [['first', copy.first], ['latest', copy.latest]] as const) {
    const option = element('option', label);
    option.value = value;
    option.disabled = !attempts[value];
    version.append(option);
  }
  version.value = selected;
  const print = element('button', copy.print);
  print.type = 'button';
  print.id = 'print-receipt';
  const close = element('button', copy.close);
  close.type = 'button';
  close.id = 'close-receipt';
  toolbar.append(versionLabel, version, print, close);

  const title = element('h2', copy.title);
  title.id = 'receipt-title';
  title.tabIndex = -1;
  const identity = element('dl', undefined, 'receipt-identity');
  for (const [label, value] of [
    [copy.name, profile.name || copy.blank],
    [copy.className, profile.className || copy.blank],
    [copy.lesson, copy.lessonValue(options.lesson, options.lessonTitle)],
    [copy.part, homeworkParts[options.part]],
  ]) identity.append(element('dt', label), element('dd', value));
  const submission = element('p', undefined, 'receipt-submission bilingual-stacked');
  const note = element('p', options.part === 'translation'
    ? copy.manualNote
    : copy.note, 'receipt-note bilingual-stacked');
  const answers = element('ol', undefined, 'receipt-answers');
  root.append(toolbar, title, identity, submission, note, answers);
  host.append(root);

  function render(): void {
    const attempt = attempts[selected];
    root.dataset.version = selected;
    answers.replaceChildren();
    if (!attempt) {
      setBilingual(submission, copy.noSubmission);
      return;
    }
    const date = new Date(attempt.at);
    const at = { zh: date.toLocaleString('zh-CN', { dateStyle: 'medium', timeStyle: 'medium' }), vi: date.toLocaleString('vi-VN', { dateStyle: 'medium', timeStyle: 'medium' }) };
    setBilingual(submission, copy.submitted(selected, at));
    if (options.part !== 'translation' && attempt.assessment === 'automatic' && attempt.correct !== null) {
      const score = element('span', copy.score(attempt.correct, attempt.total), 'receipt-score');
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
