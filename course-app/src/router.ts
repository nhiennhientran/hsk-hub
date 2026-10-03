export type Level = 1 | 2 | 3;
export type View =
  | "portal"
  | "courses"
  | "lesson"
  | "homework"
  | "practice"
  | "progress"
  | "listening"
  | "archive";
export type Section =
  "overview" | "vocab" | "text" | "grammar" | "hanzi" | "practice" | "culture";
export interface Route {
  view: View;
  lesson: number;
  part: string;
  level?: Level;
  section?: Section;
  scene?: number;
  homeworkVersion?: "30-v1" | "legacy";
  exerciseSet?: import("../../hsk1-app/src/app/contracts.ts").Route["exerciseSet"];
  exerciseGroup?: import("../../hsk1-app/src/app/contracts.ts").Route["exerciseGroup"];
  exerciseFilter?: import("../../hsk1-app/src/app/contracts.ts").Route["exerciseFilter"];
}
let defaultLevel: Level = 2;
export function setRouteLevel(level: Level) {
  defaultLevel = level;
}
export function parseRoute(
  hash: string,
  count = 15,
  fallback: Level = defaultLevel,
): Route {
  const p = new URLSearchParams(hash.replace(/^#/, ""));
  const level = [1, 2, 3].includes(Number(p.get("level")))
    ? (Number(p.get("level")) as Level)
    : fallback;
  const limit = p.has("level") ? (level === 3 ? 18 : 15) : count;
  const v = p.get("view"),
    n = Number(p.get("lesson") ?? 1),
    section = p.get("section"),
    scene = Number(p.get("scene"));
  return {
    view: [
      "portal",
      "courses",
      "lesson",
      "homework",
      "practice",
      "progress",
      "listening",
      "archive",
    ].includes(v ?? "")
      ? (v as View)
      : "courses",
    lesson: Number.isInteger(n) && n >= 1 && n <= limit ? n : 1,
    part: p.get("part") ?? "vocabGrammar",
    ...(p.has("level") ? { level } : {}),
    ...([
      "overview",
      "vocab",
      "text",
      "grammar",
      "hanzi",
      "practice",
      "culture",
    ].includes(section ?? "")
      ? { section: section as Section }
      : {}),
    ...(Number.isInteger(scene) && scene >= 1 && scene <= 4 ? { scene } : {}),
    ...(["30-v1", "legacy"].includes(p.get("version") ?? "")
      ? { homeworkVersion: p.get("version") as "30-v1" | "legacy" }
      : {}),
    ...(p.has("set")
      ? { exerciseSet: p.get("set") as Route["exerciseSet"] }
      : {}),
    ...(p.has("group")
      ? { exerciseGroup: p.get("group") as Route["exerciseGroup"] }
      : {}),
    ...(p.has("filter")
      ? { exerciseFilter: p.get("filter") as Route["exerciseFilter"] }
      : {}),
  };
}
export function routeHref(route: Partial<Route>): string {
  return (
    "#" +
    new URLSearchParams({
      view: route.view ?? "courses",
      level: String(route.level ?? defaultLevel),
      lesson: String(route.lesson ?? 1),
      ...(route.part ? { part: route.part } : {}),
      ...(route.section ? { section: route.section } : {}),
      ...(route.scene ? { scene: String(route.scene) } : {}),
      ...(route.homeworkVersion ? { version: route.homeworkVersion } : {}),
      ...(route.exerciseSet ? { set: route.exerciseSet } : {}),
      ...(route.exerciseGroup ? { group: route.exerciseGroup } : {}),
      ...(route.exerciseFilter ? { filter: route.exerciseFilter } : {}),
    }).toString()
  );
}
