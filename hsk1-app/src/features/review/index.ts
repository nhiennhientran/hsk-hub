import type { FeatureModule, Route } from '../../app/contracts.ts';
import { bilingualNode, bilingualText } from '../../app/bilingual.ts';
import { routeLink } from '../textbook/dom.ts';
import { reviewCopy as copy } from '../../app/i18n/review.ts';
import '../../app/bilingual.css';
import './review.css';

/** One practice doorway; legacy exercise routes remain compatibility-only. */
export const mount: FeatureModule['mount'] = (host, context) => {
  const article = document.createElement('article'); article.id = 'review-module'; article.className = 'module-entry review-hub';
  const heading = bilingualNode('h1', copy.title); heading.tabIndex = -1;
  const paths = document.createElement('nav'); paths.className = 'review-paths'; paths.setAttribute('aria-label', bilingualText(copy.paths));
  const lesson = context.route.lesson;
  const destinations = [
    { title: copy.vocabulary, detail: copy.vocabularyDetail, route: { feature: 'vocabulary', lesson } },
    { title: copy.listening, detail: copy.listeningDetail, route: { feature: 'listening', lesson } },
    { title: copy.textbook, detail: copy.textbookDetail(lesson), route: { feature: 'textbook', lesson, section: 'practice' } },
  ] satisfies Array<{ title: typeof copy.title; detail: typeof copy.title; route: Route }>;
  for (const destination of destinations) {
    const link = routeLink('', destination.route); link.id = `review-${destination.route.feature}`;
    link.append(bilingualNode('h2', destination.title), bilingualNode('p', destination.detail)); paths.append(link);
  }
  article.append(heading, bilingualNode('p', copy.introduction), paths); host.append(article);
  return { ready: Promise.resolve(), unmount() { article.remove(); } };
};
