import type { Feature, FeatureModule, ModuleStatus, MountHandle, Route } from './contracts.ts';

export interface LifecycleOptions {
  audio?: () => Promise<import('../services/audio/index.ts').AudioService>;
  learning?: () => Promise<import('../services/learning/session.ts').LearningSession>;
  host: HTMLElement;
  loadModule(feature: Feature, signal: AbortSignal): Promise<FeatureModule>;
  navigate(route: Route): void;
  onState(status: ModuleStatus): void;
}

export interface Lifecycle {
  show(route: Route): Promise<void>;
  retry(): Promise<void>;
  dispose(): void;
}

interface Attempt {
  route: Route;
  controller: AbortController;
  surface: HTMLElement;
  handle?: MountHandle;
}

const aborted = Symbol('aborted');

// Keep observing the original promise after cancellation, including a late rejection.
function untilAborted<T>(promise: Promise<T>, signal: AbortSignal): Promise<T | typeof aborted> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (action: () => void) => {
      if (settled) return;
      settled = true;
      signal.removeEventListener('abort', cancel);
      action();
    };
    const cancel = () => finish(() => resolve(aborted));
    Promise.resolve(promise).then(
      value => finish(() => resolve(value)),
      error => finish(() => reject(error)),
    );
    if (signal.aborted) cancel();
    else signal.addEventListener('abort', cancel, { once: true });
  });
}

function combineErrors(errors: unknown[]): unknown {
  return errors.length === 1 ? errors[0] : new AggregateError(errors, 'Module cleanup failed');
}

export function createLifecycle(options: LifecycleOptions): Lifecycle {
  const { host, loadModule, navigate, onState } = options;
  let active: Attempt | undefined;
  let lastRoute: Route | undefined;
  let disposed = false;
  // A throwing unmount remains available for an explicit retry. Do not enable a
  // new module while its predecessor's cleanup is incomplete.
  const cleanupPending = new Set<Attempt>();

  const isCurrent = (attempt: Attempt) => !disposed && active === attempt;

  function setState(state: ModuleStatus['state']) {
    host.setAttribute('data-state', state);
    host.setAttribute('aria-busy', String(state === 'loading'));
    host.inert = state === 'loading';
  }

  function controls(attempt: Attempt, disabled: boolean) {
    for (const fieldset of attempt.surface.querySelectorAll<HTMLFieldSetElement>('fieldset[data-module-controls]')) {
      fieldset.disabled = disabled;
    }
  }

  function stop(attempt: Attempt): unknown[] {
    attempt.controller.abort();
    attempt.surface.remove();
    if (!attempt.handle) return [];
    try {
      attempt.handle.unmount();
      attempt.handle = undefined;
      cleanupPending.delete(attempt);
      return [];
    } catch (error) {
      cleanupPending.add(attempt);
      return [error];
    }
  }

  function fail(attempt: Attempt, errors: unknown[]) {
    if (!isCurrent(attempt)) return;
    const cleanupErrors = stop(attempt);
    errors.push(...cleanupErrors);
    if (!isCurrent(attempt)) {
      reportCleanupFailure(cleanupErrors);
      return;
    }
    host.replaceChildren();
    setState('error');
    onState({ state: 'error', route: attempt.route, error: combineErrors(errors) });
  }

  function reportCleanupFailure(errors: unknown[]) {
    if (!errors.length) return;
    if (active) fail(active, errors);
    else if (disposed && lastRoute) {
      // dispose can be called inside an unmount callback before that callback
      // throws. This synchronous cleanup failure must still be reported.
      setState('error');
      onState({ state: 'error', route: lastRoute, error: combineErrors(errors) });
    }
  }

  async function show(route: Route): Promise<void> {
    if (disposed) return;
    const previous = active;
    const attempt: Attempt = {
      route,
      controller: new AbortController(),
      surface: host.ownerDocument.createElement('div'),
    };
    attempt.surface.setAttribute('data-module-surface', route.feature);
    active = attempt;
    lastRoute = route;

    const predecessors = new Set(cleanupPending);
    if (previous) predecessors.add(previous);
    const cleanupErrors: unknown[] = [];
    for (const predecessor of predecessors) cleanupErrors.push(...stop(predecessor));
    if (!isCurrent(attempt)) {
      reportCleanupFailure(cleanupErrors);
      return;
    }
    host.replaceChildren();
    if (cleanupErrors.length) {
      fail(attempt, cleanupErrors);
      return;
    }

    host.appendChild(attempt.surface);
    setState('loading');
    onState({ state: 'loading', route });
    if (!isCurrent(attempt)) return;

    try {
      const module = await untilAborted(loadModule(route.feature, attempt.controller.signal), attempt.controller.signal);
      if (module === aborted || !isCurrent(attempt)) return;
      attempt.handle = module.mount(attempt.surface, {
        route,
        signal: attempt.controller.signal,
        navigate,
        learning: options.learning,
        audio: options.audio,
      });
      const ready = untilAborted(attempt.handle.ready, attempt.controller.signal);
      if (!isCurrent(attempt)) {
        // A module can navigate synchronously during mount. Its returned handle
        // still belongs to the retired surface and must be cleaned up.
        const errors = stop(attempt);
        reportCleanupFailure(errors);
        await ready;
        return;
      }
      controls(attempt, true);
      const result = await ready;
      if (result === aborted || !isCurrent(attempt)) return;
      controls(attempt, false);
      setState('ready');
      onState({ state: 'ready', route });
    } catch (error) {
      fail(attempt, [error]);
    }
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    const predecessors = new Set(cleanupPending);
    if (active) predecessors.add(active);
    active = undefined;
    const errors: unknown[] = [];
    for (const predecessor of predecessors) errors.push(...stop(predecessor));
    host.replaceChildren();
    host.removeAttribute('data-state');
    host.setAttribute('aria-busy', 'false');
    host.inert = false;
    reportCleanupFailure(errors);
  }

  return {
    show,
    retry: () => lastRoute ? show(lastRoute) : Promise.resolve(),
    dispose,
  };
}
