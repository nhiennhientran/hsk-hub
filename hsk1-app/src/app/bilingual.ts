/** Explicit interface translations. Lesson content and persisted data stay unchanged. */
export interface BilingualCopy { readonly zh: string; readonly vi: string }
function copy(value: string | BilingualCopy, vi?: string): BilingualCopy {
  return typeof value === 'string' ? { zh: value, vi: vi ?? '' } : value;
}
export function bilingualText(value: BilingualCopy): string;
export function bilingualText(zh: string, vi: string): string;
export function bilingualText(value: string | BilingualCopy, vi?: string): string {
  const pair = copy(value, vi); return `${pair.zh} · ${pair.vi}`;
}
export function setBilingual(host: HTMLElement, value: BilingualCopy): void;
export function setBilingual(host: HTMLElement, zh: string, vi: string): void;
export function setBilingual(host: HTMLElement, value: string | BilingualCopy, vi?: string): void {
  const pair = copy(value, vi);
  const chinese = document.createElement('span'); chinese.lang = 'zh'; chinese.className = 'bilingual-zh'; chinese.textContent = pair.zh;
  const separator = document.createElement('span'); separator.className = 'bilingual-separator'; separator.textContent = ' · ';
  const vietnamese = document.createElement('span'); vietnamese.lang = 'vi'; vietnamese.className = 'bilingual-vi'; vietnamese.textContent = pair.vi;
  host.replaceChildren(chinese, separator, vietnamese);
}
export function bilingualNode<K extends keyof HTMLElementTagNameMap>(tag: K, value: BilingualCopy): HTMLElementTagNameMap[K];
export function bilingualNode<K extends keyof HTMLElementTagNameMap>(tag: K, zh: string, vi: string): HTMLElementTagNameMap[K];
export function bilingualNode<K extends keyof HTMLElementTagNameMap>(tag: K, value: string | BilingualCopy, vi?: string): HTMLElementTagNameMap[K] {
  const host = document.createElement(tag); setBilingual(host, copy(value, vi)); return host;
}
