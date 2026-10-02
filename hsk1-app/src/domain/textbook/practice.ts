import restoredTargets from '../../../content/textbook-restored-targets.json' with { type: 'json' };

export interface PracticeLesson {
  id: number;
  vocab: readonly {zh: string; py: string; vn: string; kind: string}[];
  scenes: readonly {place_vn: string; lines: readonly {zh: string; py: string; vn: string}[]}[];
}

export interface PracticeQuestion {
  type: string;
  prompt: string;
  stem: string;
  options: string[];
  answer: string;
  explain: string;
}

export type PracticeTier = 'basic' | 'advanced';
export type PracticeBank = Record<PracticeTier, PracticeQuestion[]>;

// Preserve the original app-practice.js generator: same picks, option order,
// answers and explanations. This review is separate from the 225 homework items.
function stableOptions(answer: string, pool: string[], seed: number): string[] {
  const unique = [answer, ...pool.filter(x => x !== answer)].filter((x, i, a) => a.indexOf(x) === i).slice(0, 4);
  while (unique.length < 4) unique.push('—');
  const shift = seed % unique.length;
  return unique.slice(shift).concat(unique.slice(0, shift));
}

export function practiceQuestions(lesson: PracticeLesson): PracticeBank {
  const L = lesson, id = lesson.id;
  const words = L.vocab.filter(w => w.kind !== 'proper');
  const meaningPool = words.map(w => w.vn), pinyinPool = words.map(w => w.py);
  const lines = L.scenes.flatMap(s => s.lines), basic: PracticeQuestion[] = [];
  const picks = [0, Math.floor(words.length / 4), Math.floor(words.length / 2), Math.floor(words.length * 3 / 4)].map(i => words[i]).filter(Boolean);
  picks.forEach((w, i) => basic.push({type: 'Từ vựng', prompt: `“${w.zh}” có nghĩa tiếng Việt là gì?`, stem: w.py, options: stableOptions(w.vn, meaningPool.slice(i + 1).concat(meaningPool.slice(0, i + 1)), i + id), answer: w.vn, explain: `${w.zh} · ${w.py} · ${w.vn}`}));
  words.slice(-3).forEach((w, i) => basic.push({type: 'Pinyin', prompt: `Chọn pinyin đúng của “${w.zh}”.`, stem: w.vn, options: stableOptions(w.py, pinyinPool.slice(0, -3), i + id + 2), answer: w.py, explain: `Cách đọc trong bài: ${w.zh} — ${w.py}.`}));
  const advanced: PracticeQuestion[] = [];
  L.scenes.forEach((s, i) => {
    const x = s.lines[Math.min(i, s.lines.length - 1)] || s.lines[0];
    if (!x) return;
    advanced.push({type: 'Bài khoá', prompt: `Chọn bản dịch đúng của câu trong ${s.place_vn.toLowerCase()}.`, stem: `${x.py}\n${x.zh}`, options: stableOptions(x.vn, lines.map(y => y.vn), i + id), answer: x.vn, explain: `Câu này xuất hiện nguyên văn trong Bài khoá ${i + 1}: “${x.zh}”.`});
  });
  // Explicit stable targets recover useful old questions lost when the corrected
  // vocabulary changed the generator's positional picks. Text remains authoritative
  // in the current textbook; corrected old sentences are never resurrected.
  for (const target of restoredTargets.filter(row => row.lesson === id)) {
    const word = words.find(row => row.zh === target.word);
    if (!word) throw new Error(`Missing restored textbook target: ${target.contentId}`);
    const meaning = target.kind === 'meaning';
    const prompt = meaning ? `“${word.zh}” có nghĩa tiếng Việt là gì?` : `Chọn pinyin đúng của “${word.zh}”.`;
    if (basic.some(question => question.prompt === prompt)) continue;
    const answer = meaning ? word.vn : word.py;
    basic.push({ type: meaning ? 'Từ vựng' : 'Pinyin', prompt, stem: meaning ? word.py : word.vn,
      options: stableOptions(answer, meaning ? meaningPool : pinyinPool, id + basic.length), answer,
      explain: meaning ? `${word.zh} · ${word.py} · ${word.vn}` : `Cách đọc trong bài: ${word.zh} — ${word.py}.` });
  }
  return {basic, advanced};
}

export function gradePractice(items: PracticeQuestion[], selections: Record<number, number>) {
  const results = items.map((question, index) => {
    const selection = selections[index];
    const picked = Number.isInteger(selection) && selection >= 0 && selection < question.options.length ? question.options[selection] : null;
    return {picked, correct: picked === question.answer};
  });
  const correct = results.filter(result => result.correct).length;
  return {correct, total: items.length, percent: items.length ? Math.round(correct / items.length * 100) : 0, results};
}
