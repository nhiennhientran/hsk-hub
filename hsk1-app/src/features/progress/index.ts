import { createEntryModule } from '../entry.ts';
import type { FeatureModule } from '../../app/contracts.ts';

/** Progress exercises arrive in step 7; backup management is ready in step 3. */
export const mount: FeatureModule['mount'] = (host, context) => {
  const entry = createEntryModule('progress').mount(host, context);
  const controls = document.createElement('div');
  const open = document.createElement('button');
  open.id = 'open-data-manager'; open.type = 'button'; open.disabled = true;
  open.textContent = 'Quản lý dữ liệu và bản sao lưu';
  const message = document.createElement('p'); message.setAttribute('role', 'status');
  controls.append(open, message); host.append(controls);
  const controller = new AbortController();
  let left = false;
  let panel: { dispose(): void } | undefined;
  const abort = () => controller.abort();
  context.signal.addEventListener('abort', abort, { once: true });
  if (context.signal.aborted) abort();
  const ready = entry.ready.then(() => {
    if (left || controller.signal.aborted) return;
    open.disabled = false;
    open.addEventListener('click', async () => {
      if (left || controller.signal.aborted || panel || open.disabled) return;
      open.disabled = true; message.textContent = 'Đang mở dữ liệu trên thiết bị…';
      try {
        const feature = await import('./data-panel.ts');
        if (left || controller.signal.aborted) return;
        if (!context.learning) throw new Error('Learning session is missing.');
        panel = await feature.mountDataPanel(host, controller.signal, context.learning);
        if (left || controller.signal.aborted) { panel.dispose(); return; }
        message.textContent = ''; open.hidden = true;
      } catch {
        if (left || controller.signal.aborted) return;
        message.textContent = 'Không mở được dữ liệu. Vui lòng thử lại.'; open.disabled = false;
      }
    }, { signal: controller.signal });
  });
  return {
    ready,
    unmount() {
      if (left) return;
      left = true; controller.abort(); panel?.dispose(); entry.unmount(); controls.remove();
      context.signal.removeEventListener('abort', abort);
    },
  };
};
