import { el, button, copy } from "./dom.ts";
import type { Lesson, Question, Copy } from "./types.ts";
import type { State, ListeningRound } from "./state.ts";
import { grade, isAnswered, resolveListeningDraftQuestion, captureListeningDraftAnswer,
  acknowledgeListeningDraftQuestion, type Attempt } from "./state.ts";
/** A submitted attempt can only use its own saved question; missing is unknown. */
export function listeningDisplayQuestion(current:Question,attempt:Attempt|undefined):Question|undefined {
  return attempt ? attempt.questions?.find(saved=>saved.id===current.id) : current;
}
export function mountListening(
  host: HTMLElement,
  lessons: Lesson[],
  c: {
    state(): State;
    edit(fn: (s: State) => void): void;
    flush(): Promise<boolean>;
    commit(id: string, attempt: Attempt, round: ListeningRound, signal: AbortSignal): Promise<boolean>;
    play(q: Question): Promise<boolean>;
    stop(): void;
    message(text: Copy): void;
    requireLegacyReview?: boolean;
  },
): () => void {
  const root = el("article", undefined, "listening-module");
  root.append(
    el("h1", copy("听一题，懂一句", "Nghe từng câu, hiểu từng ý")),
    el(
      "p",
      copy(
        "选择任意课程，自由练听力。提交本题后才展开原文与解析。",
        "Chọn bài tùy ý để luyện nghe. Nguyên văn và giải thích chỉ hiện sau khi nộp từng câu.",
      ),
    ),
  );
  host.append(root);
  const bank = new Map(
      lessons.flatMap((l) =>
        l.listening.map((q) => [q.id, { q, lesson: l }] as const),
      ),
    ),
    selection = new Set(
      c.state().listeningRound?.selected ?? lessons.map((l) => l.number),
    );
  const settings = el("details", undefined, "lesson-selection");
  settings.append(
    el("summary", copy("选择课程、题数与错题", "Chọn bài, số câu & câu sai")),
  );
  const choices = el("div", undefined, "lesson-choices");
  for (const l of lessons) {
    const label = el("label"),
      input = el("input");
    input.type = "checkbox";
    input.checked = selection.has(l.number);
    input.onchange = () =>
      input.checked ? selection.add(l.number) : selection.delete(l.number);
    label.append(input, el("span", `第${l.number}课 · Bài ${l.number}`));
    choices.append(label);
  }
  settings.append(choices);
  const count = el("select");
  count.setAttribute("aria-label", "题数 · Số câu");
  for (const n of [5, 10, "all"]) {
    const o = el("option", n === "all" ? "全部 · Tất cả" : `${n}题 · ${n} câu`);
    o.value = String(n);
    count.append(o);
  }
  count.value = String(c.state().listeningRound?.limit ?? 5);
  const wrong = el("input");
  wrong.type = "checkbox";
  wrong.checked = c.state().listeningRound?.wrongOnly ?? false;
  const wrongLabel = el("label", copy("只练错题", "Chỉ luyện câu sai"));
  wrongLabel.prepend(wrong);
  settings.append(count, wrongLabel);
  root.append(settings);
  let round: ListeningRound | null = c.state().listeningRound ?? null;
  let retired = false,
    playing = false,
    submitting = false,
    pending: AbortController | null = null;
  const work = el("section"),
    roundStatus = el("p");
  roundStatus.setAttribute("role", "status");
  root.append(roundStatus, work);
  const save = () => {
    const current = structuredClone(round);
    c.edit((s) => {
      s.listeningRound = current;
    });
  };
  const start = button(
    copy(
      round ? "按当前设置开始新一组" : "开始听力",
      round ? "Bắt đầu nhóm mới" : "Bắt đầu luyện nghe",
    ),
    async () => {
      if (retired || submitting) return;
      if (!selection.size) {
        c.message(copy("请至少选择一课", "Hãy chọn ít nhất một bài"));
        return;
      }
      let queue = [...bank.values()]
        .filter(
          ({ q, lesson }) =>
            selection.has(lesson.number) &&
            (!wrong.checked ||
              c.state().listening[q.id + ":individual"]?.latest?.correct === 0),
        )
        .map(({ q }) => q.id);
      for (let i = queue.length - 1; i > 0; i--) {
        const values = new Uint32Array(1);
        crypto.getRandomValues(values);
        const j = values[0]! % (i + 1);
        [queue[i], queue[j]] = [queue[j]!, queue[i]!];
      }
      if (!queue.length) {
        c.message(
          copy("这个范围还没有可练的题目", "Phạm vi này chưa có câu để luyện"),
        );
        return;
      }
      if (count.value !== "all") queue = queue.slice(0, Number(count.value));
      c.stop();
      round = {
        selected: [...selection],
        limit: count.value === "all" ? "all" : (Number(count.value) as 5 | 10),
        wrongOnly: wrong.checked,
        queue,
        index: 0,
        answers: {},
        submitted: {},
        playCounts: {},
        startedAt: Date.now(),
      };
      save();
      settings.open=false;
      draw();
      await c.flush();
    },
    "primary",
  );
  settings.append(start);
  if (!round) settings.open = true;
  function draw() {
    if (retired) return;
    work.replaceChildren();
    if (!round) {
      roundStatus.replaceChildren(
        el("span", copy("选好课程后开始", "Chọn bài rồi bắt đầu")),
      );
      return;
    }
    const id = round.queue[round.index],
      entry = id ? bank.get(id) : undefined;
    if (!entry) {
      roundStatus.replaceChildren(
        el(
          "span",
          copy(
            "这组内容已经变更，请开始新一组；历史提交仍保留。",
            "Nội dung nhóm này đã thay đổi. Hãy bắt đầu nhóm mới; bản ghi đã nộp vẫn được giữ.",
          ),
        ),
      );
      return;
    }
    const { q, lesson } = entry,
      attempt = round.submitted[id!],
      draftView = attempt ? undefined : resolveListeningDraftQuestion(q, round, c.requireLegacyReview),
      question = attempt ? listeningDisplayQuestion(q, attempt) : draftView!.question,
      draftBlocked = draftView?.status === 'missing' || draftView?.status === 'incompatible';
    roundStatus.textContent = `${round.index + 1} / ${round.queue.length} · 第${lesson.number}课 / Bài ${lesson.number} · 已提交 ${Object.keys(round.submitted).length} / ${round.queue.length}`;
    const card = el("div", undefined, "activity-card"),
      title = el("h2", question?.prompt??copy("旧听力记录", "Bản ghi nghe cũ"));
    card.dataset.questionSnapshot=attempt?(question?'saved':'missing'):'current';
    if (draftView) card.dataset.draftQuestionSnapshot = draftView.status;
    card.append(title);
    if (draftView?.status === 'missing') {
      card.append(el('p', copy(
        '旧答案没有当时的题目快照，已保留。请核对当前题目后选择继续。',
        'Đáp án cũ không có ảnh chụp câu hỏi lúc đó và vẫn được giữ. Hãy kiểm tra câu hỏi hiện tại rồi chọn tiếp tục.',
      )), button(copy('按当前题目继续', 'Tiếp tục với câu hỏi hiện tại'), async () => {
        if (retired || submitting || !round) return;
        round = acknowledgeListeningDraftQuestion(round, q);
        save();
        if (await c.flush()) draw();
      }));
    } else if (draftView?.status === 'incompatible') card.append(el('p', copy(
      '保存的题目与本版不同，原题和答案已保留供查看。请先下载备份，再开始新一组。',
      'Câu hỏi đã lưu khác với bản hiện tại. Câu hỏi và đáp án cũ vẫn được giữ để xem. Hãy tải bản sao lưu rồi bắt đầu nhóm mới.',
    )));
    if(question){
    const plays = el(
        "p",
        copy(
          `已成功播放${round.playCounts[id!] ?? 0}次`,
          `Đã phát thành công ${round.playCounts[id!] ?? 0} lần`,
        ),
      );
    const play = button(copy("播放原音", "Phát âm thanh gốc"), async () => {
      if (playing || retired || submitting || !round) return;
      playing = true;
      play.disabled = true;
      const activeRound = round,
        activeId = id!;
      const ok = await c.play(question);
      playing = false;
      if (retired) return;
      play.disabled = submitting;
      if (ok && !submitting && round === activeRound) {
        round.playCounts[activeId] = (round.playCounts[activeId] ?? 0) + 1;
        save();
        plays.replaceChildren(
          el(
            "span",
            copy(
              `已成功播放${round.playCounts[activeId]}次`,
              `Đã phát thành công ${round.playCounts[activeId]} lần`,
            ),
          ),
        );
      }
    });
    card.append(play, plays);
    const field = el("fieldset"),
      legend = el("legend", copy("选择答案", "Chọn đáp án"));
    field.append(legend);
    for (const [index, option] of (question.options ?? []).entries()) {
      const label = el("label", undefined, "choice-option"),
        radio = el("input");
      radio.type = "radio";
      radio.name = id!;
      radio.value = String(index);
      radio.checked = (attempt?attempt.answers[id!]:round.answers[id!]) === index;
      radio.disabled = !!attempt || draftBlocked;
      radio.onchange = () => {
        if (round && !submitting && !draftBlocked) {
          Object.assign(round, captureListeningDraftAnswer(round, q, index, c.requireLegacyReview));
          save();
        }
      };
      label.append(radio, el("span", option));
      field.append(label);
    }
    card.append(field);
    const displayedRound=round;
    const submit = button(
      copy("提交本题", "Nộp câu này"),
      async () => {
        if(retired||submitting||draftBlocked||round!==displayedRound||round?.submitted[id!]||submit.disabled)return;
        if (!round || !isAnswered(question, round.answers[id!])) {
          c.message(copy("请先选择答案", "Hãy chọn đáp án trước"));
          return;
        }
        const a = grade(
          [question],
          { [id!]: round.answers[id!]! },
          Date.now(),
          c.state().profile,
        );
        submitting = true;
        pending = new AbortController();
        const request = pending;
        c.stop();
        submit.disabled = true;
        field.disabled = true;
        play.disabled = true;
        start.disabled = true;
        previous.disabled = true;
        next.disabled = true;
        let saved = false;
        try { saved = await c.commit(id!, a, displayedRound, request.signal); }
        catch { saved = false; }
        submitting = false;
        if (pending === request) pending = null;
        if (retired || request.signal.aborted || round !== displayedRound) return;
        start.disabled = false;
        if (!saved) {
          submit.disabled = false;
          field.disabled = false;
          play.disabled = playing;
          previous.disabled = round.index === 0;
          next.disabled = round.index + 1 === round.queue.length;
          c.message(copy("提交未确认；答案仍保留，请重试。", "Chưa xác nhận nộp; đáp án vẫn được giữ, hãy thử lại."));
          return;
        }
        const confirmed = c.state().listeningRound;
        if (confirmed?.submitted[id!]?.id === a.id) {
          round = confirmed;
          draw();
        }
      },
      "primary",
    );
    submit.disabled = !!attempt || draftBlocked;
    card.append(submit);
    if (attempt) {
      const feedback = el("section", undefined, "activity-feedback");
      feedback.append(
        el(
          "h3",
          copy(
            attempt.correct ? "回答正确" : "再听一次，看看线索",
            attempt.correct ? "Trả lời đúng" : "Nghe lại và xem gợi ý",
          ),
        ),
        el(
          "p",
          copy(
            "正确答案：" +
              (question.options?.[question.answer as number] ?? ""),
            "Đáp án: " + (question.options?.[question.answer as number] ?? ""),
          ),
        ),
      );
      if (question.explanation) feedback.append(el("p", question.explanation));
      card.append(feedback);
    }
    }else if(attempt){
      const missing=el('section',undefined,'activity-feedback');
      missing.dataset.missingQuestionSnapshot='true';
      missing.append(el('p',copy('旧记录没有当时题目快照，保留原始作答值','Bản ghi cũ không có ảnh chụp câu hỏi; giữ giá trị trả lời gốc')),
        el('p',`${id}: ${JSON.stringify(attempt.answers[id!])}`,'submitted-answer'),
        el('p',attempt.assessment==='manual'?copy('原记录等待老师查看；不重新评分','Bản ghi chờ giáo viên xem; không chấm lại'):
          copy(`原记录成绩：${attempt.correct}/${attempt.total}；不重新评分`,`Điểm đã lưu: ${attempt.correct}/${attempt.total}; không chấm lại`)));
      card.append(missing);
    }
    if(attempt){
      const text=lesson.texts.find(t=>t.audioTrack===(question?.audioTrack??q.audioTrack));
      if(text){
        const reference=el('section',undefined,'current-listening-reference');reference.dataset.currentTranscriptReference='true';
        reference.append(el('h3',copy('当前课文参考（不是历史题目快照）','Tham khảo bài khóa hiện tại (không phải ảnh chụp câu hỏi cũ)')));
        for(const line of text.lines)reference.append(el('p',line.zh,'chinese-line'),el('p',line.vi));
        card.append(reference);
      }
    }
    const pager = el("nav", undefined, "mixed-pager");
    const previous = button(copy("上一题", "Câu trước"), () => {
        if (!submitting && round && round.index > 0) {
          c.stop();
          round.index--;
          save();
          draw();
        }
      }),
      next = button(copy("下一题", "Câu tiếp"), () => {
        if (!submitting && round && round.index + 1 < round.queue.length) {
          c.stop();
          round.index++;
          save();
          draw();
        }
      });
    previous.disabled = round.index === 0;
    next.disabled = round.index + 1 === round.queue.length;
    pager.append(previous, next);
    work.append(card, pager);
    if (Object.keys(round.submitted).length === round.queue.length)
      work.append(
        el(
          "p",
          copy(
            `本组完成 · ${Object.values(round.submitted).reduce((n, a) => n + (a.correct ?? 0), 0)}/${round.queue.length}`,
            `Đã hoàn thành nhóm · ${Object.values(round.submitted).reduce((n, a) => n + (a.correct ?? 0), 0)}/${round.queue.length}`,
          ),
        ),
      );
  }
  draw();
  return () => {
    retired = true;
    pending?.abort();
    c.stop();
    root.remove();
  };
}
