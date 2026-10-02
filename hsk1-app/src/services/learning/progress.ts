import { blankExercisesState, exerciseQueue, exerciseTotals } from '../../domain/exercises/engine.ts';
import type { ExerciseCatalogue } from '../../domain/exercises/catalogue.ts';
import homework from '../../domain/homework/engine.js';
import practice from '../../domain/practice/engine.js';
import type { Route } from '../../app/contracts.ts';
import { featureLabels, partLabels, sectionLabels } from '../../app/labels.ts';
import type { AppData } from '../storage/compatibility.ts';
import type { HomeworkLesson } from '../content/homework.ts';
import type { ListeningCatalog } from '../content/listening.ts';
import type { ListeningSession } from '../../domain/listening/types.ts';

export interface ProgressSources {
  bank: readonly HomeworkLesson[];
  catalog: ListeningCatalog;
  exercises?: ExerciseCatalogue;
}
export interface ProgressLink { label: string; route: Route }
interface SavedReview { senseIds: string[]; position: number; lessons: number[] }

/** Read the real saved position, never infer continuation from scores or completion. */
export function progressResume(data: AppData, catalog: ListeningCatalog): ProgressLink | null {
  const navigation = data.navigation;
  if (!navigation || navigation.feature === 'home' || navigation.feature === 'progress') return null;
  let route = { ...navigation }, suffix = `Bài ${route.lesson}`;
  if (route.feature === 'listening') {
    const round = data.practice.listening.session as unknown as ListeningSession | null;
    const question = round && catalog.listening.find(item => item.id === round.questionIds[round.position]);
    if (question && round) { route = { feature: 'listening', lesson: question.lesson }; suffix = `Bài ${question.lesson} · Câu ${round.position + 1}/${round.questionIds.length}`; }
  } else if (route.feature === 'vocabulary' || route.feature === 'review') {
    const round = data.practice.cards.review as unknown as SavedReview | null;
    const card = round && catalog.vocabulary.find(item => item.senseId === round.senseIds[round.position] && round.lessons.includes(item.lesson));
    if (card && round) { route = { feature: route.feature, lesson: card.lesson }; suffix = `Bài ${card.lesson} · Thẻ ${round.position + 1}/${round.senseIds.length}`; }
  } else if (route.feature === 'textbook') suffix += ` · ${sectionLabels[route.section ?? 'vocab']}`;
  else if (route.feature === 'homework') suffix += ` · ${partLabels[route.part ?? 'choice']}`;
  return { label: `Tiếp tục ${featureLabels[route.feature].toLocaleLowerCase('vi')} · ${suffix}`, route };
}

function translationState(data: AppData, lesson: HomeworkLesson) {
  const group = data.homework.lessons[String(lesson.lesson)]?.translation;
  const latest = group?.latest ?? group?.first;
  // A submitted group's draft is its submitted answer copy, not another pending draft.
  const pending = group && !group.attempt ? group.draft : {};
  return { total: lesson.translation.length, submitted: latest?.total ?? 0,
    draftAnswered: lesson.translation.filter(question => homework.isAnswered(question, pending[question.id])).length,
    hasDraft: Object.values(pending).some(answer => typeof answer === 'string' && answer.length > 0),
    submittedAt: latest?.at ?? null,
  };
}

/** Independent read-only projections. A reading mark, translation or self-rating is never an objective score. */
export function summarizeProgress(data: AppData, { bank, catalog, exercises }: ProgressSources, now = Date.now()) {
  const totals = homework.courseTotals(data.homework, bank);
  const listening = practice.listeningSummary(data.practice, catalog);
  const cards = practice.cardSummary(data.practice, catalog, now);
  const senseIds = new Set(catalog.vocabulary.map(item => item.senseId));
  const schedules = [...senseIds].flatMap(id => {
    const entry = data.practice.cards.schedule[id];
    return entry && typeof entry === 'object' && !Array.isArray(entry) ? [entry] : [];
  });
  const vocabulary = { ...cards, records: catalog.vocabulary.length,
    distinctForms: new Set(catalog.vocabulary.map(item => item.zh.normalize('NFKC'))).size,
    new: cards.totalSenses - cards.rated,
    dueRated: schedules.filter(entry => Number(entry.dueAt) <= now).length,
    again: schedules.filter(entry => entry.lastRating === 'again').length,
    hard: schedules.filter(entry => entry.lastRating === 'hard').length,
    good: schedules.filter(entry => entry.lastRating === 'good').length,
    nextDueAt: schedules.reduce<number | null>((next, entry) => {
      const due = Number(entry.dueAt); return due > now && (next === null || due < next) ? due : next;
    }, null),
  };
  const lessons = bank.map(lesson => {
    const id = String(lesson.lesson), reading = data.reading.lessons[id];
    const totals = homework.totals(data.homework, lesson.lesson, lesson);
    const translation = translationState(data, lesson);
    const records = catalog.listening.filter(item => item.lesson === lesson.lesson).map(item => data.practice.listening.records[item.id]).filter(Boolean);
    const nextPart = (['choice', 'sort', 'translation'] as const).find(part => !data.homework.lessons[id]?.[part]?.completed) ?? 'choice';
    return { lesson: lesson.lesson, title: lesson.title, titleVi: lesson.title_vi,
      reading: { visited: !!reading?.visited, complete: !!reading?.complete, modules: data.reading.modules[`hsk1:${id}`]?.modules.length ?? 0 },
      homework: totals.homework, automatic: totals.automatic, translation,
      listening: { total: catalog.listening.filter(item => item.lesson === lesson.lesson).length, answered: records.length,
        firstCorrect: records.filter(record => record.first.correct).length, latestCorrect: records.filter(record => record.latest.correct).length },
      homeworkRoute: { feature: 'homework', lesson: lesson.lesson, part: nextPart } as Route,
    };
  });
  const listeningRound = data.practice.listening.session as unknown as ListeningSession | null;
  const review = data.practice.cards.review as unknown as SavedReview | null;
  const listeningQuestion = listeningRound && catalog.listening.find(item => item.id === listeningRound.questionIds[listeningRound.position]);
  const reviewCard = review && catalog.vocabulary.find(item => item.senseId === review.senseIds[review.position] && review.lessons.includes(item.lesson));
  const exerciseState = data.exercises ?? blankExercisesState();
  const extraExercises = exercises ? {
    original: exerciseTotals(exercises, exerciseState, exercises.entries.filter(entry => entry.set === 'original')),
    pilot: exerciseTotals(exercises, exerciseState, exercises.entries.filter(entry => entry.set === 'pilot')),
    reviewWrong: bank.reduce((total, lesson) => total + exerciseQueue(exercises, exerciseState, { set: 'homework-review', lesson: lesson.lesson, filter: 'wrong', homework: data.homework, now }).length, 0),
    reviewDue: bank.reduce((total, lesson) => total + exerciseQueue(exercises, exerciseState, { set: 'homework-review', lesson: lesson.lesson, filter: 'due', homework: data.homework, now }).length, 0),
  } : null;
  return {
    extraExercises,
    reading: { total: bank.length, visited: lessons.filter(row => row.reading.visited).length,
      complete: lessons.filter(row => row.reading.complete).length,
      starred: Object.values(data.reading.mastered).filter(Boolean).length },
    homework: totals.homework, automatic: totals.automatic,
    translation: { total: totals.manual.total, submitted: totals.manual.submitted,
      draftAnswered: lessons.reduce((count, row) => count + row.translation.draftAnswered, 0),
      draftLessons: lessons.filter(row => row.translation.hasDraft).length },
    listening, vocabulary, lessons, resume: progressResume(data, catalog),
    listeningResume: listeningQuestion && listeningRound ? {
      route: { feature: 'listening', lesson: listeningQuestion.lesson } as Route,
      label: `Tiếp tục lượt nghe · Câu ${listeningRound.position + 1}/${listeningRound.questionIds.length}`,
    } : null,
    vocabularyResume: reviewCard && review ? {
      route: { feature: data.navigation?.feature === 'review' ? 'review' : 'vocabulary', lesson: reviewCard.lesson } as Route,
      label: `Tiếp tục lượt từ vựng · Thẻ ${review.position + 1}/${review.senseIds.length}`,
    } : null,
  };
}
export type ProgressSummary = ReturnType<typeof summarizeProgress>;
