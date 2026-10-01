import courseIndexURL from '../../../content/course-index.json?url';

export interface LessonSummary {
  readonly id: number;
  readonly title: string;
  readonly titleVi: string;
  readonly vocabularyCount: number;
  readonly scenesCount: number;
  readonly grammarCount: number;
  readonly phoneticsCount: number;
  readonly homeworkCount: number;
  readonly listeningCount: number;
  readonly senseCount: number;
}

export async function loadCourseIndex(signal: AbortSignal): Promise<readonly LessonSummary[]> {
  const response = await fetch(courseIndexURL, { signal });
  if (!response.ok) throw new Error(`Course index HTTP ${response.status}`);
  const value: unknown = await response.json();
  if (signal.aborted) throw new DOMException('Module left.', 'AbortError');
  if (!value || typeof value !== 'object' || !('schemaVersion' in value) || value.schemaVersion !== 1 ||
    !('lessons' in value) || !Array.isArray(value.lessons) || value.lessons.length !== 15) {
    throw new Error('Invalid course index.');
  }
  const countFields = ['vocabularyCount', 'scenesCount', 'grammarCount', 'phoneticsCount', 'homeworkCount', 'listeningCount', 'senseCount'] as const;
  const ids = new Set<number>();
  for (const row of value.lessons) {
    if (!row || !Number.isInteger(row.id) || row.id < 1 || row.id > 15 || ids.has(row.id) ||
      typeof row.title !== 'string' || !row.title.trim() || typeof row.titleVi !== 'string' || !row.titleVi.trim() ||
      countFields.some(field => !Number.isInteger(row[field]) || row[field] < 0 || row[field] > 1000)) {
      throw new Error('Invalid lesson summary.');
    }
    ids.add(row.id);
  }
  return value.lessons;
}
