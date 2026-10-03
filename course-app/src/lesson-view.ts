import {originalSegment,sentenceSegments,isSingleSentence} from "./segment-resolver.ts";
import { el, button, link, copy, sourceNote } from "./dom.ts";
import { routeHref, type Route, type Section } from "./router.ts";
import type {
  Lesson,
  Copy,
  TextbookActivity,
  ActivityField,
  Illustration,
} from "./types.ts";
import type { State, ActivityRecord } from "./state.ts";
import type { AudioService } from "../../hsk1-app/src/services/audio/index.ts";
export interface LessonContext {
  route: Route;
  level: 2 | 3;
  assetBase:string;
  state(): State;
  edit(fn: (state: State) => void): void;
  flush(): Promise<boolean>;
  audio: AudioService;
  audioControl(track: string, label?: Copy): HTMLElement;
  message(text: Copy): void;
}
const sections: readonly [Section, Copy][] = [
  ["overview", copy("导学", "Mở đầu")],
  ["vocab", copy("词汇", "Từ vựng")],
  ["text", copy("课文", "Bài khóa")],
  ["grammar", copy("语言点", "Ngữ pháp")],
  ["hanzi", copy("汉字", "Chữ Hán")],
  ["practice", copy("教材练习", "Bài tập SGK")],
  ["culture", copy("拓展与自评", "Mở rộng & tự đánh giá")],
];
const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .trim();
export function mountLesson(
  host: HTMLElement,
  l: Lesson,
  c: LessonContext,
): () => void {
  const events = new AbortController(),
    section = c.route.section ?? "overview";
  const main = el("article", undefined, "textbook-module");
  main.dataset.section = section;
  const heading = el(
    "h1",
    l.title,
  );
  heading.tabIndex = -1;
  const hero=el("header",undefined,"lesson-hero");hero.append(el("p",copy(`第${l.number}课`,`BÀI ${l.number}`),"eyebrow"),heading);main.append(hero);
  const subnav = el("nav", undefined, "textbook-tabs");
  subnav.setAttribute("aria-label", "教材分部 · Các mục giáo trình");
  for (const [id, title] of sections) {
    const a = link(
      title,
      routeHref({ ...c.route, section: id, scene: undefined }),
    );
    if (id === section) a.setAttribute("aria-current", "page");
    subnav.append(a);
  }
  main.append(subnav);
  const body = el("div", undefined, "textbook-body");
  main.append(body);
  host.append(main);
  const showActiveSection=()=>{const active=subnav.querySelector<HTMLElement>('[aria-current="page"]');if(!active||subnav.scrollWidth<=subnav.clientWidth)return;const item=active.getBoundingClientRect(),row=subnav.getBoundingClientRect();subnav.scrollLeft+=item.left-row.left-(subnav.clientWidth-item.width)/2};showActiveSection();window.addEventListener('resize',showActiveSection,{signal:events.signal});
  const reading = c.state().reading[l.id] ?? {
    visited: [],
    completed: [],
    lastSection: section,
    scene: 1,
    updatedAt: 0,
  };
  c.edit((s) => {
    s.reading[l.id] = {
      ...reading,
      visited: [...new Set([...reading.visited, section])],
      lastSection: section,
      scene: c.route.scene ?? 1,
      updatedAt: Date.now(),
    };
  });
  let extraCleanup = () => {};
  function activity(a: TextbookActivity) {
    const wrap = el("section", undefined, "activity-card");
    wrap.dataset.activityId = a.id;
    wrap.append(el("h3", a.title));
    if(a.audioTrack)wrap.append(c.audioControl(a.audioTrack,copy("听本篇原音","Nghe âm thanh gốc bài này")));
    if(a.recommendedPlays)wrap.append(el("p",copy(`先听${a.recommendedPlays}遍，再回答问题。`,`Nghe ${a.recommendedPlays} lần rồi trả lời câu hỏi.`),"task-note"));
    if (a.note) wrap.append(el("p", a.note, "task-note"));
    const current: ActivityRecord = c.state().activities[a.id] ?? {
      values: {},
      checkedAt: null,
      updatedAt: 0,
    };
    let values = { ...current.values };
    const fields = el("div", undefined, "activity-fields"),
      feedback = el("div", undefined, "activity-feedback");
    feedback.setAttribute("aria-live", "polite");
    const change = (id: string, value: string | boolean) => {
      values[id] = value;
      c.edit((s) => {
        s.activities[a.id] = {
          values: { ...values },
          checkedAt: null,
          updatedAt: Date.now(),
        };
      });
      feedback.replaceChildren();
    };
    const renderedIllustrations=new Set<string>();
    function field(f: ActivityField, cell=false, cellLabel?:Copy) {
      const row = el("div", undefined, "activity-field");
      if (f.illustrationId&&!renderedIllustrations.has(f.illustrationId)) {
        const pic = l.illustrationManifest?.find(
          (p) => p.id === f.illustrationId,
        );
        if (pic){row.append(illustration(pic,c.assetBase,events.signal));renderedIllustrations.add(pic.id)}
      }
      const label = el("label", cellLabel??f.prompt);
      if(cell)label.classList.add(f.input==="checkbox"?"matrix-check-label":"matrix-input-label");if(cellLabel)label.classList.add("matrix-visible-label");
      label.htmlFor = f.id;
      row.append(label);
      if (f.input === "select") {
        const select = el("select");
        select.id = f.id;
        const empty = el(
          "option",
          copy("请选择", "Hãy chọn").zh + " · Hãy chọn",
        );
        empty.value = "";
        select.append(empty);
        for (const option of f.options ?? []) {
          const o = el(
            "option",
            option.zh +
              (option.vi && option.vi !== option.zh ? " · " + option.vi : ""),
          );
          o.value = option.zh;
          select.append(o);
        }
        select.value = String(values[f.id] ?? "");
        select.onchange = () => change(f.id, select.value);
        row.append(select);
      } else if (f.input === "checkbox") {
        const input = el("input");
        input.type = "checkbox";
        input.id = f.id;
        input.checked = values[f.id] === true;
        input.setAttribute("aria-label",f.prompt.zh+" · "+f.prompt.vi);
        input.onchange = () => change(f.id, input.checked);
        label.prepend(input);
        row.classList.add("check-field");
      } else {
        const input = f.input === "textarea" ? el("textarea") : el("input");
        input.id = f.id;
        input.value = String(values[f.id] ?? "");
        if (input instanceof HTMLTextAreaElement) input.rows = 3;
        else input.type = "text";
        input.autocomplete = "off";
        input.oninput = () => change(f.id, input.value);
        row.append(input);
      }
      if(f.source)row.append(sourceNote(f.source.printedPage));
      return row;
    }
    if(a.matrix){
      const table=el('table',undefined,'self-assessment-matrix'),head=el('thead'),headRow=el('tr');
      table.dataset.matrixKind=a.kind;table.append(el('caption',a.title,'matrix-caption'));
      const subject=el('th',a.matrix.rowHeading??copy('语言点与例句','Ngữ pháp và ví dụ'));subject.setAttribute('scope','col');headRow.append(subject);
      for(const col of [...(a.matrix.contextHeaders??[]),...a.matrix.columns]){const th=el('th',col);th.setAttribute('scope','col');headRow.append(th)}
      head.append(headRow);table.append(head);const rows=el('tbody');
      for(const entry of a.matrix.rows){const tr=el('tr'),th=el('th',entry.prompt);th.setAttribute('scope','row');tr.append(th);for(const context of entry.contextCells??[])tr.append(el('td',context));for(const [column,id]of entry.fieldIds.entries()){const f=a.fields.find(f=>f.id===id);if(!f)throw Error('Missing self-assessment matrix field');const td=el('td');td.append(field(f,true,entry.cellLabels?.[column]));tr.append(td)}rows.append(tr)}
      table.append(rows);fields.append(table);
    }else a.fields.forEach((f) => fields.append(field(f)));
    wrap.append(fields);
    function showFeedback() {
      feedback.replaceChildren();
      for (const f of a.fields) {
        const value = values[f.id];
        if (f.assessment === "official" && f.answer !== undefined) {
          const accepted = Array.isArray(f.answer) ? f.answer : [f.answer];
          const correct =
            typeof value === "string" &&
            accepted.some((x) => norm(x) === norm(value));
          const block = el(
            "div",
            undefined,
            correct ? "feedback-correct" : "feedback-retry",
          );
          block.append(
            el(
              "p",
              copy(
                correct ? "回答正确" : "再看看这题",
                correct ? "Trả lời đúng" : "Hãy xem lại câu này",
              ),
            ),
            el(
              "p",
              copy(
                "参考答案：" + accepted.join(" / "),
                "Đáp án: " + accepted.join(" / "),
              ),
            ),
          );
          if (f.answerSource)
            block.append(
              el(
                "small",
                copy(
                  `配套客观题答案 · PDF第${f.answerSource.pdfPage}页`,
                  `Đáp án kèm sách · PDF trang ${f.answerSource.pdfPage}`,
                ),
              ),
            );
          feedback.append(block);
        } else if (f.referenceAnswer) {
          feedback.append(
            el(
              "p",
              copy(
                "一种参考表达（不是唯一答案）",
                "Một cách diễn đạt tham khảo (không phải đáp án duy nhất)",
              ),
            ),
            el("p", f.referenceAnswer),
          );
        } else if (f.input !== "checkbox")
          feedback.append(
            el(
              "p",
              copy(
                "这是开放任务。请结合教材与自己的情况回答，可请老师反馈。",
                "Đây là nhiệm vụ mở. Trả lời theo giáo trình và tình huống của bạn; có thể nhờ giáo viên góp ý.",
              ),
            ),
          );
      }
      if (a.kind === "self-assessment")
        feedback.append(
          el(
            "p",
            copy(
              "已记录你的自评，不计入作业分数",
              "Đã ghi nhận tự đánh giá; không tính vào điểm bài tập",
            ),
          ),
        );
    }
    const check = button(
      copy(
        a.kind === "survey" || a.kind === "self-assessment"
          ? "保存本次记录"
          : "提交并查看反馈",
        a.kind === "survey" || a.kind === "self-assessment"
          ? "Lưu bản ghi"
          : "Nộp & xem phản hồi",
      ),
      async () => {
        const incomplete = a.fields.some(
          (f) => f.input !== "checkbox" && !String(values[f.id] ?? "").trim(),
        );
        if (incomplete) {
          feedback.replaceChildren(
            el("p", copy("请先完成本组输入", "Hãy điền hết nhóm này trước")),
          );
          return;
        }
        c.edit((s) => {
          s.activities[a.id] = {
            values: { ...values },
            checkedAt: Date.now(),
            updatedAt: Date.now(),
          };
        });
        if (await c.flush()) showFeedback();
      },
      "primary",
    );
    const sourcePages=[...new Set([a.source.printedPage,...a.fields.flatMap(f=>f.source?[f.source.printedPage]:[])])].sort((a,b)=>a-b);wrap.append(check,feedback,el("small",copy(`教材第${sourcePages.join("、")}页`,`SGK trang ${sourcePages.join(", ")}`),"source-note"));
    if (current.checkedAt) showFeedback();
    return wrap;
  }
  function mapped(ref: string) {
    return (
      l.activities?.filter(
        (a) =>
          a.targetRef === ref ||
          a.targetRef.startsWith(ref + "/") ||
          a.targetRef.startsWith(ref + ":"),
      ) ?? []
    );
  }
  function manual(
    id: string,
    title: Copy,
    prompt: Copy,
    source:
      | Lesson["source"]
      | {
          printedPage: number;
          pdfPage: number;
          section: string;
          provenance: "textbook" | "supplemental";
        },
    kind: TextbookActivity["kind"] = "open",
  ) {
    const src =
      "pdfPage" in source
        ? source
        : {
            pdfPage: source.startPdfPage,
            printedPage: source.startPrintedPage,
            section: title.zh,
            provenance: "textbook" as const,
          };
    return activity({
      id,
      kind,
      title,
      source: src,
      origin: "textbook",
      targetRef: id,
      fields: [
        { id: id + ":response", prompt, input: "textarea", assessment: "open" },
      ],
    });
  }
  function questions(text: Lesson["texts"][number]) {
    const exact = mapped(text.id);
    if (exact.length) {
      exact.forEach((a) => body.append(activity(a)));
      return;
    }
    for (const q of text.questions) {
      const a: TextbookActivity = {
        id: q.id,
        kind: q.options ? "choice" : "open",
        title: q,
        source: q.source,
        origin: "textbook",
        targetRef: q.id,
        fields: [
          {
            id: q.id + ":answer",
            prompt: copy("你的回答", "Câu trả lời của bạn"),
            input: q.options ? "select" : "textarea",
            options: q.options?.map((o) => copy(o, o)),
            ...(q.answer !== undefined && q.options
              ? { answer: q.options[q.answer], assessment: "official" as const }
              : { assessment: "open" as const }),
          },
        ],
      };
      body.append(activity(a));
      if (q.editorialNote) body.append(el("p", q.editorialNote, "task-note"));
    }
  }
  if (section === "overview") {
    const hero = el("section", undefined, "lesson-intro");
    hero.append(
      el("p", l.title.py, "pinyin-visible"),
      el("h2", copy("这一课，你能做到", "Sau bài này, bạn có thể")),
    );
    l.objectives.forEach((o) => hero.append(el("p", o)));
    hero.append(
      link(
        copy("开始学词汇", "Bắt đầu với từ vựng"),
        routeHref({ ...c.route, section: "vocab" }),
        "primary",
      ),
    );
    body.append(hero);
    for (const warm of l.warmup) {
      const exact = mapped(warm.id);
      if (exact.length) exact.forEach((a) => body.append(activity(a)));
      else {
        const sec = el("section", undefined, "lesson-section");
        sec.append(el("h2", warm.title));
        warm.items.forEach((x, i) =>
          sec.append(
            manual(
              warm.id + ":" + i,
              warm.title,
              x,
              x.source ?? warm.source,
              "survey",
            ),
          ),
        );
        body.append(sec);
      }
    }
    // Precisely authored activities may use JSON paths instead of historical IDs.
    for (const a of l.activities ?? [])
      if (
        /warmup|objectives/.test(a.targetRef) &&
        !l.warmup.some((w) => mapped(w.id).includes(a))
      )
        body.append(activity(a));
  } else if (section === "vocab") {
    const bar = el("div", undefined, "vocabulary-toolbar"),
      search = el("input");
    search.type = "search";
    search.id = "word-search";
    search.placeholder = "汉字 / pinyin / tiếng Việt";
    const label = el("label", copy("查找本课词汇", "Tìm từ trong bài"));
    label.htmlFor = search.id;
    bar.append(label, search);
    const onlyStar = el("input");
    onlyStar.type = "checkbox";
    const starLabel = el("label", copy("只看星标", "Chỉ từ đã đánh dấu"));
    starLabel.prepend(onlyStar);
    bar.append(starLabel);
    body.append(bar);
    const list = el("div", undefined, "vocabulary-list");
    body.append(list);
    const draw = () => {
      list.replaceChildren();
      const words = l.vocabulary.filter(
        (w) =>
          (!onlyStar.checked || c.state().favorites.includes(w.id)) &&
          norm(w.zh + " " + w.py + " " + w.vi).includes(norm(search.value)),
      );
      if (!words.length)
        list.append(el("p", copy("没有符合条件的词汇", "Không có từ phù hợp")));
      for (const w of words) {
        const row = el("article", undefined, "vocabulary-item");
        row.dataset.wordId=w.id;
        const open = button("", () => {
          const dialog = el("dialog", undefined, "word-dialog"),
            inner = el("div");
          const close = button(copy("关闭", "Đóng"), () => dialog.close());
          const title = el("h2", w.zh);
          title.id = "word-detail-title";
          dialog.setAttribute("aria-labelledby", title.id);
          inner.append(
            close,
            title,
            el("p", w.py, "pinyin-visible"),
            el("p", `${w.pos} · ${w.vi}`),
            sourceNote(w.source.printedPage),
                ...(w.supplementarySyllabus?[el("p",copy("★ 教材拓展词（本级超纲）","★ Từ mở rộng trong giáo trình (ngoài phạm vi cấp này)"))]:[]),
            ...(originalSegment('words',w.id,c.assetBase)?[button(copy('播放单词原音','Nghe từ gốc'),async()=>{const request=originalSegment('words',w.id,c.assetBase)!;const result=await c.audio.play(request,{signal:events.signal});if(!result.ok&&result.code!=='cancelled')c.message(copy('原音未播放，请重试','Chưa phát được âm thanh gốc, hãy thử lại'))})]:[el('p',copy('本词独立原音尚待核验，可听所在整组原音。','Âm thanh riêng của từ này đang chờ kiểm chứng; có thể nghe cả nhóm từ.'))]),
            c.audioControl(
              w.audioTrack,
              copy("听所在生词组原音", "Nghe nhóm từ gốc"),
            ),
            button(
              copy("合成语音 · 单词", "Giọng tổng hợp · Từ này"),
              async () => {
                await c.audio.speak(w.zh, {
                  label: `合成语音 · Giọng tổng hợp · ${w.zh}`,
                  signal: events.signal,
                });
              },
            ),
          );
          const examples = l.texts.filter(t=>t.number===w.sourceText).flatMap((t) =>
            t.lines
              .filter((line) => line.zh.includes(w.zh))
              .map((line) => ({ line, text: t })),
          );
          inner.append(
            el("h3", copy("在课文中这样用", "Cách dùng trong bài khóa")),
          );
          if (!examples.length)
            inner.append(
              el(
                "p",
                copy(
                  "本课文中未找到完全相同词形",
                  "Không thấy dạng từ trùng hoàn toàn trong bài khóa",
                ),
              ),
            );
          for (const { line, text } of examples) {
            const e = el("div", undefined, "example");
            e.append(
              el("p", line.zh, "chinese-line"),
              el("p", line.py, "pinyin-visible"),
              el("p", line.vi),
              link(
                copy(`去课文${text.number}`, `Đến bài khóa ${text.number}`),
                routeHref({ ...c.route, section: "text", scene: text.number }),
              ),
            );
            e.querySelector("a")!.onclick = () => dialog.close();
            inner.append(e);
          }
          inner.append(
            link(
              copy("查看汉字与书写", "Xem chữ Hán & tập viết"),
              routeHref({ ...c.route, section: "hanzi" }),
            ),
          );
          inner
            .querySelector("a:last-child")
            ?.addEventListener("click", () => dialog.close());
          dialog.append(inner);
          document.body.append(dialog);
          dialog.addEventListener(
            "close",
            () => {
              dialog.remove();
              open.focus();
            },
            { once: true },
          );
          events.signal.addEventListener("abort", () => dialog.remove(), {
            once: true,
          });
          dialog.showModal();
          close.focus();
        });
        open.className = "word-open";
        open.append(
          el("strong", w.zh),
          el("span", w.py),
          el("span", `${w.pos} · ${w.vi}`),
        );
        const star = button(
          c.state().favorites.includes(w.id) ? "★" : "☆",
          () => {
            c.edit((s) => {
              s.favorites = s.favorites.includes(w.id)
                ? s.favorites.filter((id) => id !== w.id)
                : [...s.favorites, w.id];
            });
            draw();
          },
        );
        star.setAttribute(
          "aria-label",
          `${c.state().favorites.includes(w.id) ? "取消星标 · Bỏ đánh dấu" : "星标 · Đánh dấu"} ${w.zh}`,
        );
        star.setAttribute(
          "aria-pressed",
          String(c.state().favorites.includes(w.id)),
        );
        row.append(open, star);
        list.append(row);
      }
    };
    search.oninput = draw;
    onlyStar.onchange = draw;
    draw();
  } else if (section === "text") {
    const scene = Math.min(c.route.scene ?? 1, l.texts.length),
      tabs = el("nav", undefined, "scene-tabs");
    tabs.setAttribute("aria-label", "课文情境 · Ngữ cảnh bài khóa");
    for (const t of l.texts) {
      const a = link(
        copy(`课文${t.number}`, `Bài khóa ${t.number}`),
        routeHref({ ...c.route, section: "text", scene: t.number }),
      );
      if (t.number === scene) a.setAttribute("aria-current", "page");
      tabs.append(a);
    }
    body.append(tabs);
    const text = l.texts.find((t) => t.number === scene)??l.texts[0]!;
    body.append(
      el(
        "h2",
        text.title.zh === `课文${text.number}`
          ? copy(`课文${text.number}`, `Bài khóa ${text.number}`)
          : text.title,
      ),
      el("p", text.context),
      c.audioControl(
        text.audioTrack,
        copy("播放本篇原音", "Phát âm thanh gốc bài này"),
      ),
    );
    const py = el("input");
    py.type = "checkbox";
    py.checked = c.level === 2;
    py.id = "text-pinyin";
    const pyLabel = el(
      "label",
      copy("显示拼音辅助", "Hiện pinyin hỗ trợ"),
      "pinyin-toggle",
    );
    pyLabel.prepend(py);
    body.append(pyLabel);
    body.classList.toggle("show-pinyin", py.checked);
    py.onchange = () => body.classList.toggle("show-pinyin", py.checked);
    for(const pic of l.illustrationManifest??[])if(pic.textbookRelation?.owner===text.id)body.append(illustration(pic,c.assetBase,events.signal));
    const textBody = el("section", undefined, "dialogue-text");
    for (const line of text.lines) {
      const row = el("div", undefined, "dialogue-line");
      if (line.speaker) row.append(el("strong", line.speaker));
      row.append(
        el("p", line.zh, "chinese-line"),
        el("p", line.py, "pinyin-line"),
        el("p", line.vi, "vietnamese-line"),
      );
      const chunks=sentenceSegments(line.id,c.assetBase),original=originalSegment('lines',line.id,c.assetBase);
      if(chunks.length){const actions=el('div',undefined,'sentence-audio');for(const [i,chunk]of chunks.entries()){const play=button(copy(`第${i+1}句原音`,`Âm thanh câu ${i+1}`),async()=>{await c.audio.play(chunk.request,{signal:events.signal})});play.dataset.audioSegment=chunk.id;actions.append(play)}row.append(actions)}else if(original){const play=button(isSingleSentence(line.id)?copy('本句原音','Nghe câu gốc'):copy('本段原音','Nghe đoạn gốc'),async()=>{await c.audio.play(original,{signal:events.signal})});play.dataset.audioSegment=line.id;row.append(play)}
      textBody.append(row);
    }
    body.append(
      textBody,
      sourceNote(text.source.printedPage),
      el("h2", copy("理解课文", "Hiểu bài khóa")),
    );
    questions(text);
  } else if (section === "grammar") {
    for (const g of l.grammar) {
      const sec = el("section", undefined, "lesson-section grammar");
      sec.append(
        el("h2", g.title),
        el("p", g.structure, "structure"),
        el("p", g.explanation),
      );
      for (const x of g.examples) {
        const ex = el("div", undefined, "example");
        ex.append(
          el("p", x.zh, "chinese-line"),
          el("p", x.py, "pinyin-visible"),
          el("p", x.vi),
        );
        sec.append(ex);
      }
      sec.append(sourceNote(g.source.printedPage));
      body.append(sec);
      const exact = mapped(g.id);
      if (exact.length) exact.forEach((a) => body.append(activity(a)));
      else
        g.practice.forEach((p, i) =>
          body.append(
            manual(
              g.id + ":practice" + (i + 1),
              copy("练一练", "Luyện tập"),
              p,
              p.source,
            ),
          ),
        );
    }
  } else if (section === "hanzi") {
    body.append(el('p',copy('本课词汇汉字 · 辅助书写','Chữ Hán trong từ vựng bài này · Luyện viết hỗ trợ'),'task-note'));
    const mount = el("div");
    body.append(mount);
    void import("../../hsk1-app/src/features/textbook/hanzi.ts").then((m) => {
      if (!events.signal.aborted) {
        const view = m.mountHanzi(mount, {
          chars: l.vocabulary.map((w) => w.zh),
          words: l.vocabulary,
          signal: events.signal,
        });
        extraCleanup = view.dispose;
        void view.ready.catch(() =>
          c.message(
            copy(
              "部分笔顺未载入，请重试",
              "Một số nét chưa tải được, hãy thử lại",
            ),
          ),
        );
      }
    });
  } else {
    if(section==='culture')for(const pic of l.illustrationManifest??[])if(pic.textbookRelation?.owner===l.id+':culture')body.append(illustration(pic,c.assetBase,events.signal));
    const chosen = l.sections.filter((s) =>
      section === "practice"
        ? ["practice", "activity"].includes(s.kind)
        : !["practice", "activity"].includes(s.kind),
    );
    if(section==='culture'&&!chosen.length)body.append(el('p',copy('本课没有单独的拓展或学习小结页。可回到导学检查本课目标。','Bài này không có trang mở rộng hoặc tự tổng kết riêng. Có thể quay lại phần mở đầu để kiểm tra mục tiêu.')),link(copy('回到本课目标','Về mục tiêu bài học'),routeHref({...c.route,section:'overview'})));
    for (const s of chosen) {
      body.append(el("h2", s.title));
      const exact = mapped(s.id);
      if (exact.length) {
        const hints=s.blocks.filter(b=>b.source?.provenance==='supplemental'&&/^图片描述/.test(b.zh));
        for(const b of s.blocks)if(["instruction","example","paragraph"].includes(b.kind)&&!hints.includes(b))body.append(el("p",b));
        exact.forEach((a) => body.append(activity(a)));
        if(hints.length){const details=el('details',undefined,'picture-editorial-hints');details.append(el('summary',copy('图片文字提示（含参考表达）','Gợi ý bằng chữ cho hình (có cách diễn đạt tham khảo)')));for(const hint of hints)details.append(el('p',hint));body.append(details)}
        continue;
      }
      for (const [i, b] of s.blocks.entries()) {
        if (b.kind === "question" || b.kind === "task" || /[□_＿]/.test(b.zh))
          body.append(
            manual(
              s.id + ":block" + i,
              s.title,
              b,
              b.source,
              s.kind === "review" ? "self-assessment" : "open",
            ),
          );
        else body.append(el("p", b));
        for (const [j, item] of (b.items ?? []).entries())
          body.append(
            manual(s.id + ":block" + i + ":item" + j, s.title, item, b.source),
          );
      }
      body.append(sourceNote(s.source.printedPage));
    }
    for (const a of l.activities ?? [])
      if (
        (section === "practice"
          ? /sections/.test(a.targetRef)
          : /review|self-assessment/.test(a.targetRef)) &&
        !chosen.some((s) => mapped(s.id).includes(a))
      )
        body.append(activity(a));
  }
  const next = sections[sections.findIndex(([id]) => id === section) + 1],
    foot = el("nav", undefined, "lesson-bottom");
  const complete = button(
    copy(
      reading.completed.includes(section) ? "本部分已学" : "标记本部分已学",
      reading.completed.includes(section)
        ? "Đã học mục này"
        : "Đánh dấu đã học mục này",
    ),
    async () => {
      c.edit((s) => {
        const r = s.reading[l.id]!;
        r.completed = [...new Set([...r.completed, section])];if(sections.every(([id])=>r.completed.includes(id))&&!s.completed.includes(l.id))s.completed.push(l.id);
      });
      if (await c.flush()) {
        complete.replaceChildren(
          el("span", copy("本部分已学", "Đã học mục này")),
        );
        complete.disabled = true;
      }
    },
  );
  complete.disabled = reading.completed.includes(section);
  foot.append(complete);
  if (next)
    foot.append(
      link(
        next[1],
        routeHref({ ...c.route, section: next[0], scene: undefined }),
        "primary",
      ),
    );
  else
    foot.append(
      link(
        copy("课后作业 · 30题", "Bài tập về nhà · 30 câu"),
        routeHref({ ...c.route, view: "homework" }),
        "primary",
      ),
    );
  if (l.number > 1)
    foot.append(
      link(
        copy("上一课", "Bài trước"),
        routeHref({
          view: "lesson",
          lesson: l.number - 1,
          section: "overview",
        }),
      ),
    );
  if (l.number < (c.level === 3 ? 18 : 15))
    foot.append(
      link(
        copy("下一课", "Bài tiếp"),
        routeHref({
          view: "lesson",
          lesson: l.number + 1,
          section: "overview",
        }),
      ),
    );
  foot.append(link(copy("独立听力练习","Luyện nghe độc lập"),routeHref({...c.route,view:"listening"})));
  body.append(
    foot,
    el(
      "p",
      copy(
        "“已学”是个人阅读标记，不等同于掌握度或考试成绩。",
        "“Đã học” là dấu đọc cá nhân, không đồng nghĩa với mức độ thành thạo hay điểm thi.",
      ),
      "task-note",
    ),
  );
  return () => {
    events.abort();
    extraCleanup();
    main.remove();
  };
}
function illustration(pic: Illustration,assetBase:string,signal?:AbortSignal): HTMLElement {
  const figure = el("figure", undefined, "teaching-illustration");
  figure.dataset.illustrationId = pic.id;
  if (pic.file && pic.publicationStatus === "approved") {
    const img = el("img");
    img.src = new URL(pic.file,new URL(assetBase,location.href)).href;
    img.alt = pic.alt.zh + " · " + pic.alt.vi;
    img.loading = "lazy";
    const zoom=button('',()=>{const dialog=el('dialog',undefined,'illustration-dialog'),close=button(copy('关闭大图','Đóng hình lớn'),()=>dialog.close()),large=el('img');large.src=img.src;large.alt=img.alt;dialog.setAttribute('aria-label','查看示意图 · Xem hình minh họa');dialog.append(close,large,el('p',pic.description));document.body.append(dialog);dialog.addEventListener('close',()=>{dialog.remove();if(zoom.isConnected)zoom.focus()},{once:true});signal?.addEventListener('abort',()=>dialog.remove(),{once:true});dialog.showModal();close.focus()});zoom.className='illustration-zoom';zoom.setAttribute('aria-label','放大查看示意图 · Phóng to hình minh họa');zoom.append(img,el('span',copy('放大查看','Phóng to')));figure.append(zoom);
  } else {
    const scene = el("div", undefined, "illustration-description");
    scene.setAttribute("role", "img");
    scene.setAttribute("aria-label", pic.alt.zh + " · " + pic.alt.vi);
    scene.append(el("p", pic.description));
    figure.append(scene);
  }
  figure.append(
    el(
      "figcaption",
      copy(
        "自制辅助示意图（非教材原图）",
        "Hình hỗ trợ tự thiết kế (không phải ảnh gốc)",
      ),
    ),
  );
  return figure;
}
