import {commitCourseActivity} from './activity-commit.ts';
import {commitCourseAttempt} from './attempt-commit.ts';
import {loadSegments} from "./segments.ts";
import type {BackupProvider} from "./backup-view.ts";
import { mountListening } from "./listening-view.ts";
import { mountLesson } from "./lesson-view.ts";
import "../../hsk1-app/src/app/bilingual.css";
import { createHSK1Bridge, fromHSK1 } from "./hsk1-bridge.ts";
import { parseRoute as parseHSK1Route } from "../../hsk1-app/src/app/router.ts";
import { canonicalWordPool, senseMap } from "./lexicon.ts";
import "../../hsk1-app/src/app/styles.css";
import "./style.css";
import { createSessionAuth } from "../../hsk1-app/src/services/auth/index.ts";
import { createBrowserAudioService } from "../../hsk1-app/src/services/audio/index.ts";
import { configs } from "./config.ts";
import {
  availableLessons,
  loadLesson,
  trackFor,
  lexiconFor,
  lessonSummaries,
  loadLexicon,
  prepareViCourse,
  hasActiveViDisplay,
} from "./content.ts";
import {
  createLearningStore,
  parts,
  grade,
  resolveDraftQuestions,
  captureDraftAnswer,
  acknowledgeDraftQuestions,
  type Attempt,
} from "./state.ts";
import {
  parseRoute,
  routeHref,
  setRouteLevel,
  type Route,
  type Level,
} from "./router.ts";
import { el, button, link, download, copy } from "./dom.ts";
import type { Lesson, Question, Answer, Part, Word, Copy } from "./types.ts";
const entryLevel = document.querySelector<HTMLMetaElement>(
  'meta[name="hsk-level"]',
)?.content;
const requestedLevel = Number(
  new URLSearchParams(location.hash.slice(1)).get("level") ??
    new URLSearchParams(location.search).get("level") ??
    entryLevel,
);
let level: Level = [1, 2, 3].includes(requestedLevel)
  ? (requestedLevel as Level)
  : 2;
setRouteLevel(level);
const assetBase =
  document.querySelector<HTMLMetaElement>("meta[name=asset-base]")?.content ??
  "./";
let config = configs[level === 3 ? 3 : 2];
const root = document.querySelector<HTMLElement>("#app")!;
let local: Storage, session: Storage;
try {
  local = window.localStorage;
} catch {
  local = {
    getItem() {
      throw Error();
    },
    setItem() {
      throw Error();
    },
  } as unknown as Storage;
}
try {
  session = window.sessionStorage;
} catch {
  session = {
    getItem() {
      return null;
    },
    setItem() {
      throw Error();
    },
    removeItem() {},
  } as unknown as Storage;
}
const stores = new Map<number, ReturnType<typeof createLearningStore>>();
function levelStore(n: 2 | 3) {
  let existing = stores.get(n);
  if (existing) return existing;
  const c = configs[n];
  existing = createLearningStore(
    c,
    local,
    navigator.locks
      ? <R>(task: () => R | Promise<R>) =>
          navigator.locks.request(c.storageKey + "-write", task)
      : undefined,
  );
  stores.set(n, existing);
  return existing;
}
let store = levelStore(level === 3 ? 3 : 2);
const audio = createBrowserAudioService();
let available = availableLessons(config);
let loaded: Lesson[] = [];
const legacyHSK1Entry=level===1&&(/\/(?:lesson|learning|lesson9-pilot)\.html$/.test(location.pathname)||new URLSearchParams(location.search).has('mode'));
let route = location.hash.startsWith("#/")||legacyHSK1Entry
    ? fromHSK1(parseHSK1Route(location.href))
    : parseRoute(location.hash||`#view=${document.querySelector<HTMLMetaElement>('meta[name="hsk-entry-view"]')?.content??'courses'}`, level === 3 ? 18 : 15, level),
  generation = 0,
  cleanup: () => void = () => {},
  draftTimer: ReturnType<typeof setTimeout> | undefined,
  composing = false;
const labels = {
  courses: copy("课程", "Bài học"),
  homework: copy("课后作业", "Bài tập về nhà"),
  practice: copy("练习与复习", "Luyện tập & ôn tập"),
  progress: copy("学习进度", "Tiến độ học tập"),
};
const partNames: Record<Part, Copy> = {
  vocabGrammar: copy("词汇与语法 · 10题", "Từ vựng & ngữ pháp · 10 câu"),
  ordering: copy("排列句子 · 5题", "Sắp xếp câu · 5 câu"),
  listening: copy("听力选择 · 5题", "Nghe chọn đáp án · 5 câu"),
  translationChoice: copy(
    "越译中选择 · 5题",
    "Chọn bản dịch Việt–Trung · 5 câu",
  ),
  writing: copy("越译中手写 · 5题", "Viết bản dịch Việt–Trung · 5 câu"),
};
const header = el("header", undefined, "site-header");
header.append(
  link(
    copy("汉语课件", `然老师 · Cô Nhiên · HSK ${level}`),
    routeHref({ view: "portal" }),
    "brand",
  ),
  el("span", copy("2026 · 第一版", "Ấn bản đầu 2026"), "course-badge"),
);
const nav = el("nav", undefined, "feature-nav");
nav.setAttribute("aria-label", "导航 · Điều hướng");
for (const view of ["courses", "homework", "practice", "progress"] as const) {
  const a = link(labels[view], routeHref({ view }));
  a.dataset.view = view;
  nav.append(a);
}
const status = el("p", undefined, "save-status");
status.setAttribute("role", "status");
status.setAttribute("aria-live", "polite");
const main = el("main");
main.id = "content";
main.tabIndex = -1;
const footer = el("footer");
footer.append(
  el("span", copy("中越双语 · 原版音频", "Song ngữ Trung–Việt · Âm thanh gốc")),
  link(copy("返回课程中心", "Về trung tâm khóa học"), "../../index.html"),
  link(copy("旧版课程与旧记录", "Khóa học & dữ liệu bản cũ"), config.legacyURL),
);
root.append(
  link(copy("跳至内容", "Chuyển đến nội dung"), "#content", "skip-link"),
  header,
  nav,
  status,
  main,
  footer,
);
const globalMessage = el("p", undefined, "global-message");
globalMessage.hidden = true;
globalMessage.setAttribute("role", "alert");
main.before(globalMessage);
const stateLabel = {
  empty: copy("尚无学习记录", "Chưa có dữ liệu học tập"),
  saved: copy("已保存在此浏览器", "Đã lưu trong trình duyệt này"),
  unsaved: copy(
    "尚未保存，请勿关闭页面",
    "Chưa lưu, vui lòng không đóng trang",
  ),
  saving: copy("正在保存", "Đang lưu"),
  conflict: copy(
    "其他标签页有变更，请先备份",
    "Tab khác đã thay đổi, hãy sao lưu trước",
  ),
  corrupt: copy(
    "旧数据无法读取，已阻止覆盖",
    "Không đọc được dữ liệu, đã chặn ghi đè",
  ),
  unavailable: copy(
    "存储不可用，请下载备份",
    "Không thể lưu, hãy tải bản sao lưu",
  ),
};
function syncStatus() {
  if (level === 1) {
    status.hidden = true;
    return;
  }
  status.hidden = false;
  const s = store.snapshot();
  status.replaceChildren(el("span",s.status==="unsaved"&&!s.issue?copy("正在自动保存…","Đang tự động lưu…"):stateLabel[s.status]));
  status.dataset.status = s.status;
  status.dataset.problem=String(!!s.issue||["conflict","corrupt","unavailable"].includes(s.status));
  if (s.issue) status.append(el("span", s.issue));
  if (
    !!s.issue ||
    ["conflict", "corrupt", "unavailable"].includes(s.status)
  )
    status.append(
      button(
        copy("下载当前草稿备份", "Tải bản sao lưu bản nháp hiện tại"),
        exportFullBackup,
      ),
      button(copy("重试保存", "Thử lưu lại"), async () => {
        await flush();
      }),
    );
  if (s.status === "corrupt")
    status.append(
      button(
        copy("下载无法读取的原始数据", "Tải dữ liệu gốc chưa đọc được"),
        () => {
          const raw = store.exportOriginal();
          if (raw) download(config.id + "-raw.json", raw);
        },
      ),
    );
}
let unsubscribeStatus = store.subscribe(syncStatus);
syncStatus();
function message(text: string | Copy) {
  globalMessage.hidden = false;
  globalMessage.replaceChildren(el("span", text));
}
function scheduleSave() {
  clearTimeout(draftTimer);
  if (!composing)
    draftTimer = setTimeout(() => {
      void flush();
    }, 350);
}
async function flush(): Promise<boolean> {
  if (level === 1) return flushHSK1();
  clearTimeout(draftTimer);
  if (composing) return false;
  const s = store.snapshot();
  if (!s.hasUnsavedChanges) return true;
  const result = await store.save();
  if (!result.ok)
    message(
      copy(
        "未确认保存。请重试或先下载备份；你的输入仍在本页。",
        "Chưa xác nhận lưu. Hãy thử lại hoặc tải bản sao lưu; nội dung nhập vẫn còn trong trang.",
      ),
    );
  else globalMessage.hidden = true;
  return result.ok;
}
function edit(mutator: Parameters<typeof store.edit>[0]) {
  store.edit(mutator);
  scheduleSave();
}
window.addEventListener("storage", (e) => {
  if (e.key === config.storageKey) store.observeExternalChange();
});
window.addEventListener("beforeunload", (e) => {
  if (store.snapshot().hasUnsavedChanges || composing) {
    e.preventDefault();
    e.returnValue = "";
  }
});
root.addEventListener("click", async (e) => {
  if ((e.target as Element).closest(".skip-link")) {
    e.preventDefault();
    main.focus();
    return;
  }
  const a = (e.target as Element).closest<HTMLAnchorElement>(
    'a[href^="#view="],a[href^="#/"]',
  );
  if (!a || e.defaultPrevented) return;
  e.preventDefault();
  if (!(await flush())) return;
  location.hash = a.hash.startsWith("#/")
    ? routeHref(fromHSK1(parseHSK1Route(a.href)))
    : a.hash;
});
window.addEventListener("hashchange", () => {
  const next = location.hash.startsWith("#/")
    ? fromHSK1(parseHSK1Route(location.href))
    : parseRoute(location.hash, level === 3 ? 18 : 15, level);
  void navigate(next);
});
let navigationGeneration = 0;
async function navigate(next: Route) {
  const request = ++navigationGeneration;
  if (!(await flush())) {
    history.replaceState(null, "", routeHref(route));
    return;
  }
  if (request !== navigationGeneration) return;
  const nextLevel = next.level ?? level;
  if (nextLevel !== level) {
    await disposeHSK1();
    if (request !== navigationGeneration) return;
    unsubscribeStatus();
    audio.stop();
    level = nextLevel;
    setRouteLevel(level);
    config = configs[level === 3 ? 3 : 2];
    store = levelStore(level === 3 ? 3 : 2);
    store.observeExternalChange();
    available = availableLessons(config);
    loaded = [];
    unsubscribeStatus = store.subscribe(syncStatus);
    syncStatus();
  }
  route = { ...next, level };
  await render();
}
function lessonTitle(lesson: Lesson) {
  return copy(
    `第${lesson.number}课 · ${lesson.title.zh}`,
    `Bài ${lesson.number} · ${lesson.title.vi}`,
  );
}
function heading(title: Copy) {
  main.append(el("h1", title));
  document.title = `${title.zh} · HSK ${level} · Cô Nhiên`;
}
function lessonNav() {
  const row = el("div", undefined, "lesson-tools"),
    label = el("label", copy("选择课程", "Chọn bài học")),
    select = el("select");
  select.id = "lesson-select";
  label.htmlFor = select.id;
  for (const n of available) {
    const option = el("option", `第${n}课 · Bài ${n}`);
    option.value = String(n);
    select.append(option);
  }
  select.value = String(route.lesson);
  select.onchange = async () => {
    if (await flush())
      location.hash = routeHref({ ...route, lesson: Number(select.value) });
    else select.value = String(route.lesson);
  };
  row.append(
    label,
    select,
    link(copy("返回课程", "Về các bài học"), routeHref({ view: "courses" })),
  );
  main.append(row);
}
function audioControl(trackId: string, title?: Copy) {
  const track = trackFor(config, trackId),
    wrap = el("div", undefined, "audio-control"),
    play = button(
      title ?? copy(`播放原音 ${trackId}`, `Phát âm thanh gốc ${trackId}`),
      async () => {
        const result = await audio.play({
          url: new URL(assetBase + track.file, location.href).href,
          label: `HSK${level} · ${trackId}`,
          sourceKind: "original",
        });
        if (!result.ok && result.code !== "cancelled")
          message(
            copy("播放失败，请重试", "Phát âm thanh thất bại, hãy thử lại"),
          );
      },
    );
  wrap.append(
    play,
    el(
      "small",
      copy(
        track.kind === "vocab" ? "整组生词原音" : "完整课文原音",
        track.kind === "vocab"
          ? "Âm thanh gốc cả nhóm từ"
          : "Âm thanh gốc toàn bài khóa",
      ),
    ),
  );
  return wrap;
}
function player() {
  const row = el("section", undefined, "player-bar"),
    time = el("span"),
    toggle = button(copy("暂停", "Tạm dừng"), async () => {
      const s = audio.snapshot();
      if (s.status === "playing") audio.pause();
      else await audio.resume();
    }),
    replay = button(copy("重播", "Phát lại"), async () => {
      await audio.replay();
    }),
    stop = button(copy("停止", "Dừng"), () => audio.stop()),
    rate = el("select"),
    seek = el("input");
  row.setAttribute("aria-label", "原音播放器 · Trình phát âm thanh");
  seek.type = "range";
  seek.min = "0";
  seek.step = "0.1";
  seek.setAttribute("aria-label", "播放位置 · Vị trí phát");
  seek.oninput = () => audio.seek(Number(seek.value));
  rate.setAttribute("aria-label", "播放速度 · Tốc độ phát");
  for (const n of [0.65, 0.75, 1, 1.25, 1.5]) {
    const o = el("option", n + "×");
    o.value = String(n);
    rate.append(o);
  }
  rate.onchange = () => audio.setRate(Number(rate.value));
  row.append(time, seek, toggle, replay, stop, rate);
  main.append(row);
  const stamp = (n: number) =>
    Math.floor(n / 60) + ":" + String(Math.floor(n % 60)).padStart(2, "0");
  const sync = () => {
    const s = audio.snapshot(),
      start = s.request?.start ?? 0,
      end = s.request?.end ?? s.duration;
    row.hidden = s.status === "idle";
    row.dataset.state = s.status;
    time.textContent = `${s.label} · ${stamp(Math.max(0, s.currentTime - start))} / ${end ? stamp(end - start) : "—"}`;
    if (s.issue) time.textContent += " · " + s.issue;
    toggle.replaceChildren(
      el(
        "span",
        s.status === "playing"
          ? copy("暂停", "Tạm dừng")
          : copy("继续", "Tiếp tục"),
      ),
    );
    toggle.disabled = !["playing", "paused", "ended"].includes(s.status);
    seek.min = String(start);
    seek.max = String(end || 1);
    seek.value = String(s.currentTime);
    seek.disabled = !end || s.sourceKind === "tts";
    rate.value = String(s.rate);
    replay.disabled = ["idle", "loading"].includes(s.status);
  };
  const unsub = audio.subscribe(sync);
  sync();
  return unsub;
}
async function render() {
  const token = ++generation;
  cleanup();
  cleanup = () => {};
  audio.stop();
  main.replaceChildren();
  globalMessage.hidden = true;
  for (const a of nav.querySelectorAll("a")) {
    const active =
      route.view === "lesson" || route.view === "listening"
        ? "courses"
        : route.view;
    a.setAttribute(
      "aria-current",
      a.dataset.view === active ? "page" : "false",
    );
    a.href = routeHref({
      view: a.dataset.view as Route["view"],
      lesson: route.lesson,
    });
  }
  try {
    updateShell();
    if (route.view === "portal") {
      await disposeHSK1();
      renderPortal();
      return;
    }
    if (level === 1) {
      await renderHSK1();
      return;
    }
    const requestedConfig=config,requestedRoute=route;
    await prepareViCourse(requestedConfig);
    if(token!==generation||config!==requestedConfig)return;
    const wanted =
      route.view === "courses" || route.view === "progress"
        ? []
        : ["practice", "listening"].includes(route.view)
          ? available
          : [route.lesson];
    const lessons = await Promise.all(
      wanted
        .filter((n) => !loaded.some((l) => l.number === n))
        .map((n) => loadLesson(config, n)),
    );
    if(token!==generation||config!==requestedConfig)return;
    await loadSegments();
    if(token!==generation||config!==requestedConfig)return;
    loaded.push(...lessons.filter(l=>l.courseId===requestedConfig.id&&!loaded.some(old=>old.id===l.id)));
    if (requestedRoute.view === "practice") await loadLexicon(requestedConfig);
    if (token !== generation) return;
    if (route.view === "courses") renderCourses();
    else if (route.view === "practice") renderPractice();
    else if (route.view === "progress") renderProgress();
    else if (route.view === "listening")
      cleanup = mountListening(main, loaded, {
        requireLegacyReview: hasActiveViDisplay(config),
        state: () => store.snapshot().data,
        edit,
        flush,
        commit: async (id, attempt, round, signal) => {
          clearTimeout(draftTimer);
          return commitCourseAttempt(store, id + ':individual', attempt, 'listening', signal, () => composing, round);
        },
        stop: () => audio.stop(),
        message,
        play: async (q) => {
          if (!q.audioTrack) return false;
          const track = trackFor(config, q.audioTrack);
          const r = await audio.play({
            url: new URL(assetBase + track.file, location.href).href,
            label: `HSK ${level} · ${q.audioTrack}`,
            sourceKind: "original",
          });
          if (!r.ok && r.code !== "cancelled")
            message(
              copy(
                "音频暂时无法播放，请重试",
                "Tạm thời không phát được âm thanh, hãy thử lại",
              ),
            );
          return r.ok;
        },
      });
    else {
      const lesson = loaded.find((l) => l.number === route.lesson);
      if (!lesson) throw Error("本课尚未完成 · Bài học chưa hoàn thành");
      lessonNav();
      if (route.view === "lesson") renderLesson(lesson);
      else renderHomework(lesson);
    }
    if (token !== generation) return;
    const previousCleanup = cleanup,
      unsub = player();
    cleanup = () => {
      previousCleanup();
      unsub();
    };
    main.querySelector("h1")?.setAttribute("tabindex", "-1");
    main.querySelector<HTMLElement>("h1")?.focus({ preventScroll: true });
  } catch (error) {
    if (token !== generation) return;
    heading(copy("暂时无法打开", "Tạm thời không mở được"));
    main.append(
      el("p", error instanceof Error ? error.message : String(error)),
      button(copy("重试", "Thử lại"), render),
    );
  }
}
function renderCourses() {
  heading(
    copy(`新HSK ${level} · 自由选课`, `HSK ${level} mới · Chọn bài tự do`),
  );
  const hero = el("section", undefined, "course-hero");
  hero.append(
    el(
      "h2",
      copy(
        "今天，学会用汉语表达",
        "Hôm nay, học cách diễn đạt bằng tiếng Trung",
      ),
    ),
    el(
      "p",
      copy(
        `${config.count}课 · 每课4篇课文 · 每课30道作业`,
        `${config.count} bài · 4 bài khóa/bài · 30 câu bài tập/bài`,
      ),
    ),
    el(
      "p",
      copy(
        "2026年第一版 · 中越双语讲解与原版音频",
        "Ấn bản đầu năm 2026 · Giải thích Trung–Việt và âm thanh gốc",
      ),
    ),
  );
  main.append(hero);
  const searchLabel=el("label",copy("查找课程","Tìm bài học")),search=el("input");search.type="search";search.id="lesson-search";search.placeholder="课次 / 标题 / tiêu đề";searchLabel.htmlFor=search.id;main.append(searchLabel,search);
  const grid = el("div", undefined, "course-grid"),
    done = store.snapshot().data.completed;
  for (const lesson of lessonSummaries(config)) {
    const card = el("article", undefined, "lesson-card");
    card.dataset.searchText=`${lesson.number} ${lesson.title.zh} ${lesson.title.vi} ${lesson.title.py}`;
    const reading=store.snapshot().data.reading[lesson.id];
    card.append(
      el("small", `HSK ${level} · ${String(lesson.number).padStart(2, "0")}`),
      el("h2", lesson.title),
      el("p", lesson.title.py),
      el(
        "p",
        copy(
          `${lesson.vocabularyCount}张词义卡 · ${lesson.grammarCount}个语法点`,
          `${lesson.vocabularyCount} thẻ từ theo nghĩa · ${lesson.grammarCount} điểm ngữ pháp`,
        ),
      ),
      link(
        copy(
          done.includes(lesson.id) ? "继续学习" : "开始学习",
          done.includes(lesson.id) ? "Học tiếp" : "Bắt đầu học",
        ),
        routeHref({ view: "lesson", lesson: lesson.number,section:reading?.lastSection as Route["section"]??"overview",scene:reading?.scene }),
        "lesson-open",
      ),
    );
    card.append(el("p",copy(`教材分部 ${reading?.completed.length??0}/7 已学 · ${reading?.visited.length??0}/7 已访问`,`Mục SGK: ${reading?.completed.length??0}/7 đã học · ${reading?.visited.length??0}/7 đã xem`)));
    const actions=el('nav',undefined,'lesson-actions');for(const [section,title]of [['vocab',copy('词汇','Từ vựng')],['text',copy('课文','Bài khóa')],['grammar',copy('语言点','Ngữ pháp')]] as const)actions.append(link(title,routeHref({view:'lesson',lesson:lesson.number,section})));actions.append(link(copy('听力','Luyện nghe'),routeHref({view:'listening',lesson:lesson.number})));card.append(actions);
    grid.append(card);
  }
  const normalize=(text:string)=>text.normalize('NFD').replace(/\p{M}/gu,'').replace(/đ/gi,'d').toLowerCase();search.oninput=()=>{for(const card of grid.querySelectorAll<HTMLElement>('.lesson-card'))card.hidden=!normalize(card.dataset.searchText??'').includes(normalize(search.value.trim()))};
  main.append(grid);
  if (lessonSummaries(config).length !== config.count)
    main.append(
      el(
        "p",
        copy(
          `内部试点：当前${loaded.length}/${config.count}课可用`,
          `Bản thử nghiệm nội bộ: hiện có ${loaded.length}/${config.count} bài`,
        ),
        "pilot-warning",
      ),
    );
}
function renderLesson(l: Lesson) {
  cleanup = mountLesson(main, l, {
    route,
    level: level === 3 ? 3 : 2,
    assetBase,
    state: () => store.snapshot().data,
    edit,
    flush,
    commitActivity:async(id,values,checkedAt,signal)=>{
      clearTimeout(draftTimer);
      const saved=await commitCourseActivity(store,id,values,checkedAt,signal,()=>composing);
      if(!saved&&!signal.aborted)message(copy("提交未确认；请完成输入后重新提交。草稿仍保留。","Chưa xác nhận nộp; hãy hoàn tất nhập rồi nộp lại. Bản nháp vẫn được giữ."));
      return saved;
    },
    audio,
    audioControl,
    message,
  });
  document.title = `${l.title.zh} · HSK ${level} · Cô Nhiên`;
}
function answerText(q: Question, a: Answer | undefined): string {
  if (typeof a === "string") return a;
  if (typeof a === "number") return q.options?.[a] ?? "—";
  if (Array.isArray(a)) return a.map((n) => q.tokens?.[n] ?? "").join(" ");
  return "—";
}
function renderHomework(l: Lesson, independent = false) {
  const assignmentStore = store;
  let pendingSubmission: AbortController | null = null;
  cleanup = () => { pendingSubmission?.abort(); };
  heading(
    independent
      ? copy("独立听力练习", "Luyện nghe độc lập")
      : copy("课后作业 · 30题", "Bài tập về nhà · 30 câu"),
  );
  main.append(el("p", lessonTitle(l)));
  let part: Part = parts.includes(route.part as Part)
    ? (route.part as Part)
    : "vocabGrammar";
  if (independent) part = "listening";
  const key = l.id + ":" + (independent ? "independent-listening" : part),
    currentQuestions = independent
      ? l.listening
      : l.homework.filter((q) => q.part === part),
    kind = independent ? "listening" : "homework";
  if (!independent) {
    const tabs = el("nav", undefined, "subnav");
    tabs.setAttribute("aria-label", "作业部分 · Phần bài tập");
    for (const p of parts) {
      const a = link(partNames[p], routeHref({ ...route, part: p }));
      if (p === part) a.setAttribute("aria-current", "page");
      tabs.append(a);
    }
    main.append(
      tabs,
      el(
        "p",
        copy(
          "25题自动批改；5题手写由老师查看，不计入自动分数。",
          "25 câu chấm tự động; 5 câu viết do giáo viên xem, không tính vào điểm tự động.",
        ),
      ),
    );
  }
  const state = store.snapshot().data,
    draftView = resolveDraftQuestions(currentQuestions, state.drafts[key], hasActiveViDisplay(config)),
    questions = draftView.questions,
    draftBlocked = draftView.status === "missing" || draftView.status === "incompatible",
    answers: Record<string, Answer> = structuredClone(
      state.drafts[key]?.answers ?? {},
    );
  if (draftView.status === "missing") {
    const note = el("section");
    note.setAttribute("role", "status");
    note.append(
      el("p", copy(
        "旧草稿没有当时的题目快照，答案已保留。当前显示本版题目，请核对后选择继续。",
        "Bản nháp cũ không có ảnh chụp câu hỏi lúc đó; câu trả lời vẫn được giữ. Các câu hỏi hiện tại được hiển thị bên dưới; hãy kiểm tra rồi chọn tiếp tục.",
      )),
      button(copy("按当前题目继续草稿", "Tiếp tục bản nháp với câu hỏi hiện tại"), async () => {
        try {
          const acknowledged = acknowledgeDraftQuestions(state.drafts[key]!, currentQuestions, Date.now());
          edit(s => { s.drafts[key] = acknowledged; });
          if (await flush()) await render();
        } catch (error) {
          message(error instanceof Error ? error.message : String(error));
        }
      }),
    );
    main.append(note);
  } else if (draftView.status === "incompatible") {
    main.append(el("p", copy(
      "草稿保存的题目已与本版不同，保留原题和答案供查看，不重新评分。请先下载备份，再用“重新作答（保留记录）”开始本版作业。",
      "Câu hỏi đã lưu trong bản nháp khác với bản hiện tại. Câu hỏi và câu trả lời cũ được giữ để xem, không chấm lại. Hãy tải bản sao lưu, rồi chọn “Làm lại (giữ lịch sử)” để bắt đầu bài tập hiện tại.",
    )));
  }
  const form = el("form");
  form.addEventListener('compositionstart', () => pendingSubmission?.abort());
  form.id = "assignment";
  form.dataset.draftQuestionSnapshot = draftView.status;
  const record = state[kind][key];
  const info = el("p");
  info.setAttribute("role", "status");
  form.append(info);
  const saveAnswer = (id: string, value: Answer) => {
    if (draftBlocked) return;
    answers[id] = value;
    edit((s) => {
      s.drafts[key] = captureDraftAnswer(s.drafts[key], currentQuestions, id, value, Date.now(), hasActiveViDisplay(config));
    });
    form.dataset.draftQuestionSnapshot = "saved";
  };
  for (const [index, q] of questions.entries()) {
    const field = el("fieldset", undefined, "question");
    field.dataset.questionId = q.id;
    field.disabled = draftBlocked;
    const legend = el(
      "legend",
      copy(`${index + 1}. ${q.prompt.zh}`, `${index + 1}. ${q.prompt.vi}`),
    );
    field.append(legend);
    if (q.stem) field.append(el("p", q.stem, "question-stem"));
    if (q.audioTrack) field.append(audioControl(q.audioTrack));
    if (q.part === "writing") {
      const input = el("textarea");
      input.rows = 3;
      input.name = q.id;
      input.value =
        typeof answers[q.id] === "string" ? (answers[q.id] as string) : "";
      input.setAttribute("aria-label", q.prompt.vi);
      input.autocomplete = "off";
      input.addEventListener("compositionstart", () => {
        composing = true;
        clearTimeout(draftTimer);
      });
      input.addEventListener("compositionend", () => {
        composing = false;
        saveAnswer(q.id, input.value);
      });
      input.addEventListener("input", () => saveAnswer(q.id, input.value));
      field.append(input);
    } else if (q.part === "ordering") {
      let order = Array.isArray(answers[q.id])
        ? [...(answers[q.id] as number[])]
        : [];
      const result = el("div", undefined, "ordering-result"),
        tokens = el("div", undefined, "ordering-tokens");
      result.setAttribute("aria-live", "polite");
      const draw = () => {
        result.replaceChildren();
        tokens.replaceChildren();
        order.forEach((n, i) =>
          result.append(
            button(q.tokens![n]!, () => {
              order.splice(i, 1);
              saveAnswer(q.id, order);
              draw();
            }),
          ),
        );
        q.tokens!.forEach((token, n) => {
          const b = button(token, () => {
            order.push(n);
            saveAnswer(q.id, order);
            draw();
          });
          b.disabled = order.includes(n);
          tokens.append(b);
        });
      };
      field.append(
        el(
          "p",
          copy(
            "依次点击词语；点击已选词语可撤回。",
            "Nhấn từ theo thứ tự; nhấn từ đã chọn để bỏ.",
          ),
        ),
        result,
        tokens,
        button(copy("重新排列", "Xếp lại"), () => {
          order = [];
          saveAnswer(q.id, order);
          draw();
        }),
      );
      draw();
    } else {
      for (const [n, opt] of q.options!.entries()) {
        const label = el("label", undefined, "choice-option"),
          input = el("input");
        input.type = "radio";
        input.name = q.id;
        input.value = String(n);
        input.checked = answers[q.id] === n;
        input.onchange = () => saveAnswer(q.id, n);
        label.append(input, el("span", opt));
        field.append(label);
      }
    }
    form.append(field);
  }
  const submit = el(
    "button",
    copy(
      part === "writing" ? "提交手写答案" : "提交并查看结果",
      part === "writing" ? "Nộp bài viết" : "Nộp và xem kết quả",
    ),
    "primary",
  );
  submit.type = "submit";
  submit.disabled = draftBlocked;
  form.append(submit);
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (composing || submit.disabled) return;
    try {
      const attempt = grade(
        questions,
        answers,
        Date.now(),
        assignmentStore.snapshot().data.profile,
      );
      clearTimeout(draftTimer);
      pendingSubmission = new AbortController();
      const request = pendingSubmission;
      submit.disabled = true;
      redo.disabled = true;
      for (const field of form.querySelectorAll("fieldset"))
        field.disabled = true;
      const saved = await commitCourseAttempt(assignmentStore, key, attempt, kind, request.signal, () => composing);
      if (pendingSubmission === request) pendingSubmission = null;
      if (!form.isConnected) return;
      if (!saved) {
        submit.disabled = false;
        redo.disabled = false;
        for (const field of form.querySelectorAll('fieldset')) field.disabled = false;
        info.replaceChildren(el('span', copy('提交未确认；草稿仍保留，请重试。', 'Chưa xác nhận nộp; bản nháp vẫn được giữ, hãy thử lại.')));
        return;
      }
      redo.disabled = false;
      info.replaceChildren(
        el(
          "span",
          part === "writing"
            ? copy(
                "已记录手写答案，等待老师查看",
                "Đã ghi lại bài viết, chờ giáo viên xem",
              )
            : copy(
                `本次 ${attempt.correct}/${attempt.total}`,
                `Lần này ${attempt.correct}/${attempt.total}`,
              ),
        ),
        el(
          "span",
          copy("已保存", "Đã lưu"),
        ),
      );
      renderReceipt(l, questions, assignmentStore.snapshot().data[kind][key]!);
      if (part !== "writing")
        for (const field of form.querySelectorAll("fieldset")) {
          const q = questions.find(
            (x) => x.id === (field as HTMLElement).dataset.questionId,
          )!;
          field.append(
            el(
              "p",
              copy(
                `答案：${answerText(q, q.answer)}`,
                `Đáp án: ${answerText(q, q.answer)}`,
              ),
              "answer-feedback",
            ),
          );
          if (q.explanation) field.append(el("p", q.explanation));
        }
    } catch (error) {
      pendingSubmission?.abort();
      pendingSubmission = null;
      if (!form.isConnected) return;
      submit.disabled = false;
      redo.disabled = false;
      for (const field of form.querySelectorAll('fieldset')) field.disabled = false;
      info.textContent = error instanceof Error ? error.message : String(error);
    }
  });
  main.append(form);
  if (record?.first || record?.latest) renderReceipt(l, questions, record);
  const redo = button(
    copy("重新作答（保留记录）", "Làm lại (giữ lịch sử)"),
    async () => {
      if (redo.disabled || composing) return;
      redo.disabled = true;
      const controls = [
          ...form.querySelectorAll<HTMLFieldSetElement | HTMLButtonElement>(
            "fieldset,button[type=submit]",
          ),
        ],
        wasDisabled = controls.map((c) => c.disabled);
      controls.forEach((c) => {
        c.disabled = true;
      });
      // Retire the old form before awaiting storage. A quick new answer must never
      // land in a form that an old save callback will replace afterwards.
      if (!(await flush())) {
        controls.forEach((c, i) => {
          c.disabled = wasDisabled[i]!;
        });
        redo.disabled = false;
        return;
      }
      if (!form.isConnected) return;
      edit((s) => {
        s.drafts[key] = { answers: {}, updatedAt: Date.now() };
      });
      await render(); // Publish the new blank form before its asynchronous save.
      await flush(); // Never rerender after the user can type into the new form.
    },
  );
  main.append(
    button(copy("保存草稿", "Lưu bản nháp"), async () => {
      await flush();
    }),
    redo,
  );
}
function renderReceipt(
  l: Lesson,
  _questions: Question[],
  record: { first: Attempt | null; latest: Attempt | null },
) {
  main.querySelector("#receipt")?.remove();
  const root = el("section", undefined, "receipt");
  root.id = "receipt";
  root.dataset.latestId = record.latest?.id ?? "";
  root.dataset.firstId = record.first?.id ?? "";
  const select = el("select");
  select.setAttribute("aria-label", "选择记录 · Chọn lần nộp");
  for (const [value, title] of [
    ["first", copy("首次记录", "Lần đầu")],
    ["latest", copy("最近记录", "Lần gần nhất")],
  ] as const) {
    const o = el("option", `${title.zh} · ${title.vi}`);
    o.value = value;
    o.disabled = !record[value];
    select.append(o);
  }
  select.value = "latest";
  const content = el("div");
  root.append(
    el("h2", copy("提交记录", "Bản ghi bài nộp")),
    select,
    button(copy("打印本次记录", "In bản ghi này"), () => window.print()),
    content,
  );
  const draw = () => {
    const a = record[select.value as "first" | "latest"];
    content.replaceChildren();
    if (!a) return;
    content.append(
      el("h3", lessonTitle(l)),
      el("p",copy("课程标题按当前内容显示；题目仅使用本次记录保存的快照。","Tiêu đề bài theo nội dung hiện tại; câu hỏi chỉ lấy từ ảnh chụp đã lưu của lần nộp này.")),
      el("p", `${a.profile.name} · ${a.profile.className}`),
      el("p", `HSK ${level} · 2026.1 · ${new Date(a.at).toLocaleString()}`),
      el(
        "p",
        a.assessment === "manual"
          ? copy(
              "手写答案 · 等待老师查看 · 不自动评分",
              "Bài viết · Chờ giáo viên xem · Không chấm tự động",
            )
          : copy(
              `${a.correct}/${a.total} · 自动批改`,
              `${a.correct}/${a.total} · Chấm tự động`,
            ),
      ),
    );
    const ol = el("ol");
    for (const id of a.questionIds) {
      const q = a.questions?.find((q) => q.id === id);
      if (q) {
        const item = el("li");
        item.append(
          el("p", q.prompt),
          el("p", answerText(q, a.answers[q.id]), "submitted-answer"),
        );
        if(a.assessment==='automatic'){item.append(el('p',copy(`正确答案：${answerText(q,q.answer)}`,`Đáp án: ${answerText(q,q.answer)}`)));if(q.explanation)item.append(el('p',q.explanation))}
        ol.append(item);
      } else {
        const item = el("li");
        item.append(
          el(
            "p",
            copy(
              "旧记录没有当时题目快照，保留原始作答值",
              "Bản ghi cũ không có ảnh chụp câu hỏi; giữ giá trị trả lời gốc",
            ),
          ),
          el(
            "p",
            `${id}: ${JSON.stringify(a.answers[id])}`,
            "submitted-answer",
          ),
        );
        ol.append(item);
      }
    }
    content.append(ol);
  };
  select.onchange = draw;
  draw();
  main.append(root);
}
function renderPractice() {
  heading(copy("混课词卡", "Thẻ từ trộn nhiều bài"));
  main.append(
    el(
      "p",
      copy(
        "翻面看拼音和越南语；自由翻页，无需评分。",
        "Lật để xem pinyin và nghĩa Việt; chuyển tự do, không chấm điểm.",
      ),
    ),
  );
  const data = store.snapshot().data,
    selection = new Set(data.mixed?.selected ?? available),
    controls = el("details", undefined, "lesson-selection");
  controls.append(
    el("summary", copy(`已选${selection.size}课 · 调整范围`, `Đã chọn ${selection.size} bài · Đổi phạm vi`)),
  );
  const choices = el("div", undefined, "lesson-choices");
  for (const n of available) {
    const label = el("label"),
      input = el("input");
    input.type = "checkbox";
    input.value = String(n);
    input.checked = selection.has(n);
    input.onchange = () =>
      input.checked ? selection.add(n) : selection.delete(n);
    label.append(input, el("span", `第${n}课 · Bài ${n}`));
    choices.append(label);
  }
  const selectAll = button(copy("全选", "Chọn tất cả"), () => {
    selection.clear();
    available.forEach((n) => selection.add(n));
    choices.querySelectorAll("input").forEach((i) => (i.checked = true));
  });
  controls.append(selectAll, choices);
  main.append(controls);
  const allWords = new Map<string, Word>();
  for (const l of loaded) for (const w of l.vocabulary) allWords.set(w.id, w);
  const lexicon = lexiconFor(config),
    senses = senseMap(lexicon);
  function pool(): Word[] {
    return canonicalWordPool(loaded, selection, lexicon);
  }
  const setup = el("div", undefined, "practice-setup"),
    grid = el("div", undefined, "mixed-grid"),
    counter = el("p", undefined, "mixed-counter"),
    pager = el("div", undefined, "mixed-pager");
  let mixed =
    data.mixed && data.mixed.queue.every((id) => allWords.has(id))
      ? data.mixed
      : null;
  let pageSize = window.innerWidth < 700 ? 1 : window.innerWidth < 1050 ? 4 : 6;
  const flipped = new Set<string>();
  async function start() {
    if (!selection.size) {
      message(copy("请至少选择一课", "Hãy chọn ít nhất một bài"));
      return;
    }
    const words = pool(),
      queue = words.map((w) => w.id);
    for (let i = queue.length - 1; i > 0; i--) {
      const r = new Uint32Array(1);
      crypto.getRandomValues(r);
      const j = r[0]! % (i + 1);
      [queue[i], queue[j]] = [queue[j]!, queue[i]!];
    }
    if (!queue.length) return;
    mixed = {
      selected: [...selection].sort((a, b) => a - b),
      queue,
      index: 0,
      seed: crypto.randomUUID(),
    };
    flipped.clear();
    edit((s) => {
      s.mixed = structuredClone(mixed);
    });
    const saved = await flush();
    if (saved) {
      globalMessage.hidden = true;
      controls.open = false;
    }
    draw();
  }
  setup.append(
    button(
      copy(
        mixed ? "应用选课并重新打乱" : "开始混课词卡",
        mixed ? "Áp dụng & trộn lại" : "Bắt đầu trộn thẻ",
      ),
      start,
      "primary",
    ),
  );
  controls.append(setup);
  main.append(counter, grid, pager);
  const previous = button(copy("上一组", "Nhóm trước"), async () => {
      if (!mixed || mixed.index === 0) return;
      mixed.index = Math.max(0, mixed.index - pageSize);
      flipped.clear();
      edit((s) => {
        s.mixed = structuredClone(mixed);
      });
      await flush();
      draw();
    }),
    next = button(copy("下一组", "Nhóm tiếp"), async () => {
      if (!mixed || mixed.index + pageSize >= mixed.queue.length) return;
      mixed.index += pageSize;
      flipped.clear();
      edit((s) => {
        s.mixed = structuredClone(mixed);
      });
      await flush();
      draw();
    });
  pager.append(previous, next);
  function draw() {
    grid.replaceChildren();
    setup
      .querySelector("button")!
      .replaceChildren(
        el(
          "span",
          mixed
            ? copy("应用选课并重新打乱", "Áp dụng & trộn lại")
            : copy("开始混课词卡", "Bắt đầu trộn thẻ"),
        ),
      );
    if (!mixed) {
      counter.replaceChildren(
        el("span", copy("选择课程后开始", "Chọn bài rồi bắt đầu")),
      );
      pager.hidden = true;
      return;
    }
    pager.hidden = false;
    const ids = mixed.queue.slice(mixed.index, mixed.index + pageSize);
    counter.textContent = `${mixed.index + 1}–${Math.min(mixed.index + pageSize, mixed.queue.length)} / ${mixed.queue.length} · 已选${mixed.selected.length}课 / ${mixed.selected.length} bài`;
    previous.disabled = mixed.index === 0;
    next.disabled = mixed.index + pageSize >= mixed.queue.length;
    for (const id of ids) {
      const w = allWords.get(id)!,
        card = el("article", undefined, "mixed-card"),
        flip = button("", () => {
          flipped.has(id) ? flipped.delete(id) : flipped.add(id);
          drawCard();
        });
      flip.className = "mixed-flip";
      flip.dataset.wordId = id;
      flip.dataset.senseId = senses.get(id)!.id;
      const drawCard = () => {
        flip.replaceChildren();
        const back = flipped.has(id);
        flip.setAttribute("aria-pressed", String(back));
        flip.setAttribute(
          "aria-label",
          back
            ? `${w.zh} · 拼音与越南语 · Pinyin và nghĩa tiếng Việt`
            : `${w.zh} · 翻面 · Lật thẻ`,
        );
        if (back) {
          flip.append(el("small",w.zh,"card-hanzi-label"));
          flip.append(
            el("span", w.py, "card-pinyin"),
            el("span", w.vi, "card-meaning"),
            el("small", w.pos, "card-pos"),
          );
          flip.dataset.face = "back";
        } else {
          flip.append(el("span", w.zh, "card-hanzi"));
          flip.dataset.face = "front";
        }
      };
      drawCard();
      card.append(flip, el("small", copy("点击卡片翻面", "Nhấn thẻ để lật")));
      if (w.audioTrack) {
        const source = audioControl(
          w.audioTrack,
          copy("听所在词组原音", "Nghe nhóm từ gốc"),
        );
        source.classList.add("card-audio");
        card.append(source);
      }
      grid.append(card);
    }
  }
  if(!mixed)controls.open=true;
  draw();
  const resize = () => {
    const size = innerWidth < 700 ? 1 : innerWidth < 1050 ? 4 : 6;
    if (size !== pageSize) {
      pageSize = size;
      flipped.clear();
      draw();
    }
  };
  window.addEventListener("resize", resize);
  cleanup = () => window.removeEventListener("resize", resize);
}
function legacySnapshot() {
  const out: Record<string, string | null> = {};
  for (const key of config.legacyKeys) {
    try {
      out[key] = local.getItem(key);
    } catch {
      out[key] = null;
    }
  }
  return out;
}
function exportFullBackup() {
  const full = {
    app: config.id + "-full-backup",
    schema: 1,
    exportedAt: Date.now(),
    current: JSON.parse(store.exportBackup()),
    legacyReadonly: legacySnapshot(),
  };
  download(`${config.id}-backup.json`, JSON.stringify(full, null, 2));
}
function renderProgress() {
  heading(labels.progress);
  const s = store.snapshot(),
    data = s.data;
  const summary = el("section", undefined, "progress-summary");
  const auto = Object.values(data.homework)
      .map((x) => x.latest)
      .filter((a): a is Attempt => !!a && a.assessment === "automatic"),
    manual = Object.values(data.homework).filter(
      (x) => x.latest?.assessment === "manual",
    ).length;
  summary.append(
    el("h2", copy("本版学习记录", "Dữ liệu học tập của bản này")),
    el(
      "p",
      copy(
        `已学 ${data.completed.length}/${config.count} 课`,
        `Đã học ${data.completed.length}/${config.count} bài`,
      ),
    ),
    el(
      "p",
      copy(
        `最近自动批改：${auto.reduce((a, x) => a + (x.correct ?? 0), 0)}/${auto.reduce((a, x) => a + x.total, 0)}；手写提交 ${manual} 部分`,
        `Chấm tự động gần nhất: ${auto.reduce((a, x) => a + (x.correct ?? 0), 0)}/${auto.reduce((a, x) => a + x.total, 0)}; đã nộp ${manual} phần viết`,
      ),
    ),
    el(
      "p",
      copy(
        "只统计2026新版。词卡浏览不改变掌握度或作业分数。",
        "Chỉ tính bản mới 2026. Xem thẻ từ không thay đổi mức độ thành thạo hoặc điểm bài tập.",
      ),
    ),
  );
  main.append(summary);
  const details=el('section',undefined,'progress-lessons');details.append(el('h2',copy('按课继续学习','Học tiếp theo bài')));
  for(const lesson of lessonSummaries(config)){const r=data.reading[lesson.id],homework=Object.values(data.homework).flatMap(h=>h.latest&&h.latest.questionIds.some(id=>id.startsWith(lesson.id+':'))?[h.latest]:[]),listening=Object.values(data.listening).flatMap(h=>h.latest&&h.latest.questionIds.some(id=>id.startsWith(lesson.id+':'))?[h.latest]:[]);const card=el('article',undefined,'lesson-card');card.append(el('h3',copy(`第${lesson.number}课 · ${lesson.title.zh}`,`Bài ${lesson.number} · ${lesson.title.vi}`)),el('p',copy(`教材 ${r?.completed.length??0}/7 部分已学 · 作业 ${homework.reduce((n,a)=>n+a.total,0)}/30题已提交 · 听力 ${listening.length}份记录`,`SGK: ${r?.completed.length??0}/7 mục đã học · Bài tập: ${homework.reduce((n,a)=>n+a.total,0)}/30 câu đã nộp · Nghe: ${listening.length} bản ghi`)),link(copy('继续教材','Học tiếp giáo trình'),routeHref({view:'lesson',lesson:lesson.number,section:r?.lastSection as Route['section']??'overview',scene:r?.scene})),link(copy('查看作业','Xem bài tập'),routeHref({view:'homework',lesson:lesson.number})));details.append(card)}main.append(details);
  const profile = el("section", undefined, "data-panel");
  profile.append(el("h2", copy("学习档案", "Hồ sơ học tập")));
  for (const [name, title] of [
    ["name", copy("姓名", "Họ tên")],
    ["className", copy("班级", "Lớp")],
  ] as const) {
    const label = el("label", title),
      input = el("input");
    input.type = "text";
    input.value = data.profile[name];
    input.id = `profile-${name}`;
    label.htmlFor = input.id;
    input.oninput = () =>
      edit((s) => {
        s.profile[name] = input.value;
      });
    profile.append(label, input);
  }
  main.append(profile);
  const panel = el("section", undefined, "data-panel");
  panel.append(
    el("h2", copy("备份与安全保存", "Sao lưu & lưu an toàn")),
    el(
      "p",
      copy(
        "记录保存在当前浏览器。先下载备份，再换设备或清理浏览器。",
        "Dữ liệu được lưu trong trình duyệt hiện tại. Hãy tải bản sao lưu trước khi đổi thiết bị hoặc dọn trình duyệt.",
      ),
    ),
  );
  panel.append(
    button(copy("下载完整备份", "Tải bản sao lưu đầy đủ"), exportFullBackup),
    button(copy("重试保存", "Thử lưu lại"), async () => {
      await flush();
    }),
  );
  const importLabel = el(
      "label",
      copy(
        "导入本课程备份（先预览）",
        "Nhập bản sao lưu khóa học này (xem trước)",
      ),
    ),
    input = el("input");
  input.type = "file";
  input.accept = ".json,application/json";
  input.id = "backup-import";
  importLabel.htmlFor = input.id;
  const preview = el("section", undefined, "backup-preview");
  preview.hidden = true;
  input.onchange = async () => {
    const file = input.files?.[0];
    if (!file) return;
    if (!(await flush())) return;
    try {
      if (file.size > 8 * 1024 * 1024)
        throw Error("备份文件过大 · Tệp sao lưu quá lớn");
      const raw = JSON.parse(await file.text());
      const content =
        raw.app === config.id + "-full-backup" ? raw.current : raw;
      const pending = store.previewBackup(JSON.stringify(content));
      preview.replaceChildren(
        el("h3", copy("备份预览", "Xem trước bản sao lưu")),
        el(
          "p",
          copy(
            `本版 ${pending.data.completed.length}课已学，${Object.keys(pending.data.homework).length}项作业记录；仅替换本课程新版数据。旧版原始记录不变。`,
            `Bản này có ${pending.data.completed.length} bài đã học, ${Object.keys(pending.data.homework).length} mục bài tập; chỉ thay dữ liệu bản mới của khóa học này. Dữ liệu gốc bản cũ giữ nguyên.`,
          ),
        ),
        button(copy("确认导入", "Xác nhận nhập"), async () => {
          const result = await store.confirm(pending);
          if (result.ok) {
            await render();
            message(
              copy(
                "已导入；上一份本版数据可恢复",
                "Đã nhập; có thể khôi phục dữ liệu bản này trước khi nhập",
              ),
            );
          } else
            message(
              copy(
                "导入未完成，请重新预览",
                "Nhập chưa hoàn tất, hãy xem trước lại",
              ),
            );
        }),
        button(copy("取消", "Hủy"), () => {
          preview.hidden = true;
          preview.replaceChildren();
          input.value = "";
        }),
      );
      preview.hidden = false;
    } catch (error) {
      message(error instanceof Error ? error.message : String(error));
      input.value = "";
    }
  };
  panel.append(importLabel, input, preview);
  if (s.hasRecovery)
    panel.append(
      button(
        copy(
          "恢复上一次替换前的记录",
          "Khôi phục dữ liệu trước lần thay thế gần nhất",
        ),
        async () => {
          if (
            !confirm(
              "恢复本课程上一次替换前的记录？\nKhôi phục dữ liệu trước lần thay thế của khóa học này?",
            )
          )
            return;
          const result = await store.restore();
          if (result.ok) await render();
          else
            message(
              copy(
                "恢复失败，请先备份",
                "Khôi phục thất bại, hãy sao lưu trước",
              ),
            );
        },
      ),
    );
  panel.append(
    button(copy("重新读取已保存记录", "Đọc lại dữ liệu đã lưu"), async () => {
      if (
        store.snapshot().hasUnsavedChanges &&
        !confirm(
          "放弃本标签页未保存的草稿？请先下载备份。\nBỏ bản nháp chưa lưu trong tab này? Hãy tải bản sao lưu trước.",
        )
      )
        return;
      store.reloadDiscardingDraft();
      await render();
    }),
  );
  if (s.status === "corrupt")
    panel.append(
      button(
        copy("下载无法读取的原始数据", "Tải dữ liệu gốc chưa đọc được"),
        () => {
          const raw = store.exportOriginal();
          if (raw) download(config.id + "-raw.json", raw);
        },
      ),
    );
  panel.append(
    button(
      copy("仅重置本版学习记录", "Chỉ đặt lại dữ liệu bản này"),
      async () => {
        if (!(await flush())) return;
        const candidate = store.snapshot().data;
        candidate.completed = [];
        candidate.drafts = {};
        candidate.homework = {};
        candidate.listening = {};
        candidate.mixed = null;
        candidate.activities = {};
        candidate.reading = {};
        candidate.favorites = [];
        candidate.listeningRound = null;
        try {
          const pending = store.previewReplacement(candidate, "reset");
          preview.replaceChildren(
            el(
              "p",
              copy(
                "仅重置本课程2026版的学习记录，保留姓名班级、其他课程和全部旧版原始数据。可恢复这次重置前的本版记录。",
                "Chỉ đặt lại dữ liệu học tập bản 2026 của khóa học này; giữ họ tên, lớp, khóa học khác và dữ liệu gốc bản cũ. Có thể khôi phục dữ liệu bản này trước khi đặt lại.",
              ),
            ),
            button(
              copy("确认重置本版", "Xác nhận đặt lại bản này"),
              async () => {
                const result = await store.confirm(pending);
                if (result.ok) await render();
                else message(copy("重置未完成", "Đặt lại chưa hoàn tất"));
              },
            ),
            button(copy("取消", "Hủy"), () => {
              preview.hidden = true;
            }),
          );
          preview.hidden = false;
        } catch (error) {
          message(error instanceof Error ? error.message : String(error));
        }
      },
    ),
  );
  main.append(panel);
  const history = el("section", undefined, "data-panel");
  history.append(
    el("h2", copy("旧版记录，只读保留", "Dữ liệu bản cũ, chỉ đọc")),
    el(
      "p",
      copy(
        level === 3
          ? "旧版3级课程共有20课；2026新版有18课。两版课号不直接对应，旧分数不会重标为新分数。"
          : "旧版记录与2026新版独立保存，不把旧分数算作新版分数。",
        level === 3
          ? "HSK3 cũ có 20 bài; bản 2026 có 18 bài, số bài không tương ứng trực tiếp. Điểm cũ không được gán thành điểm mới."
          : "Dữ liệu cũ và bản 2026 lưu riêng; điểm cũ không được tính thành điểm mới.",
      ),
    ),
    link(copy("打开旧版课程", "Mở khóa học bản cũ"), config.legacyURL),
  );
  for (const [key, raw] of Object.entries(legacySnapshot())) {
    const details = el("details");
    details.append(
      el(
        "summary",
        copy(
          key.includes("mastered") ? "旧版已记忆词汇" : "旧版学习进度",
          key.includes("mastered") ? "Từ đã ghi nhớ bản cũ" : "Tiến độ bản cũ",
        ),
      ),
      el("pre", raw ?? "暂无记录 · Chưa có dữ liệu"),
    );
    history.append(details);
  }
  main.append(history);
}
let hsk1: ReturnType<typeof createHSK1Bridge> | undefined;
async function flushHSK1() {
  const ok = await (hsk1?.flush() ?? true);
  if (!ok) message(copy("请先保存当前草稿", "Hãy lưu bản nháp hiện tại trước"));
  return ok;
}
async function disposeHSK1() {
  await hsk1?.dispose();
  hsk1 = undefined;
}
async function renderHSK1() {
  if (route.view === "portal") {
    renderPortal();
    return;
  }
  if (!hsk1)
    hsk1 = createHSK1Bridge({
      audio,
      navigate: (r) => {
        location.hash = routeHref(r);
      },
      error: message,
    });
  if (["lesson", "homework", "archive"].includes(route.view)) {
    const prior = available;
    available = Array.from({ length: 15 }, (_, i) => i + 1);
    lessonNav();
    available = prior;
  }
  await hsk1.render(main, route);
}
async function openUnifiedBackup(){
 if(composing||(level===1&&hsk1?.collectCurrentDraft())){message(copy('请先完成当前输入法输入','Hãy hoàn thành nhập liệu hiện tại trước'));return}
 if(!hsk1)hsk1=createHSK1Bridge({audio,navigate:r=>{location.hash=routeHref(r)},error:message});
 try{const one=await hsk1.store(),paired=await hsk1.sourceBackup(),providers:BackupProvider[]=[{paired,level:1,edition:'现行教材 · Giáo trình hiện hành',status:()=>one.snapshot().status,export:()=>one.exportBackup(),original:()=>one.exportOriginal(),preview:text=>{const p=one.previewBackup(text);return {data:p.data,confirm:signal=>one.confirm(p,signal)}}}];
 for(const n of [2,3] as const){const st=levelStore(n);providers.push({level:n,edition:'2026 · 第一版 / Ấn bản đầu',status:()=>st.snapshot().status,export:()=>st.exportBackup(),original:()=>st.exportOriginal(),preview:text=>{const p=st.previewBackup(text);return {data:p.data,confirm:signal=>st.confirm(p,signal)}}})}
 const legacyKeys=[...configs[2].legacyKeys,...configs[3].legacyKeys];const legacy:Record<string,string|null>={};for(const key of legacyKeys){try{legacy[key]=local.getItem(key)}catch{legacy[key]=null}}
 const {openBackupPanel}=await import('./backup-view.ts');openBackupPanel(providers,legacy,()=>{void render()});
 }catch(error){message(error instanceof Error?error.message:String(error))}
}
footer.append(button(copy('统一备份与恢复','Sao lưu & khôi phục'),openUnifiedBackup));
const assetMeta = el("meta");
assetMeta.name = "hsk1-asset-base";
assetMeta.content = new URL(assetBase, location.href).href;
document.head.append(assetMeta);
const levelSwitch = el("nav", undefined, "level-switch");
levelSwitch.setAttribute("aria-label", "选择HSK级别 · Chọn cấp HSK");
for (const n of [1, 2, 3] as const) {
  const a = link(`HSK ${n}`, routeHref({ level: n, view: "courses" }));
  a.dataset.level = String(n);
  levelSwitch.append(a);
}
header.append(levelSwitch);
const recentKey = "ran_hsk_unified_navigation_v1";
function recentRoutes(): Partial<Record<Level, Route>> {
  try {
    const v = JSON.parse(local.getItem(recentKey) ?? "{}");
    if (!v || typeof v !== "object" || Array.isArray(v)) return {};
    const out: Partial<Record<Level, Route>> = {};
    for (const n of [1, 2, 3] as const) {
      const r = v[n];
      if (
        r &&
        r.level === n &&
        typeof r.view === "string" &&
        Number.isInteger(r.lesson)
      )
        out[n] = parseRoute(routeHref(r), n === 3 ? 18 : 15, n);
    }
    return out;
  } catch {
    return {};
  }
}
function updateShell() {
  root.dataset.level = String(level);
  root.dataset.view = route.view;
  header
    .querySelector(".brand")
    ?.replaceChildren(
      el("span", copy("汉语课堂", `然老师 · Cô Nhiên · HSK ${level}`)),
    );
  header
    .querySelector(".course-badge")
    ?.replaceChildren(
      el(
        "span",
        level === 1
          ? copy("HSK 1 · 现行教材", "HSK 1 · Giáo trình hiện hành")
          : copy("2026 · 第一版", "Ấn bản đầu 2026"),
      ),
    );
  const recent = recentRoutes();
  for (const a of levelSwitch.querySelectorAll<HTMLAnchorElement>("a")) {
    const n = Number(a.dataset.level) as Level;
    a.href = n===level?routeHref(route):routeHref(recent[n] ?? { level: n, view: "courses" });
    a.setAttribute("aria-current", n === level ? "true" : "false");
  }
  if (route.view !== "portal") {
    try {
      local.setItem(
        recentKey,
        JSON.stringify({ ...recent, [level]: { ...route, level } }),
      );
    } catch {
      message(
        copy(
          "无法保存续学位置，学习内容仍可使用。",
          "Không thể lưu vị trí học tiếp; bạn vẫn có thể học.",
        ),
      );
    }
  }
  syncStatus();
}
function renderPortal() {
  heading(copy("今天，从哪一级开始？", "Hôm nay, bạn muốn học cấp nào?"));
  const intro = el(
    "p",
    copy("一个课堂，按自己的节奏学习。", "Một lớp học, học theo nhịp của bạn."),
  );
  main.append(intro);
  const grid = el("div", undefined, "course-grid level-grid"),
    recent = recentRoutes();
  for (const n of [1, 2, 3] as const) {
    const card = el("article", undefined, "lesson-card level-card");
    const r = recent[n];
    card.append(
      el("small", `HSK ${n}`),
      el(
        "h2",
        copy(
          ["", "打好基础", "说出想法", "表达更丰富"][n]!,
          ["", "Xây nền tảng", "Nói lên suy nghĩ", "Diễn đạt phong phú"][n]!,
        ),
      ),
      el(
        "p",
        copy(
          `${n === 3 ? 18 : 15}课 · ${n === 1 ? "现行教材" : "2026 第一版"}`,
          `${n === 3 ? 18 : 15} bài · ${n === 1 ? "Giáo trình hiện hành" : "Ấn bản đầu 2026"}`,
        ),
      ),
      link(
        r
          ? copy(`继续第${r.lesson}课`, `Học tiếp bài ${r.lesson}`)
          : copy("进入课程", "Vào khóa học"),
        routeHref(r ?? { view: "courses", level: n }),
        "lesson-open",
      ),
    );
    grid.append(card);
  }
  main.append(grid);
  const extra = el("details", undefined, "data-panel");
  extra.append(
    el("summary", copy("其他课程与旧版记录", "Khóa học khác & dữ liệu bản cũ")),
  );
  for (const [label, path] of [
    ["HSK 4 上", "hsk4up/"],
    ["HSK 4 下", "hsk4/"],
    ["旧版 HSK 1", "hsk1/"],
    ["旧版 HSK 2", "hsk2.html"],
    ["旧版 HSK 3 · 20课", "hsk3/"],
  ])
    extra.append(
      link(
        label!,
        new URL(
          "../../" + path,
          new URL("course-engine/", new URL(assetBase, location.href)),
        ).href,
      ),
    );
  extra.append(
    el(
      "p",
      copy(
        "旧版记录独立保留。三级旧版20课，不对应新版18课。",
        "Dữ liệu bản cũ được giữ riêng. 20 bài HSK3 cũ không tương ứng với 18 bài mới.",
      ),
    ),
  );
  main.append(extra);
}
const auth = createSessionAuth(session);
const gate = el("section", undefined, "auth-gate"),
  form = el("form", undefined, "auth-card");
gate.setAttribute("role", "dialog");
gate.setAttribute("aria-modal", "true");
gate.setAttribute("aria-labelledby", "auth-title");
const authTitle = el("h1", copy("进入汉语课堂", "Vào lớp tiếng Trung"));
authTitle.id = "auth-title";
const label = el("label", copy("课堂口令", "Mật khẩu lớp học")),
  password = el("input");
password.id = "class-password";
password.type = "password";
password.autocomplete = "current-password";
password.required = true;
label.htmlFor = password.id;
const unlock = el("button", copy("进入课程", "Vào khóa học"), "primary");
unlock.type = "submit";
const error = el("p");
error.setAttribute("role", "alert");
form.append(
  authTitle,
  el(
    "p",
    copy(
      `HSK ${level} · 新HSK教程 · 2026`,
      `HSK ${level} · Giáo trình HSK mới · 2026`,
    ),
  ),
  label,
  password,
  unlock,
  error,
);
gate.append(form);
document.body.append(gate);
root.inert = true;
form.onsubmit = async (e) => {
  e.preventDefault();
  if (unlock.disabled) return;
  unlock.disabled = true;
  const result = await auth.unlock(password.value);
  password.value = "";
  unlock.disabled = false;
  if (result.accepted) {
    gate.remove();
    root.inert = false;
    await render();
  } else {
    error.replaceChildren(
      el(
        "span",
        copy(
          "口令不正确或浏览器验证不可用",
          "Mật khẩu không đúng hoặc trình duyệt không thể xác minh",
        ),
      ),
    );
    password.focus();
  }
};
gate.addEventListener("keydown", (e) => {
  if (e.key === "Tab") {
    if (e.shiftKey && document.activeElement === password) {
      e.preventDefault();
      unlock.focus();
    } else if (!e.shiftKey && document.activeElement === unlock) {
      e.preventDefault();
      password.focus();
    }
  }
});
if (auth.isUnlocked()) {
  gate.remove();
  root.inert = false;
  void render();
} else password.focus();
