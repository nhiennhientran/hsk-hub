import type { BilingualCopy } from '../bilingual.ts';
import type { HomeworkPart } from '../../services/content/homework.ts';

const copy = (zh: string, vi: string): BilingualCopy => ({ zh, vi });
export const homeworkParts: Record<HomeworkPart, BilingualCopy> = {
  choice: copy('选择题', 'Chọn đáp án'), sort: copy('排列句子', 'Xếp câu'), translation: copy('自主翻译', 'Dịch tự viết'),
};
export const homeworkCopy = {
  title: copy('课后作业', 'Bài tập'), controls: copy('我的作业', 'Bài tập của bạn'), navigation: copy('作业分项', 'Các phần bài tập'),
  loading: (lesson: number) => copy(`第 ${lesson} 课 · 正在加载…`, `Bài ${lesson} · Đang tải thông tin…`),
  lesson: (lesson: number, title: string, titleVi: string) => copy(`第 ${lesson} 课 · ${title}`, `Bài ${lesson} · ${titleVi}`),
  name: copy('姓名', 'Họ và tên'), className: copy('班级', 'Lớp'),
  profileLimit: copy('姓名和班级各限 200 个字符。', 'Tên và lớp được giới hạn ở 200 ký tự.'),
  profileHint: copy('可以直接开始学习。填写姓名和班级后，作业截图的信息会更完整。', 'Bạn có thể học ngay. Điền tên và lớp để ảnh bài nộp có đủ thông tin.'),
  submit: copy('提交作业', 'Nộp bài'), retrySave: copy('重试保存', 'Thử lưu lại'), backup: copy('下载备份', 'Tải bản sao lưu'), data: copy('数据管理', 'Quản lý dữ liệu'),
  backupFailed: copy('无法创建备份，请重试。', 'Không tạo được bản sao lưu. Vui lòng thử lại.'),
  answered: (count: number, total: number) => copy(`已回答 ${count} / ${total} 题`, `Đã trả lời ${count} / ${total} câu.`),
  allSubmitted: copy('本部分 5 题已全部提交。', 'Đã nộp đủ 5 câu của phần này.'),
  courseTotals: (homework: { submitted: number; total: number }, automatic: { firstCorrect: number; latestCorrect: number; submitted: number }, manual: { submitted: number; total: number }) => copy(
    `作业已提交 ${homework.submitted} / ${homework.total} 题。自动评分：首次 ${automatic.firstCorrect} / ${automatic.submitted}，最近 ${automatic.latestCorrect} / ${automatic.submitted}。自主翻译已提交 ${manual.submitted} / ${manual.total} 题。`,
    `Bài tập đã nộp: ${homework.submitted} / ${homework.total} câu. Các câu chấm tự động: lần đầu ${automatic.firstCorrect} / ${automatic.submitted}, gần nhất ${automatic.latestCorrect} / ${automatic.submitted}. Dịch tự viết đã nộp: ${manual.submitted} / ${manual.total} câu.`),
  part: (part: HomeworkPart, locked = false) => copy(`${homeworkParts[part].zh}${locked ? ' · 未解锁' : ''}`, `${homeworkParts[part].vi}${locked ? ' · Chưa mở' : ''}`),
  correct: copy('正确', 'Đúng'), incorrect: copy('暂未答对', 'Chưa đúng'), answer: copy('答案', 'Đáp án'), suitableSentence: copy('参考句子', 'Câu phù hợp'),
  sorted: copy('已排列的句子', 'Câu đã xếp'), unused: copy('未选词语', 'Từ chưa chọn'), clearSort: copy('清空句子', 'Xóa câu đã xếp'), sortHint: copy('依次选择词语，组成句子。', 'Chọn từng từ để tạo câu.'),
  removeToken: (token: string) => copy(`从句子中移除 ${token}`, `Bỏ ${token} khỏi câu`),
  reviewNavigation: copy('复习与其他题型', 'Ôn câu và dạng bài khác'), wrong: copy('复习错题', 'Ôn câu sai'), due: copy('到期复习', 'Ôn câu đến hạn'), translationChoice: copy('翻译选择题', 'Dịch lựa chọn'),
  locked: (part: HomeworkPart) => copy(`完成并提交“${homeworkParts[part].zh}”的全部 5 题即可解锁，无需满分。`, `Hoàn thành và nộp đủ 5 câu ${homeworkParts[part].vi.toLowerCase()} để mở phần này. Không cần đạt điểm tối đa.`),
  goToPart: (part: HomeworkPart) => copy(`前往${homeworkParts[part].zh}`, `Đến phần ${homeworkParts[part].vi}`),
  manualHint: copy('请用自己的表达翻译成中文。自主翻译不自动评分；提交后可截图发给老师。', 'Dịch sang tiếng Trung bằng cách viết của bạn. Bài tự viết không chấm điểm tự động; sau khi nộp, bạn có thể chụp ảnh bài nộp để gửi giáo viên.'),
  automaticHint: copy('回答全部 5 题后提交，即可查看结果和解析。', 'Trả lời đủ 5 câu rồi nộp để xem kết quả và giải thích.'),
  question: (number: number) => copy(`第 ${number} 题`, `Câu ${number}`),
  choose: (number: number) => copy(`选择第 ${number} 题的答案`, `Chọn đáp án câu ${number}`),
  writtenAnswer: (number: number) => copy(`中文回答 · 第 ${number} 题`, `Câu trả lời tiếng Trung · Câu ${number}`),
  length: (length: number, max: number) => copy(`${length} / ${max} 字符`, `${length} / ${max} ký tự`),
  tooLong: (number: number, max: number) => copy(`第 ${number} 题超过 ${max} 个字符；超出部分尚未保存。请缩短后再提交。`, `Câu ${number} vượt giới hạn ${max} ký tự; phần vượt giới hạn chưa được lưu. Hãy rút ngắn trước khi nộp.`),
  submitManual: copy('提交自主翻译', 'Nộp bài tự viết'), submitAutomatic: copy('提交并查看结果', 'Nộp và xem kết quả'),
  composing: copy('请先完成文字输入，再提交作业。', 'Hãy hoàn tất nhập chữ rồi nộp bài.'),
  unsavedTooLong: (max: number) => copy(`有答案超过 ${max} 个字符，尚未保存。请缩短后再提交。`, `Có câu vượt giới hạn ${max} ký tự chưa lưu. Hãy rút ngắn trước khi nộp.`),
  missing: copy('请回答全部 5 题后再提交。', 'Bạn cần trả lời đủ 5 câu trước khi nộp.'),
  submitFailed: copy('暂时无法提交，请检查当前部分后重试。', 'Chưa nộp được bài. Hãy kiểm tra phần đang mở và thử lại.'),
  manualSubmitted: copy('自主翻译已提交，不自动评分。请查看保存状态和作业提交单。', 'Đã tạo bài nộp tự viết. Không có điểm tự động; hãy xem trạng thái lưu và ảnh bài nộp.'),
  submitted: (score: string) => copy(`已提交：答对 ${score}。请查看本设备的保存状态。`, `Đã nộp: ${score} câu đúng. Hãy xem trạng thái lưu trên thiết bị.`),
  manualResult: (time: string) => copy(`自主翻译提交时间：${time}。不自动评分。`, `Bài tự viết đã nộp lúc ${time}. Không có điểm tự động.`),
  result: (score: string, time: string) => copy(`本次提交：答对 ${score} · ${time}`, `Kết quả lần nộp hiện tại: ${score} câu đúng · ${time}.`),
  restart: copy('重做本部分', 'Làm lại phần này'), restarted: copy('已打开新草稿，首次和最近的提交记录仍保留。', 'Đã mở bản nháp mới. Bài nộp đầu tiên và gần nhất vẫn được giữ lại.'),
  firstReceipt: copy('首次提交单', 'Ảnh bài nộp đầu tiên'), latestReceipt: copy('最近提交单', 'Ảnh bài nộp gần nhất'),
  attempts: (first: string, latest: string, count: number) => copy(`首次提交：${first} · 最近提交：${latest} · 保留最近 ${count} 次提交记录。`, `Lần nộp đầu: ${first} · Gần nhất: ${latest} · Đang giữ ${count} lần nộp gần đây.`),
};

export const receiptCopy = {
  version: copy('提交版本', 'Lần nộp'), first: copy('首次', 'Lần đầu'), latest: copy('最近', 'Gần nhất'),
  print: copy('打印 / 存为 PDF', 'In / lưu PDF'), close: copy('返回作业', 'Quay lại bài tập'), title: copy('作业提交单', 'Phiếu bài tập đã nộp'),
  name: homeworkCopy.name, className: homeworkCopy.className, lesson: copy('课次', 'Bài'), part: copy('作业分项', 'Phần'), blank: copy('未填写', 'Chưa điền'),
  lessonValue: (lesson: number, title?: string) => copy(`第 ${lesson} 课${title ? ` · ${title}` : ''}`, `Bài ${lesson}${title ? ` · ${title}` : ''}`),
  note: copy('以下为已提交的答案。', 'Các câu trả lời dưới đây là bản đã nộp.'),
  manualNote: copy('以下为已提交的答案，不自动评分。请将提交单截图发给老师，获取反馈。', 'Các câu trả lời dưới đây là bản đã nộp, không chấm điểm tự động. Hãy chụp phiếu này và gửi cô giáo để nhận nhận xét.'),
  noSubmission: copy('尚无可生成提交单的记录。', 'Chưa có lần nộp để tạo phiếu.'),
  noAnswer: copy('本提交单中没有此题的答案。', 'Chưa có câu trả lời trong phiếu này.'),
  submitted: (version: 'first' | 'latest', time: BilingualCopy) => copy(`${version === 'first' ? '首次' : '最近'} · 提交时间 ${time.zh}`, `${version === 'first' ? 'Lần đầu' : 'Gần nhất'} · Nộp lúc ${time.vi}`),
  score: (correct: number, total: number) => copy(`结果 ${correct}/${total}`, `Kết quả ${correct}/${total}`),
};

/** Explicit mappings for the storage service's stable diagnostics. */
const storageIssues = new Map<string, BilingualCopy>([
  ['Không đọc được bộ nhớ của trình duyệt. Bản nháp chỉ ở trong tab này.', copy('无法读取浏览器存储，草稿暂时只保留在当前标签页。', 'Không đọc được bộ nhớ của trình duyệt. Bản nháp chỉ ở trong tab này.')],
  ['Dữ liệu gốc không đọc được. Không ghi đè; hãy tải dữ liệu gốc để giữ lại.', copy('原始数据无法读取。不会覆盖；请下载原始数据以便保留。', 'Dữ liệu gốc không đọc được. Không ghi đè; hãy tải dữ liệu gốc để giữ lại.')],
  ['Có thay đổi ở tab khác. Bản nháp trong tab này vẫn còn; hãy sao lưu trước khi đọc lại.', copy('其他标签页有更新。当前草稿仍保留，请先备份再重新读取。', 'Có thay đổi ở tab khác. Bản nháp trong tab này vẫn còn; hãy sao lưu trước khi đọc lại.')],
  ['Bộ nhớ đã đầy. Chưa lưu; bản nháp vẫn còn và có thể tải bản sao lưu.', copy('存储空间已满，尚未保存。草稿仍保留，可下载备份。', 'Bộ nhớ đã đầy. Chưa lưu; bản nháp vẫn còn và có thể tải bản sao lưu.')],
  ['Chưa xác nhận được việc lưu. Bản nháp vẫn còn; hãy tải bản sao lưu.', copy('尚未确认保存成功。草稿仍保留，请下载备份。', 'Chưa xác nhận được việc lưu. Bản nháp vẫn còn; hãy tải bản sao lưu.')],
  ['Trình duyệt không hỗ trợ khóa ghi an toàn. Bạn vẫn có thể tải bản sao lưu.', copy('浏览器不支持安全写入锁，仍可下载备份。', 'Trình duyệt không hỗ trợ khóa ghi an toàn. Bạn vẫn có thể tải bản sao lưu.')],
  ['Bản xem trước đã hết hạn. Hãy xem trước lại trước khi xác nhận.', copy('预览已过期，请重新预览后再确认。', 'Bản xem trước đã hết hạn. Hãy xem trước lại trước khi xác nhận.')],
]);
const saveStates = {
  empty: copy('暂无需要保存的数据。', 'Chưa có dữ liệu cần lưu.'), saved: copy('已保存到本设备。', 'Đã lưu trên thiết bị này.'),
  unsaved: copy('有更新，等待自动保存…', 'Đang chờ tự động lưu thay đổi…'), saving: copy('正在保存…', 'Đang lưu…'),
  conflict: copy('其他标签页有更新，当前草稿仍保留。', 'Có thay đổi ở tab khác. Bản nháp trong tab này vẫn còn.'),
  corrupt: copy('无法读取数据，请在数据管理中保留原始数据。', 'Dữ liệu không đọc được. Hãy giữ lại dữ liệu gốc trong mục quản lý dữ liệu.'),
  unavailable: copy('本设备暂时无法保存，草稿只保留在当前标签页。', 'Chưa lưu được trên thiết bị. Bản nháp chỉ ở trong tab này.'),
};
export function assignmentSaveCopy(snapshot: { status: keyof typeof saveStates; issue: string | null; updatedAt?: number | null }): BilingualCopy {
  const text = snapshot.issue ? storageIssues.get(snapshot.issue) ?? copy('保存时遇到问题，草稿仍保留。详情：', snapshot.issue) : saveStates[snapshot.status];
  if (snapshot.status !== 'saved' || !snapshot.updatedAt) return text;
  const time = new Date(snapshot.updatedAt).toLocaleString('vi-VN');
  return copy(`${text.zh} ${time}`, `${text.vi} ${time}`);
}
export const assignmentSaveFailed = (snapshot: { status: string; issue: string | null }): boolean =>
  ['conflict', 'corrupt', 'unavailable'].includes(snapshot.status) || snapshot.status === 'unsaved' && !!snapshot.issue;
