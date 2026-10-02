import type { FeatureModule, Route } from '../../app/contracts.ts';
import { normalizeRoute } from '../../app/router.ts';
import { routeLink, element, button } from '../textbook/dom.ts';
import { loadExercises, exerciseAudio } from '../../services/content/exercises.ts';
import { exerciseGroupLabels, exerciseSetLabels } from '../../domain/exercises/catalogue.ts';
import type { ExerciseFilter, ExerciseGroup, ExerciseSet } from '../../domain/exercises/catalogue.ts';
import { answerExercise, exerciseQueue, exerciseReview, exerciseScope, exerciseTotals, isSubmitted, restartExercise, submitExercise } from '../../domain/exercises/engine.ts';
import { AUDIO_RATES } from '../../services/audio/index.ts';
import './exercises.css';

export const mount: FeatureModule['mount'] = (host, context) => {
  const root = element('article'); root.className = 'module-entry exercises'; root.id = 'exercises-module';
  const heading = element('h1', 'Bài tập gốc & ôn câu'); heading.tabIndex = -1;
  const loading = element('p', 'Đang mở bài tập…'); root.append(heading, loading); host.append(root);
  const lifetime = new AbortController(); const close = () => lifetime.abort();
  context.signal.addEventListener('abort', close, { once: true }); if (context.signal.aborted) close();
  let left = false, disposeDraft = () => {}, disposeStore = () => {}, disposeAudio = () => {}, flush = () => {}, stopAudio = () => {}, collect = () => false;
  let viewLifetime: AbortController | undefined;
  let isComposing = () => false;
  const ready = Promise.resolve().then(async () => {
    if (!context.learning || !context.audio) throw new Error('Learning services unavailable.');
    const [catalogue, session, audio] = await Promise.all([loadExercises(lifetime.signal), context.learning(), context.audio()]);
    if (left || lifetime.signal.aborted) return;
    loading.remove(); flush = () => { void session.flush(); }; stopAudio = () => audio.stop();
    const set: ExerciseSet = context.route.exerciseSet ?? 'original';
    const group: ExerciseGroup = context.route.exerciseGroup ?? (set === 'pilot' ? 'words' : 'choice');
    const filter: ExerciseFilter = context.route.exerciseFilter ?? (set === 'homework-review' ? 'wrong' : 'all');
    const lesson = set === 'pilot' ? 9 : context.route.lesson;
    const route = (changes: Partial<Route>): Route => ({ feature: 'exercises', lesson, exerciseSet: set, exerciseGroup: group, exerciseFilter: filter, ...changes });
    const state = () => session.store.snapshot().data.exercises;
    const edit = (action: (draft: ReturnType<typeof state>) => void) => { session.store.edit(data => action(data.exercises)); session.requestSave(); };
    const visitedRoute = normalizeRoute(context.route);
    if (JSON.stringify(session.store.snapshot().data.navigation) !== JSON.stringify(visitedRoute)) { session.store.edit(data => { data.navigation = visitedRoute; }); session.requestSave(); }
    const snapshot = session.store.snapshot().data;
    let queue = exerciseQueue(catalogue, snapshot.exercises, { set, lesson, group, filter, homework: snapshot.homework });
    const scope = exerciseScope({ set, lesson, group }, filter);
    let position = Math.max(0, queue.findIndex(entry => entry.id === state().positions[scope]));
    const allEntries = catalogue.entries.filter(entry => entry.set === set && entry.lesson === lesson && entry.group === group);
    root.append(element('p', set === 'homework-review' ? 'Luyện từng câu sai hoặc đến hạn. Các lượt ôn không thay đổi điểm lần đầu của bài tập đã nộp.' : 'Chọn bài và dạng luyện, rồi trả lời từng câu. Bạn có thể tự do chuyển câu hoặc quay lại câu đang làm.'));
    const sets = element('nav'); sets.setAttribute('aria-label', 'Bộ bài tập'); sets.className = 'exercise-tabs';
    for (const next of ['original', 'pilot', 'homework-review'] as const) {
      const link = routeLink(exerciseSetLabels[next], route({ exerciseSet: next, exerciseGroup: undefined, exerciseFilter: undefined, lesson: next === 'pilot' ? 9 : lesson }));
      if (next === set) link.setAttribute('aria-current', 'page'); sets.append(link);
    }
    const settings = element('div'); settings.className = 'exercise-settings';
    const lessonLabel = element('label', 'Bài học '); const selectLesson = element('select'); selectLesson.setAttribute('aria-label', 'Bài học của bài tập gốc');
    for (let id = 1; id <= 15; id++) { const option = element('option', `Bài ${id}`); option.value = String(id); option.disabled = set === 'pilot' && id !== 9; selectLesson.append(option); }
    selectLesson.value = String(lesson); selectLesson.disabled = set === 'pilot'; lessonLabel.append(selectLesson);
    selectLesson.addEventListener('change', () => { if (collect()) { selectLesson.value = String(lesson); return; } context.navigate(route({ lesson: Number(selectLesson.value) })); }, { signal: lifetime.signal });
    const filterLabel = element('label', 'Câu cần luyện '); const selectFilter = element('select'); selectFilter.id = 'exercise-filter';
    for (const [value, label] of [['all', 'Tất cả câu'], ['wrong', 'Câu gần nhất còn sai'], ['due', 'Câu đã đến hạn']] as const) { const option = element('option', label); option.value = value; selectFilter.append(option); }
    selectFilter.value = filter; filterLabel.append(selectFilter); selectFilter.addEventListener('change', () => { if (collect()) { selectFilter.value = filter; return; } context.navigate(route({ exerciseFilter: selectFilter.value as ExerciseFilter })); }, { signal: lifetime.signal });
    settings.append(lessonLabel, filterLabel);
    const groups = element('nav'); groups.className = 'exercise-tabs'; groups.setAttribute('aria-label', 'Nhóm bài tập');
    for (const next of [...new Set(catalogue.entries.filter(e => e.set === set && e.lesson === lesson).map(e => e.group))]) {
      const label = next === 'translation' ? set === 'original' ? 'Dịch lựa chọn · tự chấm' : 'Dịch tự viết · giáo viên xem' : exerciseGroupLabels[next];
      const link = routeLink(label, route({ exerciseGroup: next })); if (next === group) link.setAttribute('aria-current', 'page'); groups.append(link);
    }
    const summary = element('p'); summary.id = 'exercise-summary';
    const save = element('p'); save.id = 'exercise-save-status'; save.setAttribute('role', 'status');
    const retrySave = button('Thử lưu lại', () => { void session.flush(); }, lifetime.signal); retrySave.id = 'exercise-save-retry';
    const saveActions = element('div'); saveActions.append(retrySave, routeLink('Dữ liệu và sao lưu', { feature: 'progress', lesson }));
    const message = element('p'); message.id = 'exercise-message'; message.setAttribute('role', 'status');
    const questionHost = element('section'); questionHost.className = 'exercise-question';
    const navigator = element('nav'); navigator.className = 'exercise-navigator'; navigator.setAttribute('aria-label', 'Chọn câu');
    const refresh = button('Cập nhật danh sách câu', () => { if (collect()) return; audio.stop(); queue = exerciseQueue(catalogue, state(), { set, lesson, group, filter, homework: session.store.snapshot().data.homework }); position = 0; render(); }, lifetime.signal);
    if (group === 'translation') {
      const writing = element('nav'); writing.className = 'study-paths';
      writing.append(routeLink('Lựa chọn · 翻译选择', { feature: 'exercises', lesson, exerciseSet: 'original', exerciseGroup: 'translation' }), routeLink('Tự viết · 翻译书写', { feature: 'homework', lesson, part: 'translation' }));
      root.append(writing);
    }
    root.append(sets, settings, groups, summary, save, saveActions, message, navigator, questionHost, refresh);
    root.addEventListener('click', event => { if ((event.target as Element).closest('a[data-route-link]') && collect()) { event.preventDefault(); event.stopPropagation(); } }, { capture: true, signal: lifetime.signal });
    if (set === 'pilot') for (const activity of catalogue.oral) {
      const speaking = element('details'); speaking.className = 'exercise-oral'; speaking.append(element('summary', 'Luyện nói mở rộng · không tính trong 30 câu'), element('h2', activity.title), element('p', activity.prompt));
      activity.stems.forEach(stem => { const line = element('p', stem); line.lang = 'zh-CN'; speaking.append(line); }); speaking.append(element('p', activity.note)); root.append(speaking);
    }
    function updateStatus() {
      const current = session.store.snapshot(); const totals = exerciseTotals(catalogue, current.data.exercises, allEntries);
      summary.textContent = totals.manual ? `Đã lưu bài viết: ${totals.manualSubmitted}/${totals.manual} · giáo viên xem, không tự chấm điểm` : `Đã nộp: ${totals.submitted}/${totals.automatic} · Đúng lần đầu: ${totals.firstCorrect} · Đúng gần nhất: ${totals.latestCorrect}`;
      const labels = { saved: 'Đã lưu trên thiết bị này', empty: 'Chưa có thay đổi cần lưu', saving: 'Đang lưu…', unsaved: 'Chưa lưu xong', conflict: 'Có thay đổi ở tab khác', corrupt: 'Dữ liệu gốc không đọc được', unavailable: 'Chưa thể lưu trên thiết bị này' };
      save.textContent = current.issue ?? labels[current.status]; retrySave.hidden = !['unsaved', 'conflict', 'unavailable'].includes(current.status);
    }
    disposeStore = session.store.subscribe(updateStatus); updateStatus();
    function move(index: number) { if (collect()) return; audio.stop(); position = index; const entry = queue[position]; if (entry) edit(draft => { draft.positions[scope] = entry.id; }); render(); }
    function showWritingSheet() {
      if (collect()) return;
      const data = session.store.snapshot().data; const sheet = element('section'); sheet.className = 'exercise-writing-sheet'; sheet.id = 'exercise-writing-sheet'; sheet.tabIndex = -1;
      const title = `Phiếu bài viết · Bài ${lesson} · ${exerciseSetLabels[set]}`;
      const lines = [title, `Họ tên: ${data.homework.profile.name || 'Chưa điền'} · Lớp: ${data.homework.profile.className || 'Chưa điền'}`, 'Bài tự viết để giáo viên xem; không có điểm tự động.'];
      sheet.append(element('h2', title), element('p', lines[1]), element('p', lines[2]));
      allEntries.forEach((entry, index) => {
        const task = catalogue.tasks.get(entry.authorityId)!; const latest = data.exercises.records[task.id]?.submissions.at(-1); const draft = data.exercises.drafts[task.id];
        const answer = typeof draft === 'string' ? draft : typeof latest?.answer === 'string' ? latest.answer : '';
        const status = typeof draft === 'string' ? 'Bản nháp chưa nộp' : latest ? 'Đã lưu bài viết' : 'Chưa viết';
        lines.push(`${index + 1}. ${entry.prompt ?? task.prompt}`, `${status}: ${answer || '(chưa có câu trả lời)'}`);
        sheet.append(element('h3', `${index + 1}. ${entry.prompt ?? task.prompt}`), element('p', status)); const text = element('p', answer || '(chưa có câu trả lời)'); text.lang = 'zh-CN'; text.className = 'exercise-written-answer'; sheet.append(text);
      });
      const controls = element('div'); controls.className = 'exercise-sheet-controls';
      controls.append(button('Sao chép bài viết', () => { void navigatorClipboard(lines.join('\n\n')); }, lifetime.signal), button('In / lưu PDF', () => window.print(), lifetime.signal), button('Đóng phiếu', () => { sheet.remove(); questionHost.hidden = false; questionHost.querySelector<HTMLElement>('h2')?.focus(); }, lifetime.signal));
      sheet.prepend(controls); root.querySelector('#exercise-writing-sheet')?.remove(); root.append(sheet); questionHost.hidden = true; sheet.focus();
    }
    async function navigatorClipboard(text: string) { try { await window.navigator.clipboard.writeText(text); message.textContent = 'Đã sao chép bài viết. Bạn có thể gửi cho giáo viên.'; } catch { message.textContent = 'Trình duyệt chưa cho sao chép. Bạn có thể chọn nội dung phiếu hoặc chụp màn hình.'; } }
    function render() {
      collect = () => false; isComposing = () => false; viewLifetime?.abort(); viewLifetime = new AbortController();
      const signal = viewLifetime.signal;
      disposeAudio(); disposeAudio = () => {};
      questionHost.replaceChildren(); questionHost.hidden = false; navigator.replaceChildren(); root.querySelector('#exercise-writing-sheet')?.remove();
      const entry = queue[position];
      if (!entry) { questionHost.append(element('h2', filter === 'all' ? 'Không có câu trong nhóm này' : 'Chưa có câu phù hợp'), element('p', filter === 'all' ? 'Chọn một nhóm bài tập khác.' : 'Câu sai và câu đến hạn chỉ dựa trên bài đã nộp. Bài tự viết không vào danh sách tự chấm.')); return; }
      const task = catalogue.tasks.get(entry.authorityId)!;
      const current = state(), submitted = isSubmitted(current, task.id), latest = current.records[task.id]?.submissions.at(-1);
      const answer = submitted ? latest?.answer : current.drafts[task.id];
      queue.forEach((item, index) => { const jump = button(String(index + 1), () => move(index), signal); jump.setAttribute('aria-label', `Mở câu ${index + 1}`); if (index === position) jump.setAttribute('aria-current', 'step'); jump.dataset.exerciseEntry = item.id; navigator.append(jump); });
      const title = element('h2', `Câu ${position + 1}/${queue.length} · ${exerciseGroupLabels[group]}`); title.dataset.oldQuestionId = entry.oldId; questionHost.dataset.exerciseEntry = entry.id; title.tabIndex = -1; questionHost.append(title);
      if (entry.passageId) { const passage = catalogue.passages[entry.passageId]!; const block = element('section'); block.className = 'exercise-passage'; block.append(element('h3', 'Đọc toàn bộ đoạn hội thoại trước khi trả lời')); for (const line of passage.lines) { const p = element('p', line); p.lang = 'zh-CN'; block.append(p); } questionHost.append(block); }
      questionHost.append(element('p', entry.prompt ?? task.prompt));
      if (entry.stem ?? task.stem) { const stem = element('p', entry.stem ?? task.stem); stem.className = 'exercise-hanzi'; questionHost.append(stem); }
      if (entry.meaning ?? task.meaning) questionHost.append(element('p', entry.meaning ?? task.meaning));
      const source = entry.source; questionHost.append(element('p', source.page ? `Nguồn: ${source.book ?? 'Giáo trình'}, tr. ${source.page} · PDF ${source.pdfPage}` : source.label ? `Nguồn: ${source.label}` : `Nguồn: ngân hàng bài tập gốc · Bài ${lesson}`));
      if (task.kind === 'choice' && task.audio) {
        const player = element('div'); player.className = 'exercise-player'; const audioStatus = element('p'); audioStatus.setAttribute('role', 'status');
        const playCurrent = () => { const request = exerciseAudio(catalogue, task.id); if (request) void audio.play(request, { signal }).then(result => { if (!signal.aborted && !result.ok && result.code !== 'cancelled') message.textContent = result.issue ?? 'Chưa phát được âm thanh. Hãy thử lại.'; }); };
        const play = button('Nghe audio gốc', playCurrent, signal);
        const rate = element('select'); rate.setAttribute('aria-label', 'Tốc độ nghe'); AUDIO_RATES.forEach(value => { const option = element('option', `${value}×`); option.value = String(value); rate.append(option); }); rate.value = String(audio.snapshot().rate); rate.addEventListener('change', () => audio.setRate(Number(rate.value)), { signal });
        player.append(play, button('Tạm dừng', () => audio.pause(), signal), button('Tiếp tục', () => { const current = audio.snapshot().request; const request = exerciseAudio(catalogue, task.id); if (audio.snapshot().status === 'paused' && current?.url === request?.url && current?.start === request?.start && current?.end === request?.end) void audio.resume(); else playCurrent(); }, signal), button('Nghe lại', playCurrent, signal), rate, audioStatus); questionHost.append(player);
        const updateAudio = () => { const snap = audio.snapshot(); audioStatus.textContent = snap.issue ?? ({ idle: 'Sẵn sàng nghe', loading: 'Đang tải…', playing: 'Đang phát', paused: 'Đã tạm dừng', ended: 'Đã nghe hết', error: 'Chưa phát được' })[snap.status]; }; disposeAudio = audio.subscribe(updateAudio); updateAudio();
      }
      if (task.kind === 'choice') {
        const choices = element('fieldset'); choices.append(element('legend', 'Chọn một đáp án')); choices.disabled = submitted;
        for (const index of entry.optionOrder ?? task.options.map((_, index) => index)) {
          const label = element('label'); const input = element('input'); input.type = 'radio'; input.name = 'exercise-answer'; input.value = String(index); input.checked = answer === index;
          input.addEventListener('change', () => edit(draft => { answerExercise(draft, task, index); }), { signal }); label.append(input, document.createTextNode(task.options[index]!)); choices.append(label);
        } questionHost.append(choices);
      } else if (task.kind === 'sort') {
        const selected = Array.isArray(answer) ? answer : []; const chosen = element('div'); chosen.className = 'exercise-tokens'; chosen.setAttribute('aria-label', 'Câu đã xếp');
        const available = element('div'); available.className = 'exercise-tokens'; available.setAttribute('aria-label', 'Từ chưa dùng');
        const update = (next: number[]) => { edit(draft => { answerExercise(draft, task, next); }); render(); };
        selected.forEach((index, selectedIndex) => { const token = button(task.tokens[index]!, () => update(selected.filter((_, i) => i !== selectedIndex)), signal); token.disabled = submitted; chosen.append(token); });
        for (const index of entry.tokenOrder ?? task.tokens.map((_, i) => i)) if (!selected.includes(index)) { const token = button(task.tokens[index]!, () => update([...selected, index]), signal); token.disabled = submitted; available.append(token); }
        questionHost.append(element('p', 'Chạm từ để thêm vào câu; chạm từ đã chọn để trả lại.'), chosen, available);
      } else {
        const label = element('label', 'Viết câu tiếng Trung'); const input = element('textarea'); input.id = 'exercise-writing'; input.lang = 'zh-CN'; input.maxLength = 4000; input.rows = 5; input.disabled = submitted; input.value = typeof answer === 'string' ? answer : ''; label.htmlFor = input.id; label.append(input); questionHost.append(label, element('p', 'Bài tự viết được lưu để giáo viên xem. Không hiện đáp án mẫu và không tự chấm đúng/sai.'));
        let composing = false; isComposing = () => composing;
        collect = () => { if (submitted) return false; if (input.value.length > 4000) { message.textContent = 'Bài viết vượt 4.000 ký tự; hãy rút ngắn trước khi rời câu.'; return true; } if ((state().drafts[task.id] ?? '') !== input.value) edit(draft => { answerExercise(draft, task, input.value); }); return false; };
        input.addEventListener('compositionstart', () => { composing = true; input.removeAttribute('maxlength'); }, { signal }); input.addEventListener('compositionend', () => { composing = false; input.maxLength = 4000; collect(); }, { signal }); input.addEventListener('input', () => { if (!composing) collect(); }, { signal });
        questionHost.append(button('Xem phiếu / chụp màn hình', showWritingSheet, signal));
      }
      const feedback = element('div'); feedback.id = 'exercise-feedback'; feedback.setAttribute('role', 'status');
      if (submitted && latest) {
        feedback.append(element('h3', latest.correct === null ? 'Đã lưu bài viết · chờ giáo viên xem' : latest.correct ? 'Đúng' : 'Chưa đúng'));
        if (task.kind !== 'manual') {
          feedback.append(element('p', entry.explanation ?? task.explanation));
          feedback.append(element('p', `Đáp án: ${task.kind === 'choice' ? task.options[task.answer] : task.answers.join(' / ')}`));
          if (task.kind === 'choice' && task.transcript) { const transcript = element('p', task.transcript); transcript.lang = 'zh-CN'; feedback.append(transcript, element('p', task.pinyin)); }
          const review = exerciseReview(state(), task, session.store.snapshot().data.homework); if (review?.dueAt) feedback.append(element('p', `Ôn tiếp: ${new Date(review.dueAt).toLocaleString('vi-VN')}`));
        }
      }
      const submit = button(submitted ? 'Làm lại câu này' : task.kind === 'manual' ? 'Lưu bài viết để giáo viên xem' : 'Nộp câu', () => {
        if (isComposing()) { message.textContent = 'Hãy hoàn tất nhập chữ rồi nộp bài.'; return; }
        if (collect()) return;
        try { if (isSubmitted(state(), task.id)) { edit(draft => { restartExercise(draft, task); }); message.textContent = 'Đã mở lượt mới. Kết quả lần đầu vẫn được giữ.'; }
          else { const at = Date.now(), homeworkAtReview = session.store.snapshot().data.homework; if (!submitExercise(state(), task, at, homeworkAtReview)) { message.textContent = 'Hãy trả lời đầy đủ trước khi nộp.'; return; } edit(draft => { submitExercise(draft, task, at, homeworkAtReview); }); message.textContent = task.assessment === 'manual' ? 'Đã lưu bài viết; chưa có điểm tự động.' : 'Đã ghi kết quả của câu này.'; }
          render();
        } catch (error) { message.textContent = error instanceof Error ? error.message : 'Chưa lưu được câu trả lời.'; }
      }, signal); submit.id = 'exercise-submit';
      const previous = button('Câu trước', () => move(position - 1), signal); previous.disabled = position === 0;
      const next = button('Câu sau', () => move(position + 1), signal); next.disabled = position === queue.length - 1;
      const actions = element('div'); actions.className = 'exercise-actions'; actions.append(previous, submit, next); questionHost.append(feedback, actions);
    }
    disposeDraft = session.registerExitDraft(() => collect()); render();
  }).catch(error => { if (!left && !lifetime.signal.aborted) { loading.textContent = 'Chưa mở được bài tập. Hãy thử tải lại trang.'; throw error; } });
  return { ready, unmount() { if (left) return; collect(); left = true; stopAudio(); viewLifetime?.abort(); lifetime.abort(); disposeDraft(); disposeStore(); disposeAudio(); flush(); context.signal.removeEventListener('abort', close); root.remove(); } };
};
