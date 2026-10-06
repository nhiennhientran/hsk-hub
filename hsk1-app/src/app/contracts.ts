export const FEATURES = ['home', 'textbook', 'exercises', 'homework', 'listening', 'vocabulary', 'review', 'progress'] as const;
export type Feature = typeof FEATURES[number];
export const SECTIONS = ['vocab', 'text', 'grammar', 'hanzi', 'practice'] as const;
export type Section = typeof SECTIONS[number];
export const PARTS = ['choice', 'sort', 'translation'] as const;
export type LegacyPart = typeof PARTS[number];
export type Part = LegacyPart | 'listening' | 'translationChoice';

export interface Route {
  readonly feature: Feature;
  readonly lesson: number;
  readonly section?: Section;
  readonly scene?:number;
  readonly part?: Part;
  /** Absent is a historical 15-question route. New student links explicitly use 30-v1. */
  readonly homeworkVersion?: '30-v1' | 'legacy';
  readonly exerciseSet?: import('../domain/exercises/catalogue.ts').ExerciseSet;
  readonly exerciseGroup?: import('../domain/exercises/catalogue.ts').ExerciseGroup;
  readonly exerciseFilter?: import('../domain/exercises/catalogue.ts').ExerciseFilter;
}

export interface ModuleContext {
  /** Supplied by the unified course shell; standalone modules retain their existing behavior. */
  readonly lessonAccessible?: (lesson:number)=>boolean;
  readonly audio?: () => Promise<import('../services/audio/index.ts').AudioService>;
  readonly learning?: () => Promise<import('../services/learning/session.ts').LearningSession>;
  readonly route: Route;
  readonly signal: AbortSignal;
  navigate(route: Route): void;
}

export interface MountHandle {
  readonly ready: Promise<void>;
  /** Optional in-place navigation after ready; false requests the normal remount. */
  updateRoute?(route: Route): boolean;
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
