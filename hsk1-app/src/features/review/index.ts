import type { FeatureModule } from '../../app/contracts.ts';
import { mountVocabulary } from '../vocabulary/view.ts';
import { element, routeLink } from '../textbook/dom.ts';

/** Separate question review and vocabulary self-ratings, with one doorway. */
export const mount: FeatureModule['mount'] = (host, context) => {
  const paths = element('nav'); paths.className = 'study-paths review-paths'; paths.setAttribute('aria-label', 'Chọn nội dung ôn');
  paths.append(routeLink('Câu bài tập còn sai · 作业错题', { feature: 'exercises', lesson: context.route.lesson, exerciseSet: 'homework-review', exerciseFilter: 'wrong' }),
    routeLink('Câu bài tập đến hạn · 作业复习', { feature: 'exercises', lesson: context.route.lesson, exerciseSet: 'homework-review', exerciseFilter: 'due' }),
    routeLink('Ôn bài tập gốc · 旧题复习', { feature: 'exercises', lesson: context.route.lesson, exerciseSet: 'original', exerciseFilter: 'due' }));
  host.append(paths);
  const mounted = mountVocabulary(host, context, 'review');
  return { ready: mounted.ready, unmount() { mounted.unmount(); paths.remove(); } };
};
