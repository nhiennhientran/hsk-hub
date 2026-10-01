export const FEATURES = ['home', 'textbook', 'homework', 'listening', 'vocabulary', 'review', 'progress'] as const;
export type Feature = typeof FEATURES[number];
export const SECTIONS = ['vocab', 'text', 'grammar', 'hanzi', 'practice'] as const;
export type Section = typeof SECTIONS[number];
export const PARTS = ['choice', 'sort', 'translation'] as const;
export type Part = typeof PARTS[number];

export interface Route {
  readonly feature: Feature;
  readonly lesson: number;
  readonly section?: Section;
  readonly part?: Part;
}

export interface ModuleContext {
  readonly audio?: () => Promise<import('../services/audio/index.ts').AudioService>;
  readonly learning?: () => Promise<import('../services/learning/session.ts').LearningSession>;
  readonly route: Route;
  readonly signal: AbortSignal;
  navigate(route: Route): void;
}

export interface MountHandle {
  readonly ready: Promise<void>;
  unmount(): void;
}

export interface FeatureModule {
  mount(host: HTMLElement, context: ModuleContext): MountHandle;
}

export type ModuleState = 'loading' | 'ready' | 'error';
export interface ModuleStatus {
  readonly state: ModuleState;
  readonly route: Route;
  readonly error?: unknown;
}
