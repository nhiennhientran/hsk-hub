import { createStore } from "../../hsk1-app/src/services/storage/index.ts";
import type { CourseConfig, Answer, Question, Part } from "./types.ts";
export interface Attempt {
  profile: { name: string; className: string };
  id: string;
  at: number;
  answers: Record<string, Answer>;
  correct: number | null;
  total: number;
  assessment: "automatic" | "manual";
  questionIds: string[];
  version: "2026.1";
  contentRevision?: string;
  questions?: Question[];
}
export interface RecordHistory {
  first: Attempt | null;
  latest: Attempt | null;
  submissions: number;
}
export interface Draft {
  answers: Record<string, Answer>;
  updatedAt: number;
  /** Captured on the first answer, or after an explicit review of an older draft. */
  questions?: Question[];
  contentRevision?: string;
}
export interface ActivityRecord {
  values: Record<string, string | boolean>;
  checkedAt: number | null;
  updatedAt: number;
}
export interface ReadingRecord {
  visited: string[];
  completed: string[];
  lastSection: string;
  scene: number;
  updatedAt: number;
}
export interface ListeningRound {
  selected: number[];
  limit: 5 | 10 | "all";
  wrongOnly: boolean;
  queue: string[];
  index: number;
  answers: Record<string, number>;
  submitted: Record<string, Attempt>;
  playCounts: Record<string, number>;
  startedAt: number;
  questionSnapshots?: Record<string, {question: Question; contentRevision: string}>;
}
export interface State {
  courseId: string;
  version: "2026.1";
  profile: { name: string; className: string };
  completed: string[];
  drafts: Record<string, Draft>;
  homework: Record<string, RecordHistory>;
  listening: Record<string, RecordHistory>;
  listeningRound: ListeningRound | null;
  activities: Record<string, ActivityRecord>;
  reading: Record<string, ReadingRecord>;
  favorites: string[];
  mixed: {
    selected: number[];
    queue: string[];
    index: number;
    seed: string;
  } | null;
}
const object = (v: unknown): v is Record<string, unknown> =>
  v !== null && typeof v === "object" && !Array.isArray(v);
const integer = (v: unknown): v is number =>
  Number.isSafeInteger(v) && Number(v) >= 0;
const str = (v: unknown): v is string => typeof v === "string";
const array = (v: unknown): v is unknown[] => Array.isArray(v);
export const parts: readonly Part[] = [
  "vocabGrammar",
  "ordering",
  "listening",
  "translationChoice",
  "writing",
];
export function blank(config: CourseConfig): State {
  return {
    courseId: config.id,
    version: "2026.1",
    profile: { name: "", className: "" },
    completed: [],
    drafts: {},
    homework: {},
    listening: {},
    mixed: null,
    listeningRound: null,
    activities: {},
    reading: {},
    favorites: [],
  };
}
export function validateState(value: unknown, config: CourseConfig): State {
  const bad = () => {
    throw new Error(
      "数据或课程版本不匹配 · Dữ liệu hoặc phiên bản khóa học không khớp",
    );
  };
  if (
    !object(value) ||
    value.courseId !== config.id ||
    value.version !== "2026.1" ||
    !object(value.profile) ||
    !str(value.profile.name) ||
    !str(value.profile.className) ||
    !array(value.completed) ||
    !value.completed.every(str) ||
    !object(value.drafts) ||
    !object(value.homework) ||
    !object(value.listening)
  )
    return bad();
  const prefix = config.id + ":";
  const lessonPattern = new RegExp("^" + config.id + ":l(\\d{2})$");
  if (
    value.completed.some(
      (x) =>
        !lessonPattern.test(String(x)) ||
        Number(String(x).slice(-2)) < 1 ||
        Number(String(x).slice(-2)) > config.count,
    ) ||
    new Set(value.completed).size !== value.completed.length
  )
    return bad();
  function answers(a: unknown): boolean {
    return (
      object(a) &&
      Object.entries(a).every(
        ([k, v]) =>
          k.startsWith(prefix) &&
          (str(v) ||
            integer(v) ||
            (array(v) && v.every(integer) && new Set(v).size === v.length)),
      )
    );
  }
  function snapshotQuestion(q:unknown,id:unknown):q is Question {
    if(!object(q)||q.id!==id||!str(q.id)||!q.id.startsWith(prefix)||!parts.includes(q.part as Part))return false;
    if(q.prompt!==undefined&&(!object(q.prompt)||!str(q.prompt.zh)||!str(q.prompt.vi)))return false;
    if(q.options!==undefined&&(!array(q.options)||!q.options.every(str)))return false;
    if(q.tokens!==undefined&&(!array(q.tokens)||!q.tokens.every(str)))return false;
    if(q.explanation!==undefined&&(!object(q.explanation)||!str(q.explanation.zh)||!str(q.explanation.vi)))return false;
    return q.part==='writing'||isAnswered(q as unknown as Question,q.answer as Answer);
  }
  function attempt(a:unknown):boolean {
    if(a===null)return true;
    if(!object(a)||!str(a.id)||!integer(a.at)||a.at<=0||!answers(a.answers)||!(a.correct===null||integer(a.correct))||!integer(a.total)||a.total<1||!((a.assessment==='manual'&&a.correct===null)||(a.assessment==='automatic'&&integer(a.correct)&&a.correct<=a.total))||!array(a.questionIds)||!a.questionIds.every(id=>str(id)&&id.startsWith(prefix))||a.questionIds.length!==a.total||new Set(a.questionIds).size!==a.questionIds.length||a.version!=='2026.1'||!object(a.profile)||!str(a.profile.name)||!str(a.profile.className)||(a.contentRevision!==undefined&&!str(a.contentRevision)))return false;
    if(a.questions===undefined)return true; // Historical receipts without snapshots remain raw and are never reinterpreted with current content.
    if(!array(a.questions)||a.questions.length!==a.total||!a.questions.every((q,i)=>snapshotQuestion(q,(a.questionIds as unknown[])[i])))return false;
    const questions=a.questions as unknown as Question[],responses=a.answers as Record<string,Answer>;
    if(questions.some(q=>!isAnswered(q,responses[q.id])))return false;
    if(a.assessment==='manual')return questions.every(q=>q.part==='writing');
    return questions.every(q=>q.part!=='writing')&&a.correct===questions.filter(q=>JSON.stringify(q.answer)===JSON.stringify(responses[q.id])).length;
  }
  for (const [key, draft] of Object.entries(value.drafts))
    if (
      !key.startsWith(prefix) ||
      !object(draft) ||
      !answers(draft.answers) ||
      !integer(draft.updatedAt)
    )
      return bad();
    else if (draft.questions !== undefined) {
      if (!array(draft.questions) || !draft.questions.length ||
          !draft.questions.every(q => snapshotQuestion(q, object(q) ? q.id : undefined) && object(q.prompt)) ||
          new Set(draft.questions.map(q => (q as Question).id)).size !== draft.questions.length ||
          draft.contentRevision !== questionRevision(draft.questions as Question[])) return bad();
    } else if (draft.contentRevision !== undefined) return bad();
  for (const map of [value.homework, value.listening])
    for (const [key, h] of Object.entries(map))
      if (
        !key.startsWith(prefix) ||
        !object(h) ||
        !attempt(h.first) ||
        !attempt(h.latest) ||
        !integer(h.submissions) ||
        (h.submissions === 0 ? h.first !== null || h.latest !== null : h.first === null || h.latest === null)
      )
        return bad();
  if (value.mixed !== null) {
    const m = value.mixed;
    if (
      !object(m) ||
      !array(m.selected) ||
      !m.selected.length ||
      !m.selected.every((n) => integer(n) && n >= 1 && n <= config.count) ||
      new Set(m.selected).size !== m.selected.length ||
      !array(m.queue) ||
      !m.queue.length ||
      !m.queue.every((w) => str(w) && w.startsWith(prefix)) ||
      new Set(m.queue).size !== m.queue.length ||
      !integer(m.index) ||
      m.index >= m.queue.length ||
      !str(m.seed)
    )
      return bad();
  }
  const listeningRound = value.listeningRound ?? null;
  if (listeningRound !== null) {
    const r = listeningRound;
    if (
      !object(r) ||
      !array(r.selected) ||
      !r.selected.length ||
      !r.selected.every((n) => integer(n) && n >= 1 && n <= config.count) ||
      ![5, 10, "all"].includes(r.limit as never) ||
      typeof r.wrongOnly !== "boolean" ||
      !array(r.queue) ||
      !r.queue.length ||
      !r.queue.every((id) => str(id) && id.startsWith(prefix)) ||
      new Set(r.queue).size !== r.queue.length ||
      !integer(r.index) ||
      r.index >= r.queue.length ||
      !object(r.answers) ||
      !Object.entries(r.answers).every(
        ([id, a]) =>
          r.queue instanceof Array && r.queue.includes(id) && integer(a),
      ) ||
      !object(r.submitted) ||
      !Object.entries(r.submitted).every(
        ([id, a]) =>
          r.queue instanceof Array &&
          r.queue.includes(id) &&
          a !== null &&
          attempt(a),
      ) ||
      !object(r.playCounts) ||
      !Object.entries(r.playCounts).every(
        ([id, n]) =>
          r.queue instanceof Array && r.queue.includes(id) && integer(n),
      ) ||
      !integer(r.startedAt)
    )
      return bad();
    if (r.questionSnapshots !== undefined) {
      const queue = r.queue as unknown[];
      if (!object(r.questionSnapshots) || Object.entries(r.questionSnapshots).some(([id, snapshot]) => {
        if (!queue.includes(id) || !object(snapshot) ||
            Object.keys(snapshot).sort().join(',') !== 'contentRevision,question' ||
            !snapshotQuestion(snapshot.question, id) || snapshot.question.part !== 'listening' ||
            !object(snapshot.question.prompt) ||
            snapshot.contentRevision !== questionRevision([snapshot.question])) return true;
        return false;
      })) return bad();
    }
  }
  const activities = value.activities ?? {},
    reading = value.reading ?? {},
    favorites = value.favorites ?? [];
  if (
    !object(activities) ||
    !object(reading) ||
    !array(favorites) ||
    !favorites.every((id) => str(id) && id.startsWith(prefix))
  )
    return bad();
  for (const [key, a] of Object.entries(activities))
    if (
      !key.startsWith(prefix) ||
      !object(a) ||
      !object(a.values) ||
      !Object.values(a.values).every((v) => str(v) || typeof v === "boolean") ||
      !(a.checkedAt === null || integer(a.checkedAt)) ||
      !integer(a.updatedAt)
    )
      return bad();
  for (const [key, r] of Object.entries(reading))
    if (
      !lessonPattern.test(key) ||
      !object(r) ||
      !array(r.visited) ||
      !r.visited.every(str) ||
      !array(r.completed) ||
      !r.completed.every(str) ||
      !str(r.lastSection) ||
      !integer(r.scene) ||
      !integer(r.updatedAt)
    )
      return bad();
  return structuredClone({
    ...value,
    listeningRound,
    activities,
    reading,
    favorites,
  }) as unknown as State;
}
export function createLearningStore(
  config: CourseConfig,
  storage: Pick<Storage, "getItem" | "setItem">,
  lock?: <R>(task: () => R | Promise<R>) => Promise<R>,
) {
  return createStore<State>({
    storage,
    blank: () => blank(config),
    validate: (v) => validateState(v, config),
    lock,
    storageKey: config.storageKey,
    appId: config.id,
    backupAppId: config.id + "-backup",
  });
}
export function isAnswered(q: Question, a: Answer | undefined): boolean {
  if (q.part === "writing") return typeof a === "string" && a.trim().length > 0;
  if (q.part === "ordering")
    return (
      Array.isArray(a) &&
      a.length === q.tokens?.length &&
      new Set(a).size === a.length &&
      a.every((x) => Number.isInteger(x) && x >= 0 && x < q.tokens!.length)
    );
  return (
    typeof a === "number" &&
    Number.isInteger(a) &&
    a >= 0 &&
    a < (q.options?.length ?? 0)
  );
}
export function grade(
  questions: readonly Question[],
  answers: Record<string, Answer>,
  now = Date.now(),
  profile = { name: "", className: "" },
): Attempt {
  if (!questions.length || questions.some((q) => !isAnswered(q, answers[q.id])))
    throw new Error("请先完成本部分 · Hãy hoàn thành phần này trước");
  const manual = questions.every((q) => q.part === "writing");
  if (!manual && questions.some((q) => q.part === "writing"))
    throw new Error("Mixed assessment");
  return {
    profile: structuredClone(profile),
    id: crypto.randomUUID(),
    at: now,
    answers: structuredClone(
      Object.fromEntries(questions.map((q) => [q.id, answers[q.id]!])),
    ),
    correct: manual
      ? null
      : questions.filter(
          (q) => JSON.stringify(answers[q.id]) === JSON.stringify(q.answer),
        ).length,
    total: questions.length,
    assessment: manual ? "manual" : "automatic",
    questionIds: questions.map((q) => q.id),
    questions: structuredClone([...questions]),
    contentRevision: questionRevision(questions),
    version: "2026.1",
  };
}
export function recordAttempt(
  state: State,
  key: string,
  attempt: Attempt,
  kind: "homework" | "listening" = "homework",
): void {
  const previous = state[kind][key];
  state[kind][key] = {
    first: previous?.first ?? structuredClone(attempt),
    latest: structuredClone(attempt),
    submissions: (previous?.submissions ?? 0) + 1,
  };
  delete state.drafts[key];
}

/** Deterministic revision detects any historical prompt/options/answer change. Receipts render their frozen questions. */
export function questionRevision(questions: readonly Question[]): string {
  let hash = 2166136261;
  for (const c of JSON.stringify(questions)) {
    hash ^= c.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return "q1-" + (hash >>> 0).toString(16).padStart(8, "0");
}

export type DraftQuestionStatus = 'current' | 'saved' | 'missing' | 'incompatible';
/** A display revision may replace only these two Vietnamese leaves. */
function questionAuthority(question: Question): string {
  const copy = structuredClone(question);
  delete (copy.prompt as Partial<Question['prompt']>).vi;
  if (copy.explanation) delete (copy.explanation as Partial<Question['prompt']>).vi;
  const sorted = (value: unknown): unknown => Array.isArray(value) ? value.map(sorted) :
    object(value) ? Object.fromEntries(Object.keys(value).sort().map(key => [key, sorted(value[key])])) : value;
  return JSON.stringify(sorted(copy));
}
/** Partial drafts have no score; validate a response against its actual saved input. */
function isDraftAnswer(question: Question, answer: Answer): boolean {
  if (question.part === 'writing') return typeof answer === 'string';
  if (question.part === 'ordering') return Array.isArray(answer) && !!question.tokens &&
    answer.length <= question.tokens.length && new Set(answer).size === answer.length &&
    answer.every(index => Number.isSafeInteger(index) && index >= 0 && index < question.tokens!.length);
  return Number.isSafeInteger(answer) && typeof answer === 'number' &&
    answer >= 0 && answer < (question.options?.length ?? 0);
}
export function resolveDraftQuestions(current: readonly Question[], draft?: Draft, requireLegacyReview = false): {questions: Question[]; status: DraftQuestionStatus} {
  if (draft?.questions) {
    const compatible = draft.questions.length === current.length && draft.questions.every((saved, index) =>
      saved.id === current[index]?.id && questionAuthority(saved) === questionAuthority(current[index]!));
    return {questions: structuredClone(draft.questions), status: compatible ? 'saved' : 'incompatible'};
  }
  return {questions: structuredClone([...current]), status: requireLegacyReview && draft && Object.keys(draft.answers).length ? 'missing' : 'current'};
}
/** Explicit review is required before attributing an unbound older draft to current questions. */
export function acknowledgeDraftQuestions(draft: Draft | undefined, current: readonly Question[], now = Date.now()): Draft {
  const resolved = resolveDraftQuestions(current, draft);
  if (resolved.status === 'incompatible' || !current.length) throw Error('草稿题目已变更，请开始新作业 · Câu hỏi bản nháp đã thay đổi; hãy bắt đầu bài mới');
  const questions = resolved.status === 'saved' ? resolved.questions : structuredClone([...current]);
  const answers = structuredClone(draft?.answers ?? {});
  // Older incomplete answers stay editable and exportable. Submission still
  // requires isAnswered for every actual question; no draft is treated as a score.
  return {answers, updatedAt: now, questions, contentRevision: questionRevision(questions)};
}
export function captureDraftAnswer(draft: Draft | undefined, current: readonly Question[], id: string, value: Answer, now = Date.now(), requireLegacyReview = false): Draft {
  const resolved = resolveDraftQuestions(current, draft, requireLegacyReview);
  if (resolved.status === 'missing' || resolved.status === 'incompatible') throw Error('请先核对旧草稿题目 · Hãy kiểm tra câu hỏi của bản nháp cũ trước');
  const question = resolved.questions.find(question => question.id === id);
  if (!question || !isDraftAnswer(question, value)) throw Error('草稿答案无效 · Đáp án bản nháp không hợp lệ');
  const result = acknowledgeDraftQuestions(draft, current, now);
  result.answers[id] = structuredClone(value);
  return result;
}
export function resolveListeningDraftQuestion(current: Question, round: ListeningRound, requireLegacyReview = false): {question: Question; status: DraftQuestionStatus} {
  const snapshot = round.questionSnapshots?.[current.id];
  const resolved = resolveDraftQuestions([current], {
    answers: round.answers[current.id] === undefined ? {} : {[current.id]: round.answers[current.id]!},
    updatedAt: round.startedAt,
    ...(snapshot ? {questions: [snapshot.question], contentRevision: snapshot.contentRevision} : {}),
  }, requireLegacyReview);
  return {question: resolved.questions[0]!, status: resolved.status};
}
export function acknowledgeListeningDraftQuestion(round: ListeningRound, current: Question): ListeningRound {
  if (!round.queue.includes(current.id) || round.submitted[current.id]) throw Error('听力题目不属于当前未提交轮次 · Câu nghe không thuộc lượt chưa nộp hiện tại');
  const resolved = resolveListeningDraftQuestion(current, round);
  if (resolved.status === 'incompatible') throw Error('听力题目已变更，请开始新一组 · Câu nghe đã thay đổi; hãy bắt đầu nhóm mới');
  const copy = structuredClone(round), question = resolved.status === 'saved' ? resolved.question : structuredClone(current);
  (copy.questionSnapshots ??= {})[current.id] = {question, contentRevision: questionRevision([question])};
  return copy;
}
export function captureListeningDraftAnswer(round: ListeningRound, current: Question, answer: number, requireLegacyReview = false): ListeningRound {
  const resolved = resolveListeningDraftQuestion(current, round, requireLegacyReview);
  if (resolved.status === 'missing' || resolved.status === 'incompatible') throw Error('请先核对旧听力题目 · Hãy kiểm tra câu hỏi nghe cũ trước');
  if (!isDraftAnswer(resolved.question, answer)) throw Error('听力答案无效 · Đáp án nghe không hợp lệ');
  const copy = acknowledgeListeningDraftQuestion(round, current);
  copy.answers[current.id] = answer;
  return copy;
}
