import { createLifecycle } from "../../hsk1-app/src/app/lifecycle.ts";
import type {
  Feature,
  FeatureModule,
  Route as HSK1Route,
} from "../../hsk1-app/src/app/contracts.ts";
import { normalizeRoute } from "../../hsk1-app/src/app/router.ts";
import type { LearningSession } from "../../hsk1-app/src/services/learning/session.ts";
import type { AudioService } from "../../hsk1-app/src/services/audio/index.ts";
import type { Route } from "./router.ts";
const loaders: Record<Feature, () => Promise<FeatureModule>> = {
  home: () => import("../../hsk1-app/src/features/home/index.ts"),
  textbook: () => import("../../hsk1-app/src/features/textbook/index.ts"),
  homework: () => import("../../hsk1-app/src/features/homework/index.ts"),
  exercises: () => import("../../hsk1-app/src/features/exercises/archive.ts"),
  listening: () => import("../../hsk1-app/src/features/listening/index.ts"),
  vocabulary: () => import("../../hsk1-app/src/features/vocabulary/index.ts"),
  review: () => import("../../hsk1-app/src/features/review/index.ts"),
  progress: () => import("../../hsk1-app/src/features/progress/index.ts"),
};
const partMap = {
  vocabGrammar: "choice",
  ordering: "sort",
  listening: "listening",
  translationChoice: "translationChoice",
  writing: "translation",
} as const;
export function toHSK1(route: Route): HSK1Route {
  return normalizeRoute({
    feature: (
      {
        courses: "home",
        lesson: "textbook",
        homework: "homework",
        listening: "listening",
        practice: "review",
        progress: "progress",
        archive: "exercises",
        portal: "home",
      } as const
    )[route.view],
    lesson: route.lesson,
    scene:route.scene,
    section: ["vocab", "text", "grammar", "hanzi", "practice"].includes(
      route.section ?? "",
    )
      ? (route.section as HSK1Route["section"])
      : "vocab",
    homeworkVersion: route.homeworkVersion ?? "30-v1",
    exerciseSet: route.exerciseSet,
    exerciseGroup: route.exerciseGroup,
    exerciseFilter: route.exerciseFilter,
    part: partMap[route.part as keyof typeof partMap] ?? "choice",
  });
}
export function fromHSK1(route: HSK1Route): Route {
  return {
    level: 1,
    view: (
      {
        home: "courses",
        textbook: "lesson",
        homework: "homework",
        listening: "listening",
        vocabulary: "practice",
        review: "practice",
        progress: "progress",
        exercises: "archive",
      } as const
    )[route.feature],
    lesson: route.lesson,
    part:
      Object.entries(partMap).find(([, v]) => v === route.part)?.[0] ??
      "vocabGrammar",
    ...(route.section ? { section: route.section } : {}),
    ...(route.scene?{scene:route.scene}:{}),
    ...(route.feature === "homework"
      ? { homeworkVersion: route.homeworkVersion ?? "legacy" }
      : {}),
    ...(route.exerciseSet ? { exerciseSet: route.exerciseSet } : {}),
    ...(route.exerciseGroup ? { exerciseGroup: route.exerciseGroup } : {}),
    ...(route.exerciseFilter ? { exerciseFilter: route.exerciseFilter } : {}),
  };
}
export function createHSK1Bridge(options: {
  audio: AudioService;
  navigate(route: Route): void;
  error(text: string): void;
}) {
  const events = new AbortController();
  let session: Promise<LearningSession> | undefined,
    current: LearningSession | undefined,
    lifecycle: ReturnType<typeof createLifecycle> | undefined,
    host: HTMLElement | undefined;
  const learning = () =>
    (session ??= import("../../hsk1-app/src/services/learning/session.ts")
      .then((m) => m.loadLearningSession(events.signal))
      .then((s) => {
        current = s;
        return s;
      }));
  return {
    collectCurrentDraft(){return current?.prepareExit()??false},
    async store(){return (await learning()).store},
    async render(target: HTMLElement, route: Route) {
      if (!lifecycle) {
        host = document.createElement("section");
        host.id = "module-host";
        host.tabIndex = -1;
        target.append(host);
        lifecycle = createLifecycle({
          host,
          learning,
          audio: () => Promise.resolve(options.audio),
          navigate: (r) => options.navigate(fromHSK1(r)),
          loadModule: (feature) => loaders[feature](),
          onState: (state) => {
            target.dataset.moduleState = state.state;
            if (state.state === "error") {
              options.error(
                "暂时无法打开本部分，请重试 · Tạm thời không mở được mục này, hãy thử lại",
              );
            }
            if (state.state === "ready") {
              target
                .querySelector<HTMLElement>("h1")
                ?.setAttribute("tabindex", "-1");
              target
                .querySelector<HTMLElement>("h1")
                ?.focus({ preventScroll: true });
            }
          },
        });
      }
      // The shell replaces its children before each route render. Reattach the
      // same lifecycle host so same-lesson scene changes can retain their view.
      target.append(host!);
      await lifecycle.show(toHSK1(route));
    },
    async flush() {
      if (!current) return true;
      if (current.prepareExit()) return false;
      const s = current.store.snapshot();
      if (s.hasUnsavedChanges) return (await current.flush()).ok;
      return true;
    },
    async dispose() {
      lifecycle?.dispose();
      lifecycle = undefined;
      events.abort();
      if (current) await current.dispose();
      host?.remove();
    },
  };
}
