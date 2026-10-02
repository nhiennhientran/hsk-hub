import type { Feature } from './contracts.ts';
import type { BilingualCopy } from './bilingual.ts';

/** Presentation groups never replace route IDs or persisted learning domains. */
export const NAVIGATION_GROUPS: readonly {
  id: 'courses' | 'homework' | 'practice' | 'progress';
  feature: Feature; members: readonly Feature[]; label: BilingualCopy;
}[] = [
  { id: 'courses', feature: 'home', members: ['home', 'textbook'], label: { zh: '课程', vi: 'Bài học' } },
  { id: 'homework', feature: 'homework', members: ['homework', 'exercises'], label: { zh: '课后作业', vi: 'Bài tập' } },
  { id: 'practice', feature: 'review', members: ['review', 'vocabulary', 'listening'], label: { zh: '练习与复习', vi: 'Luyện & ôn tập' } },
  { id: 'progress', feature: 'progress', members: ['progress'], label: { zh: '进度', vi: 'Tiến độ' } },
];
export const navigationGroup = (feature: Feature) => NAVIGATION_GROUPS.find(group => group.members.includes(feature))!;
