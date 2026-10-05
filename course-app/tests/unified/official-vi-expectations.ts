import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import type {Lesson} from '../../src/types.ts';

// Expectations follow the accepted active display, while older snapshots in
// history tests remain explicit snapshots of their own saved text.
const repo = resolve(import.meta.dirname, '../../..');
const digest = (value: string) => createHash('sha256').update(value).digest('hex');
export function currentViLesson(raw: Lesson): Lesson {
  const level = raw.courseId.startsWith('hsk2-') ? 2 : 3;
  const index = JSON.parse(readFileSync(resolve(repo, 'course-app/content/official-vi-registry.json'), 'utf8'));
  const entry = index.courses[`hsk${level}`];
  const result = structuredClone(raw);
  if (!entry) return result;
  const text = readFileSync(resolve(repo, entry.manifestFile), 'utf8');
  if (digest(text) !== entry.manifestSHA256) throw Error('Expected active VI manifest changed');
  const proof = readFileSync(resolve(repo, entry.reviewFile), 'utf8');
  if (digest(proof) !== entry.reviewSHA256) throw Error('Expected active VI review changed');
  const file = `course-app/content/hsk${level}/lesson-${String(raw.number).padStart(2, '0')}.json`;
  for (const change of JSON.parse(text).changes.filter((value: {baselineFile: string}) => value.baselineFile === file)) {
    const parts: string[] = change.field.slice(1).split('/').map((part: string) => part.replaceAll('~1', '/').replaceAll('~0', '~'));
    if (parts.at(-1) !== 'vi' || parts.some(part => ['__proto__', 'constructor', 'prototype'].includes(part))) throw Error('Unsafe VI expectation');
    let parent: any = result;
    for (const part of parts.slice(0, -1)) parent = parent[part];
    if (parent.vi !== change.expectedEffectiveValue) throw Error('Stale VI expectation');
    parent.vi = change.newValue;
  }
  return result;
}
