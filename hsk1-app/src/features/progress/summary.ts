import type { StoreStatus } from '../../services/storage/index.ts';
import type { Route } from '../../app/contracts.ts';
import { routeHref } from '../../app/router.ts';
import type { ProgressLink, ProgressSummary } from '../../services/learning/progress.ts';

const statusLabels: Record<string, string> = {
  empty: 'Chưa có dữ liệu được lưu trong ứng dụng mới. Bạn có thể mở công cụ dữ liệu để nhập bản cũ.',
  saved: 'Đã lưu trên thiết bị này. Có thể tải bản sao lưu để chuyển sang thiết bị khác.',
  unsaved: 'Có thay đổi chưa lưu trên thiết bị. Mở công cụ dữ liệu để tải bản sao lưu trước khi rời trang.',
  saving: 'Đang lưu dữ liệu trên thiết bị…',
  conflict: 'Dữ liệu ở tab khác đã thay đổi. Tiến độ dưới đây là bản đang mở; hãy mở công cụ dữ liệu để xử lý.',
  corrupt: 'Không đọc được bản lưu. Các số bên dưới không thay thế dữ liệu cũ; hãy mở công cụ dữ liệu để giữ bản gốc.',
  unavailable: 'Không truy cập được bộ nhớ thiết bị. Hãy mở công cụ dữ liệu để tải bản sao lưu đang mở.',
};
export function storageStatusText(status: StoreStatus, issue?: string | null): string {
  return [statusLabels[status], issue].filter(Boolean).join(' ');
}

export function element<K extends keyof HTMLElementTagNameMap>(tag: K, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  return node;
}
export function routeLink(text: string, route: Route): HTMLAnchorElement {
  const link = element('a', text); link.href = routeHref(route); link.dataset.routeLink = ''; return link;
}
export function renderContinuation(host: HTMLElement, resume: ProgressLink | null, id: string): void {
  host.replaceChildren(); host.hidden = !resume;
  if (resume) { const link = routeLink(resume.label, resume.route); link.id = id; host.append(link); }
}
function metric(host: HTMLElement, id: string, text: string): void {
  const line = element('p', text); line.id = id; host.append(line);
}
function section(title: string, name: string): HTMLElement {
  const panel = element('section'); panel.className = 'progress-panel'; panel.dataset.progressDomain = name;
  panel.append(element('h2', title)); return panel;
}
const scores = (first: number, latest: number, total: number, submitted: number): string => submitted
  ? `Đúng lần đầu: ${first}/${total} · Đúng gần nhất: ${latest}/${total} câu toàn khóa`
  : `Chưa có điểm · ${total} câu khách quan toàn khóa`;

export function renderProgressOverview(host: HTMLElement, model: ProgressSummary, prefix = 'progress'): void {
  const reading = section('Giáo trình', 'reading');
  metric(reading, `${prefix}-reading`, `Đã mở ${model.reading.visited}/${model.reading.total} bài · Tự đánh dấu hoàn thành ${model.reading.complete}/${model.reading.total} bài`);
  reading.append(element('p', `${model.reading.starred} từ được gắn sao trong giáo trình. Dấu đọc và sao do bạn tự đánh dấu; không phải điểm bài tập.`));

  const homework = section('Bài tập', 'homework');
  metric(homework, `${prefix}-homework-submitted`, `Đã nộp ${model.homework.submitted}/${model.homework.total} câu · Hoàn thành ${model.homework.completedLessons}/${model.homework.lessonCount} bài`);
  metric(homework, `${prefix}-homework-objective`, scores(model.automatic.firstCorrect, model.automatic.latestCorrect, model.automatic.total, model.automatic.submitted));
  homework.append(element('p', `Đã nộp ${model.automatic.submitted}/${model.automatic.total} câu chọn đáp án và sắp xếp. Câu chưa nộp chưa có điểm; làm lại không thay điểm lần đầu.`));

  const translation = section('Bản dịch của bạn', 'translation');
  metric(translation, `${prefix}-translation-submitted`, `Đã nộp ${model.translation.submitted}/${model.translation.total} câu dịch · Không chấm điểm tự động`);
  metric(translation, `${prefix}-translation-draft`, `Bản nháp chưa nộp: ${model.translation.draftAnswered} câu đã điền hợp lệ trong ${model.translation.draftLessons} bài`);
  translation.append(element('p', 'Bản nháp làm lại được giữ riêng với bản đã nộp. Mở bài dịch để xem hoặc in bản nộp gần nhất. Lưu trên thiết bị không có nghĩa là giáo viên đã nhận.'));

  const listening = section('Luyện nghe độc lập', 'listening');
  metric(listening, `${prefix}-listening-submitted`, `Đã nộp ${model.listening.overall.answered}/${model.listening.overall.total} câu nghe`);
  metric(listening, `${prefix}-listening-objective`, scores(model.listening.overall.firstCorrect, model.listening.overall.latestCorrect, model.listening.overall.total, model.listening.overall.answered));
  listening.append(element('p', `${model.listening.wrongIds.length} câu gần nhất còn sai. Điểm nghe được tính riêng với bài tập.`));
  if (model.listeningResume) listening.append(routeLink(model.listeningResume.label, model.listeningResume.route));

  const vocabulary = section('Từ vựng và lịch ôn', 'vocabulary');
  metric(vocabulary, `${prefix}-vocabulary-counts`, `${model.vocabulary.records} bản ghi nghĩa theo bài · ${model.vocabulary.distinctForms} dạng chữ khác nhau`);
  metric(vocabulary, `${prefix}-vocabulary-ratings`, `Đã tự đánh giá ${model.vocabulary.rated}/${model.vocabulary.totalSenses} thẻ nghĩa · Cần luyện lại ${model.vocabulary.again} · Khó ${model.vocabulary.hard} · Đã nhớ ${model.vocabulary.good}`);
  metric(vocabulary, `${prefix}-vocabulary-due`, `Đến hạn ${model.vocabulary.dueRated} · Chưa học ${model.vocabulary.new} · Tổng đến hạn hoặc mới ${model.vocabulary.due}`);
  vocabulary.append(element('p', 'Tự đánh giá không phải điểm đúng/sai. Các nghĩa hoặc cách đọc khác nhau của cùng một dạng chữ được giữ riêng.'));
  const actions = element('div'); actions.className = 'progress-actions';
  actions.append(routeLink('Mở lịch ôn', { feature: 'review', lesson: model.resume?.route.lesson ?? 1 }));
  if (model.vocabularyResume) actions.append(routeLink(model.vocabularyResume.label, model.vocabularyResume.route));
  vocabulary.append(actions);
  const restored: HTMLElement[] = [];
  if (model.extraExercises) {
    for (const [kind, title] of [['original', 'Bài tập gốc · 300 câu'], ['pilot', 'Bài 9 mở rộng · 30 câu']] as const) {
      const totals = model.extraExercises[kind], panel = section(title, kind);
      metric(panel, `${prefix}-${kind}-submitted`, `Đã nộp ${totals.submitted}/${totals.automatic} câu tự chấm · Lần đầu đúng ${totals.firstCorrect} · Gần nhất đúng ${totals.latestCorrect}`);
      if (totals.manual) panel.append(element('p', `Bài tự viết: ${totals.manualSubmitted}/${totals.manual} · giáo viên xem, không có điểm tự động`));
      panel.append(routeLink('Mở bài tập', { feature: 'exercises', lesson: kind === 'pilot' ? 9 : model.resume?.route.lesson ?? 1, exerciseSet: kind })); restored.push(panel);
    }
    homework.append(element('p', `${model.extraExercises.reviewWrong} câu còn sai · ${model.extraExercises.reviewDue} câu đến hạn ôn. Lượt ôn từng câu không thay điểm bài nộp đầu tiên.`));
  }
  host.replaceChildren(reading, homework, translation, listening, vocabulary, ...restored);
}

export function renderLessonProgress(host: HTMLElement, model: ProgressSummary): void {
  const grid = element('div'); grid.className = 'lesson-grid';
  for (const row of model.lessons) {
    const card = element('article'); card.className = 'lesson-card'; card.dataset.progressLesson = String(row.lesson);
    card.append(element('h3', `Bài ${row.lesson} · ${row.title}`), element('p', row.titleVi),
      element('p', `Giáo trình: ${row.reading.complete ? 'tự đánh dấu hoàn thành' : row.reading.visited ? 'đã mở' : 'chưa mở'} · ${row.reading.modules}/5 mục đã mở`),
      element('p', `Bài tập đã nộp ${row.homework.submitted}/${row.homework.total} câu`),
      element('p', row.automatic.submitted ? `Khách quan: lần đầu ${row.automatic.firstCorrect}/${row.automatic.total} · gần nhất ${row.automatic.latestCorrect}/${row.automatic.total} câu toàn bài · đã nộp ${row.automatic.submitted}/${row.automatic.total}` : `Khách quan: chưa có điểm · đã nộp 0/${row.automatic.total}`),
      element('p', `Dịch: đã nộp ${row.translation.submitted}/${row.translation.total} · nháp chưa nộp ${row.translation.draftAnswered}/${row.translation.total} · không chấm điểm`),
      element('p', row.listening.answered ? `Nghe: lần đầu ${row.listening.firstCorrect}/${row.listening.total} · gần nhất ${row.listening.latestCorrect}/${row.listening.total} câu toàn bài · đã nộp ${row.listening.answered}/${row.listening.total}` : `Nghe: chưa có điểm · đã nộp 0/${row.listening.total}`));
    const actions = element('div'); actions.className = 'lesson-actions';
    actions.append(routeLink('Mở giáo trình', { feature: 'textbook', lesson: row.lesson }),
      routeLink(row.homework.done ? 'Xem bài tập' : 'Tiếp tục bài tập', row.homeworkRoute),
      routeLink(row.translation.submitted ? 'Xem bản dịch đã nộp' : 'Mở bài dịch', { feature: 'homework', lesson: row.lesson, part: 'translation' }));
    card.append(actions); grid.append(card);
  }
  host.replaceChildren(element('h2', 'Tiến độ từng bài'), grid);
}

