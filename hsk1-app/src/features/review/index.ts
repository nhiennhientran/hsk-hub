import type { FeatureModule } from '../../app/contracts.ts';
import { mountVocabulary } from '../vocabulary/view.ts';
import { element, routeLink } from '../textbook/dom.ts';
import { bilingualNode, bilingualText } from '../../app/bilingual.ts';
import { exerciseCopy as copy } from '../../app/i18n/exercises.ts';
import '../../app/bilingual.css';

/** Separate question review and vocabulary self-ratings, with one doorway. */
export const mount: FeatureModule['mount'] = (host, context) => {
  const paths = element('nav'); paths.className = 'study-paths review-paths'; paths.setAttribute('aria-label', bilingualText(copy.reviewPaths));
  for (const [label, set, filter] of [
    [copy.reviewWrong, 'homework-review', 'wrong'],
    [copy.reviewDue, 'homework-review', 'due'],
    [copy.reviewOriginal, 'original', 'due'],
  ] as const) {
    const link = routeLink('', { feature: 'exercises', lesson: context.route.lesson, exerciseSet: set, exerciseFilter: filter });
    const text = bilingualNode('span', label); text.className = 'bilingual-stacked'; link.append(text); paths.append(link);
  }
  host.append(paths);
  const mounted = mountVocabulary(host, context, 'review');
  return { ready: mounted.ready, unmount() { mounted.unmount(); paths.remove(); } };
};
