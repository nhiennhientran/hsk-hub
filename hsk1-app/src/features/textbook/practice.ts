import { textbookCopy } from '../../app/i18n/textbook.ts';
import { element } from './dom.ts';
import {gradePractice, practiceQuestions} from '../../domain/textbook/practice.ts';
import type {PracticeQuestion, PracticeTier} from '../../domain/textbook/practice.ts';
import type {BookLesson} from '../../services/content/textbook.ts';
import './practice.css';

export function mountPractice(host: HTMLElement, {lesson, signal}: {lesson: BookLesson; signal: AbortSignal}) {
  const copy = textbookCopy.practice;
  const bank = practiceQuestions(lesson);
  const state = {basic: {selected: {} as Record<number, number>, submitted: false}, advanced: {selected: {} as Record<number, number>, submitted: false}};
  let tier: PracticeTier = 'basic';
  host.classList.add('textbook-practice');
  const note = element('p', copy.note);
  note.className = 'bilingual-stacked';
  const tabs = element('div');
  tabs.className = 'practice-tiers';
  for (const level of ['basic', 'advanced'] as const) {
    const button = element('button', level === 'basic' ? copy.basic(bank.basic.length) : copy.advanced(bank.advanced.length));
    button.type = 'button';
    button.dataset.practiceTier = level;
    tabs.append(button);
  }
  const content = element('section');
  host.replaceChildren(note, tabs, content);

  function renderQuestion(question: PracticeQuestion, index: number, results: ReturnType<typeof gradePractice> | null) {
    const current = state[tier];
    const card = element('article');
    card.className = 'practice-question';
    card.dataset.practiceQuestion = String(index);
    const number = element('p', copy.question(index + 1, bank[tier].length));
    number.append(document.createTextNode(' · '), element('span', copy.types[question.type] ?? question.type));
    const prompt = element('h3', { zh: copy.prompts[question.type] ?? copy.instruction.zh, vi: question.prompt });
    prompt.className = 'bilingual-stacked';
    card.append(number, prompt);
    const stem = element('p', question.stem);
    stem.className = 'practice-stem';
    card.append(stem);
    const options = element('div');
    options.className = 'practice-options';
    question.options.forEach((option, optionIndex) => {
      const button = element('button', `${String.fromCharCode(65 + optionIndex)}. ${option}`);
      button.type = 'button';
      button.dataset.practiceOption = String(optionIndex);
      button.setAttribute('aria-pressed', String(current.selected[index] === optionIndex));
      button.disabled = current.submitted;
      if (current.submitted && option === question.answer) button.classList.add('correct');
      if (current.submitted && current.selected[index] === optionIndex && option !== question.answer) button.classList.add('wrong');
      options.append(button);
    });
    card.append(options);
    if (results) {
      const result = results.results[index];
      const feedback = element('div');
      feedback.dataset.practiceFeedback = result.correct ? 'correct' : result.picked === null ? 'missing' : 'wrong';
      const outcome = element('p', result.correct ? copy.correct : result.picked === null ? copy.missing : copy.wrong);
      const answer = element('p', copy.answer); answer.append(document.createTextNode(`: ${question.answer}`));
      feedback.append(outcome, answer, element('strong', copy.explain), element('p', question.explain));
      card.append(feedback);
    }
    return card;
  }

  function render() {
    if (signal.aborted) return;
    for (const button of tabs.querySelectorAll<HTMLButtonElement>('button')) button.setAttribute('aria-pressed', String(button.dataset.practiceTier === tier));
    content.dataset.practiceLevel = tier;
    const current = state[tier];
    const results = current.submitted ? gradePractice(bank[tier], current.selected) : null;
    const score = element('p', results ? copy.result(results.correct, results.total, results.percent) : copy.instruction);
    score.dataset.practiceScore = tier;
    score.setAttribute('role', 'status');
    const actions = element('div');
    actions.className = 'practice-actions';
    for (const action of ['submit', 'reset'] as const) {
      const button = element('button', action === 'submit' ? copy.submit : copy.reset);
      button.type = 'button';
      button.dataset.practiceAction = action;
      button.disabled = action === 'submit' && current.submitted;
      actions.append(button);
    }
    content.replaceChildren(score, ...bank[tier].map((question, index) => renderQuestion(question, index, results)), actions);
  }

  function handleClick(event: MouseEvent) {
    const button = (event.target as Element).closest<HTMLButtonElement>('button');
    if (!button || !host.contains(button) || button.disabled) return;
    const level = button.dataset.practiceTier;
    if (level === 'basic' || level === 'advanced') {
      tier = level;
      render();
    } else if (button.dataset.practiceOption !== undefined) {
      const card = button.closest<HTMLElement>('[data-practice-question]');
      if (!card || state[tier].submitted) return;
      const index = Number(card.dataset.practiceQuestion);
      state[tier].selected[index] = Number(button.dataset.practiceOption);
      for (const option of card.querySelectorAll<HTMLButtonElement>('[data-practice-option]')) option.setAttribute('aria-pressed', String(option === button));
    } else if (button.dataset.practiceAction === 'submit') {
      state[tier].submitted = true;
      render();
    } else if (button.dataset.practiceAction === 'reset') {
      state[tier] = {selected: {}, submitted: false};
      render();
    }
  }
  host.addEventListener('click', handleClick);
  const dispose = () => host.removeEventListener('click', handleClick);
  signal.addEventListener('abort', dispose, {once: true});
  render();
  return {dispose() {signal.removeEventListener('abort', dispose); dispose();}};
}
