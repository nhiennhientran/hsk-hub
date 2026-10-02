import type { Route } from '../../app/contracts.ts';
import { setBilingual, type BilingualCopy } from '../../app/bilingual.ts';
import { routeHref } from '../../app/router.ts';

export function element<K extends keyof HTMLElementTagNameMap>(tag: K, text?: string | BilingualCopy): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (typeof text === 'string') node.textContent = text;
  else if (text) setBilingual(node, text);
  return node;
}
export function button(text: string | BilingualCopy, action?: () => void, signal?: AbortSignal): HTMLButtonElement {
  const node = element('button', text); node.type = 'button';
  if (action) node.addEventListener('click', action, { signal });
  return node;
}
export function routeLink(text: string | BilingualCopy, route: Route): HTMLAnchorElement {
  const node = element('a', text); node.href = routeHref(route); node.dataset.routeLink = ''; return node;
}
export const searchKey = (text: string): string => text.normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/gi, 'd').toLocaleLowerCase().replace(/\s+/g, '').trim();
