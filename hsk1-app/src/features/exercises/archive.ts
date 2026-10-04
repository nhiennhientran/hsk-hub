import type { FeatureModule } from '../../app/contracts.ts';
import { normalizeRoute } from '../../app/router.ts';
import { bilingualNode, bilingualText, setBilingual, type BilingualCopy } from '../../app/bilingual.ts';
import { exerciseGroups, exerciseSaveStates, exerciseIssue } from '../../app/i18n/exercises.ts';
import type { Answer } from '../../domain/types.ts';
import type { ExerciseCatalogue, ExerciseTask } from '../../domain/exercises/catalogue.ts';
import { loadExercises } from '../../services/content/exercises.ts';
import { element, routeLink } from '../textbook/dom.ts';
import { archivedAnswerText, archivedExercises, type ArchivedExercise, type ArchivedTimeline, type ArchivedSubmission } from './archive-data.ts';
import './archive.css';

const pair = (zh: string, vi: string): BilingualCopy => ({ zh, vi });
const copy = {
  title: pair('旧练习记录', 'Lịch sử bài tập cũ'),
  loading: pair('正在读取已有记录…', 'Đang đọc lịch sử đã lưu…'),
  failed: pair('暂时无法读取记录，请重试；原数据不会被覆盖', 'Chưa đọc được lịch sử. Hãy thử lại; dữ liệu gốc không bị ghi đè.'),
  retired: pair('综合练习已并入每课作业', 'Bài luyện tổng hợp đã gộp vào bài tập từng bài'),
  homework: pair('打开本课作业', 'Mở bài tập của bài này'),
  structure: pair('每课30题：25题自动评分 + 5题书写由教师批阅', 'Mỗi bài 30 câu: 25 câu tự chấm + 5 câu tự viết do giáo viên xem'),
  readonly: pair('此处仅查看已有提交和草稿，不能新增作答、重做或评分。原记录不计入新版30题成绩。', 'Trang này chỉ xem bài đã nộp và bản nháp; không làm mới, làm lại hay chấm điểm. Lịch sử cũ không tính vào điểm bộ 30 câu mới.'),
  empty: pair('此范围没有已保存的答题记录或草稿', 'Phạm vi này chưa có lịch sử trả lời hoặc bản nháp đã lưu'),
  emptyHint: pair('请前往本课作业开始学习；未作答的旧题不会在这里展开。', 'Hãy mở bài tập của bài này để bắt đầu học; các câu cũ chưa làm không hiển thị tại đây.'),
  filters: pair('旧错题／到期链接现用于查看本范围的已有记录，不再生成练习队列。', 'Liên kết câu sai / đến hạn cũ nay chỉ mở lịch sử đã lưu trong phạm vi này; không tạo lượt luyện mới.'),
  backup: pair('数据与备份', 'Dữ liệu và sao lưu'),
  sequence: pair('首次和最近按保存的提交顺序显示；时间原样保留（UTC），不按时钟重新排序。', 'Lần đầu và gần nhất theo thứ tự nộp đã lưu; giữ nguyên thời gian (UTC), không sắp xếp lại theo đồng hồ.'),
  exerciseSource: pair('旧练习提交记录', 'Lịch sử nộp bài luyện cũ'),
  homeworkSource: pair('原作业提交记录', 'Lịch sử nộp bài tập gốc'),
  retained: pair('这里展示已保留的历史条目；原作业历史可能只保留最近若干次，首次记录单独保留。', 'Đây là các lượt còn được lưu; lịch sử bài tập gốc có thể chỉ giữ các lượt gần đây, còn lần đầu được giữ riêng.'),
  first: pair('首次提交', 'Lần nộp đầu tiên'),
  latest: pair('最近提交', 'Lần nộp gần nhất'),
  firstLatest: pair('首次／最近提交', 'Lần nộp đầu tiên / gần nhất'),
  answer: pair('已保存的作答', 'Câu trả lời đã lưu'),
  draft: pair('未提交的草稿 · 只读', 'Bản nháp chưa nộp · chỉ xem'),
  draftDate: pair('草稿未保存提交日期，不计为已提交或已评分。', 'Bản nháp không có ngày nộp đã lưu; không tính là đã nộp hay đã chấm.'),
  emptyAnswer: pair('（保存的作答为空）', '(Câu trả lời đã lưu đang trống)'),
  manual: pair('原记录：书写已提交，供教师批阅；无自动分数', 'Bản lưu: bài viết đã nộp để giáo viên xem; không có điểm tự động'),
  correct: pair('原记录：正确', 'Bản lưu: đúng'),
  incorrect: pair('原记录：未答对', 'Bản lưu: chưa đúng'),
  raw: pair('原始答案值与稳定编号', 'Giá trị trả lời gốc và mã cố định'),
  choices: pair('原题选项', 'Các lựa chọn của câu cũ'),
  tokens: pair('原题词语', 'Các từ của câu cũ'),
  passage: pair('原题阅读材料', 'Đoạn đọc của câu cũ'),
};

const node = <K extends keyof HTMLElementTagNameMap>(tag: K, text: BilingualCopy) => {
  const value = bilingualNode(tag, text); value.classList.add('bilingual-stacked'); return value;
};

function answerBlock(task: ExerciseTask, answer: Answer): HTMLElement {
  const block = element('div'); block.className = 'archive-answer';
  block.append(node('p', copy.answer));
  const text = archivedAnswerText(task, answer);
  const written = text ? element('p', text) : node('p', copy.emptyAnswer);
  written.classList.add('archive-answer-text'); if (task.kind === 'manual' || task.kind === 'sort') written.lang = 'zh-CN';
  block.append(written);
  const raw = element('details'); raw.className = 'archive-raw'; raw.append(node('summary', copy.raw));
  raw.append(element('p', task.id), element('pre', JSON.stringify(answer)));
  block.append(raw); return block;
}

function submissionBlock(task: ExerciseTask, saved: ArchivedSubmission, label: BilingualCopy): HTMLElement {
  const block = element('section'); block.className = 'archive-submission'; block.dataset.result = saved.correct === null ? 'manual' : saved.correct ? 'correct' : 'incorrect';
  block.append(node('h4', label));
  if (saved.displayTask) {
    const display = element('div'); display.className = 'archive-saved-display'; display.dataset.displayBinding = saved.displayBindingId ?? '';
    display.append(node('p', pair('提交时显示的文案', 'Nội dung hiển thị khi nộp')), element('p', saved.displayTask.prompt));
    if (saved.displayTask.meaning) display.append(element('p', saved.displayTask.meaning));
    if (saved.displayTask.kind === 'choice') { const options = element('ol'); saved.displayTask.options.forEach(text => options.append(element('li', text))); display.append(options); }
    block.append(display);
  }
  const time = element('time', new Date(saved.at).toISOString()); time.dateTime = new Date(saved.at).toISOString(); block.append(time);
  block.append(node('p', saved.correct === null ? copy.manual : saved.correct ? copy.correct : copy.incorrect), answerBlock(saved.displayTask ?? task, saved.answer));
  return block;
}

function timelineBlock(task: ExerciseTask, timeline: ArchivedTimeline, signal: AbortSignal): HTMLElement {
  const block = element('section'); block.className = 'archive-timeline'; block.dataset.archiveSource = timeline.source;
  block.append(node('h3', timeline.source === 'homework' ? copy.homeworkSource : copy.exerciseSource));
  if (timeline.first) block.append(submissionBlock(task, timeline.first, timeline.source === 'exercises' && timeline.submissions.length === 1 ? copy.firstLatest : copy.first));
  if (timeline.latest && (timeline.source === 'homework' || timeline.submissions.length > 1)) block.append(submissionBlock(task, timeline.latest, copy.latest));
  if (Object.hasOwn(timeline, 'draft')) {
    const draft = element('section'); draft.className = 'archive-draft'; draft.append(node('h4', copy.draft), node('p', copy.draftDate), answerBlock(timeline.displayDraftTask ?? task, timeline.draft!)); block.append(draft);
  }
  if (timeline.submissions.length) {
    const history = element('details'); history.className = 'archive-history';
    history.append(node('summary', pair(`查看全部已保留提交（${timeline.submissions.length}次）`, `Xem tất cả lượt nộp còn lưu (${timeline.submissions.length} lượt)`)));
    if (timeline.source === 'homework') history.append(node('p', copy.retained));
    // Keep long historical records inexpensive until requested; opening only changes DOM.
    let rendered = false;
    history.addEventListener('toggle', () => {
      if (!history.open || rendered) return; rendered = true;
      timeline.submissions.forEach((saved, index) => history.append(submissionBlock(task, saved, pair(`已保留提交 ${index + 1}`, `Lượt nộp còn lưu ${index + 1}`))));
    }, { signal });
    block.append(history);
  }
  return block;
}

function questionBlock(record: ArchivedExercise, catalogue: ExerciseCatalogue, index: number, signal: AbortSignal): HTMLElement {
  const { entry, task } = record;
  const block = element('section'); block.className = 'archive-question'; block.dataset.exerciseEntry = entry.id;
  block.append(node('h2', pair(`记录 ${index + 1} · ${entry.oldId}`, `Lịch sử ${index + 1} · ${entry.oldId}`)));
  const identity = element('p', `${entry.id} · ${entry.authorityId}`); identity.className = 'archive-identity'; block.append(identity);
  const prompt = element('p', entry.prompt ?? task.prompt); prompt.className = 'archive-prompt'; block.append(prompt);
  if (entry.stem ?? task.stem) { const stem = element('p', entry.stem ?? task.stem); stem.lang = 'zh-CN'; block.append(stem); }
  if (entry.meaning ?? task.meaning) block.append(element('p', entry.meaning ?? task.meaning));
  if (entry.passageId) {
    const passage = catalogue.passages[entry.passageId];
    if (passage) { const details = element('details'); details.className = 'archive-passage'; details.append(node('summary', copy.passage)); passage.lines.forEach(line => { const p = element('p', line); p.lang = 'zh-CN'; details.append(p); }); block.append(details); }
  }
  if (task.kind !== 'manual') {
    const details = element('details'); details.className = 'archive-original-content'; details.append(node('summary', task.kind === 'choice' ? copy.choices : copy.tokens));
    const items = element('ol');
    const texts = task.kind === 'choice' ? task.options : task.tokens;
    const order = (task.kind === 'choice' ? entry.optionOrder : entry.tokenOrder) ?? texts.map((_, i) => i);
    order.forEach(i => items.append(element('li', texts[i]!))); details.append(items); block.append(details);
  }
  record.timelines.forEach(timeline => block.append(timelineBlock(task, timeline, signal)));
  return block;
}

/** Retired student routes. The maintenance exercise UI and engines remain intact. */
export const mount: FeatureModule['mount'] = (host, context) => {
  const root = element('article'); root.id = 'exercises-module'; root.className = 'module-entry exercise-archive';
  const heading = node('h1', copy.title); heading.tabIndex = -1;
  const loading = node('p', copy.loading); root.append(heading, loading); host.append(root);
  const lifetime = new AbortController(); const close = () => lifetime.abort();
  context.signal.addEventListener('abort', close, { once: true }); if (context.signal.aborted) close();
  let left = false, unsubscribe = () => {}, viewLifetime: AbortController | undefined;
  const ready = Promise.resolve().then(async () => {
    if (!context.learning) throw new Error('Learning services unavailable.');
    const [catalogue, session] = await Promise.all([loadExercises(lifetime.signal), context.learning()]);
    if (left || lifetime.signal.aborted) return;
    loading.remove();
    const route = normalizeRoute({ ...context.route, feature: 'exercises' });
    const setLabel = route.exerciseSet === 'pilot' ? pair('第9课旧拓展', 'Bài mở rộng cũ của bài 9') : route.exerciseSet === 'homework-review' ? pair('原作业复习记录', 'Lịch sử ôn bài tập gốc') : pair('旧综合练习', 'Bài luyện tổng hợp cũ');
    const group = exerciseGroups[route.exerciseGroup!];
    const scope = node('p', pair(`第${route.lesson}课 · ${setLabel.zh} · ${group.zh}`, `Bài ${route.lesson} · ${setLabel.vi} · ${group.vi}`)); scope.id = 'exercise-archive-scope';
    const intro = element('section'); intro.className = 'archive-introduction'; intro.append(node('h2', copy.retired), node('p', copy.structure), node('p', copy.readonly));
    const links = element('nav'); links.className = 'archive-links'; links.setAttribute('aria-label', bilingualText(pair('学习与备份', 'Học và sao lưu')));
    const part = route.exerciseGroup === 'translation' ? (route.exerciseSet === 'original' ? 'translationChoice' : 'translation') : route.exerciseGroup === 'sort' || route.exerciseGroup === 'ordering' ? 'sort' : 'choice';
    const homework = routeLink(copy.homework, { feature: 'homework', lesson: route.lesson, part, homeworkVersion: '30-v1' }); homework.id = 'archive-homework-link'; homework.className = 'bilingual-stacked';
    const backup = routeLink(copy.backup, { feature: 'progress', lesson: route.lesson }); backup.id = 'archive-backup-link'; backup.className = 'bilingual-stacked'; links.append(homework, backup);
    root.append(intro, links, scope);
    if (route.exerciseFilter !== 'all') root.append(node('p', copy.filters));
    const state = node('p', copy.loading); state.id = 'exercise-archive-status'; state.setAttribute('role', 'status');
    const records = element('div'); records.id = 'exercise-archive-records'; root.append(state, records);
    function render() {
      viewLifetime?.abort(); viewLifetime = new AbortController(); records.replaceChildren();
      const current = session.store.snapshot();
      const entries = archivedExercises(catalogue, current.data.exercises, route, current.data.homework, current.data);
      setBilingual(state, current.issue ? exerciseIssue(current.issue, exerciseSaveStates[current.status]) : exerciseSaveStates[current.status]); state.dataset.state = current.status; state.dataset.hasIssue = String(!!current.issue);
      if (current.status === 'corrupt' || (current.status === 'unavailable' && !entries.length)) return;
      if (!entries.length) { records.append(node('h2', copy.empty), node('p', copy.emptyHint)); return; }
      records.append(node('p', copy.sequence)); entries.forEach((entry, index) => records.append(questionBlock(entry, catalogue, index, viewLifetime!.signal)));
    }
    unsubscribe = session.store.subscribe(render); render();
  }).catch(error => { if (!left && !lifetime.signal.aborted) { setBilingual(loading, copy.failed); throw error; } });
  return { ready, unmount() { if (left) return; left = true; lifetime.abort(); viewLifetime?.abort(); unsubscribe(); context.signal.removeEventListener('abort', close); root.remove(); } };
};
