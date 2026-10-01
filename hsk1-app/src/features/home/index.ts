import { createEntryModule } from '../entry.ts';
import type { FeatureModule } from '../../app/contracts.ts';
import { routeHref } from '../../app/router.ts';

/** Home retains the course overview and reads the shared session for continuation. */
export const mount: FeatureModule['mount'] = (host, context) => {
  const entry = createEntryModule('home').mount(host, context);
  let left = false, unsubscribe = () => {};
  const continuation = document.createElement('p'); continuation.id = 'continue-learning'; continuation.hidden = true;
  host.append(continuation);
  const ready = entry.ready.then(async () => {
    if (left || context.signal.aborted || !context.learning) return;
    const session = await context.learning();
    if (left || context.signal.aborted) return;
    const render = () => {
      if (left || context.signal.aborted) return;
      const data = session.store.snapshot().data;
      continuation.replaceChildren();
      continuation.hidden = data.navigation === null;
      if (data.navigation) {
        const link = document.createElement('a'); link.dataset.routeLink = ''; link.id = 'continue-learning-link';
        link.href = routeHref(data.navigation); link.textContent = `Tiếp tục học · Bài ${data.navigation.lesson}`; continuation.append(link);
      }
      for (const card of host.querySelectorAll<HTMLElement>('.lesson-card[data-lesson]')) {
        const id = card.dataset.lesson!;
        let state = card.querySelector<HTMLElement>('[data-reading-summary]');
        if (!state) { state = document.createElement('p'); state.dataset.readingSummary = ''; card.append(state); }
        const row = data.reading.lessons[id], count = data.reading.modules[`hsk1:${id}`]?.modules.length ?? 0;
        state.textContent = `${row?.complete ? 'Đã đánh dấu hoàn thành' : row?.visited ? 'Đã mở bài' : 'Chưa mở bài'} · ${count}/5 mục giáo trình đã mở`;
      }
    };
    unsubscribe = session.store.subscribe(render); render();
  });
  return { ready, unmount() { if (left) return; left = true; unsubscribe(); continuation.remove(); entry.unmount(); } };
};
