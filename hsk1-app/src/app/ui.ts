import { setBilingual, type BilingualCopy } from './bilingual.ts';
import type { Route } from './contracts.ts';
import { routeHref } from './router.ts';

/** Small safe DOM primitives; domain behavior stays in each feature. */
export function element<K extends keyof HTMLElementTagNameMap>(tag: K, text?: string | BilingualCopy): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (typeof text === 'string') node.textContent = text;
  else if (text) setBilingual(node, text);
  return node;
}
export function routeLink(text: string | BilingualCopy, route: Route): HTMLAnchorElement {
  const link = element('a', text); link.href = routeHref(route); link.dataset.routeLink = ''; return link;
}
export function disclosure(label: BilingualCopy, className = 'secondary-details'): HTMLDetailsElement {
  const details = element('details'); details.className = className;
  details.append(element('summary', label)); return details;
}
