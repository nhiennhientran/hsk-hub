import type { BilingualCopy } from '../bilingual.ts';
import type { AudioStatus, PlaybackResult } from '../../services/audio/index.ts';
const copy = (zh: string, vi: string): BilingualCopy => ({ zh, vi });
const percent = (right: number, total: number, language: 'zh' | 'vi') => total ? `${Math.round(right / total * 100)}%` : language === 'zh' ? '暂无成绩' : 'chưa có điểm';
export const listeningCopy = {
  title: copy('听力练习', 'Luyện nghe'), controls: copy('我的听力练习', 'Luyện nghe của bạn'),
  introduction: copy('听教材中的中文录音，选择合适的越南语含义，逐题提交。', 'Nghe tiếng Trung từ bản ghi giáo trình, chọn nghĩa phù hợp bằng tiếng Việt rồi nộp từng câu.'),
  start: copy('开始新一轮', 'Bắt đầu lượt mới'), settings: copy('选择本轮题目', 'Chọn câu cho lượt mới'), lessons: copy('选择一课或多课', 'Chọn một hoặc nhiều bài học'),
  lesson: (number: number) => copy(`第 ${number} 课`, `Bài ${number}`), all: copy('全选', 'Chọn tất cả'), none: copy('清空选择', 'Bỏ chọn tất cả'),
  currentLesson: (number: number) => copy(`选择当前第 ${number} 课`, `Chọn bài đang mở · Bài ${number}`),
  mode: copy('练习范围', 'Câu cần luyện'), allQuestions: copy('全部题目', 'Tất cả câu'), wrongQuestions: copy('最近答错的题', 'Câu gần nhất còn sai'),
  shuffle: copy('打乱题序', 'Trộn thứ tự câu hỏi'), count: copy('每轮题数', 'Số câu mỗi lượt'), questionCount: (count: number) => copy(`${count} 题`, `${count} câu`),
  resume: (position?: number) => copy(`继续已保存的练习${position ? ` · 第 ${position} 题` : ''}`, `Tiếp tục lượt đã lưu${position ? ` · Câu ${position}` : ''}`),
  redo: copy('重做错题', 'Làm lại câu còn sai'),
  replaceHint: copy('选择范围后开始，新一轮将替换当前练习；首次和最近的成绩仍保留。', 'Chọn phạm vi mới rồi bấm bắt đầu. Lượt đang học sẽ được thay bằng lượt mới; điểm lần đầu và gần nhất vẫn được giữ.'),
  retrySave: copy('重试保存', 'Thử lưu lại'), data: copy('数据与备份管理', 'Quản lý dữ liệu và bản sao lưu'), results: copy('听力成绩', 'Kết quả nghe'),
  playerTitle: copy('教材原声', 'Âm thanh giáo trình'), play: copy('播放', 'Nghe'), pause: copy('暂停', 'Tạm dừng'), continue: copy('继续播放', 'Tiếp tục'), replay: copy('从头重听', 'Nghe lại từ đầu'), rate: copy('播放速度', 'Tốc độ'), normal: copy('正常', 'Bình thường'),
  playerHint: copy('可以重复播放并调整速度，播放次数不影响得分。', 'Bạn có thể nghe nhiều lần và đổi tốc độ. Số lần nghe không làm giảm điểm.'),
  navigation: copy('听力题目导航', 'Di chuyển trong lượt nghe'), previous: copy('← 上一题', 'Câu trước'), next: copy('下一题 →', 'Câu tiếp'),
  genericFailure: copy('暂时无法完成操作，请重试。', 'Chưa thực hiện được. Vui lòng thử lại.'),
  invalidAudio: copy('本题暂无有效音频，请选择其他题目。', 'Câu này chưa có đoạn âm thanh hợp lệ. Vui lòng chọn câu khác.'),
  noSession: copy('选择课程并开始，即可练习听力。', 'Chọn bài học rồi bấm bắt đầu để luyện nghe.'),
  question: (number: number, lesson: number) => copy(`第 ${number} 题 · 第 ${lesson} 课`, `Câu ${number} · Bài ${lesson}`),
  choose: copy('选择一个答案', 'Chọn một đáp án'), submit: copy('提交并查看解析', 'Nộp và xem giải thích'), correct: copy('正确', 'Đúng'), incorrect: copy('暂未答对', 'Chưa đúng'), correctAnswer: copy('正确答案', 'Đáp án đúng'), transcript: copy('录音内容', 'Nội dung đã nghe'),
  source: (section: string, printPages: readonly number[], pdfPages: readonly number[]) => copy(`来源：${section} · 书页 ${printPages.join(', ')} · PDF 页 ${pdfPages.join(', ')}`, `Nguồn: ${section} · Trang sách ${printPages.join(', ')} · Trang PDF ${pdfPages.join(', ')}`),
  noLessons: copy('请至少选择一课。', 'Hãy chọn ít nhất một bài học.'),
  available: (selected: number, available: number) => copy(`已选范围共 ${available} 题，本轮练习 ${selected} 题。`, `${selected} / ${available} câu trong phạm vi đã chọn cho lượt mới.`),
  noWrong: copy('所选范围内没有仍答错的题，可选择全部题目继续练习。', 'Không có câu còn sai trong phạm vi đã chọn. Bạn có thể chọn tất cả câu để luyện thêm.'),
  position: (position: number, total: number) => copy(`第 ${position} / ${total} 题`, `Câu ${position} / ${total}`),
  scope: (lessons: readonly number[], mode: 'all' | 'wrong', count: number) => copy(`当前练习：第 ${lessons.join(', ')} 课 · ${mode === 'wrong' ? '重做错题' : '全部题目'} · ${count} 题`, `Lượt đang học: Bài ${lessons.join(', ')} · ${mode === 'wrong' ? 'Làm lại câu còn sai' : 'Tất cả câu'} · ${count} câu`),
  listens: (count: number) => copy(`已开始播放 ${count} 次`, `Số lần đã bắt đầu nghe: ${count}`),
  sessionScore: (answered: number, total: number, correct: number) => copy(`本轮：已提交 ${answered} / ${total} 题 · 答对 ${correct} / ${answered} 题（${percent(correct, answered, 'zh')}）。`, `Lượt này: đã nộp ${answered} / ${total} câu · Đúng ${correct} / ${answered} câu đã nộp (${percent(correct, answered, 'vi')}).`),
  firstScore: (correct: number, answered: number, total: number) => copy(`首次：答对 ${correct} / ${answered} 题（${percent(correct, answered, 'zh')}）· 已提交 ${answered} / ${total} 题。`, `Lần đầu: đúng ${correct} / ${answered} câu đã nộp (${percent(correct, answered, 'vi')}) · Đã nộp ${answered} / ${total} câu.`),
  latestScore: (correct: number, answered: number) => copy(`最近：答对 ${correct} / ${answered} 题（${percent(correct, answered, 'zh')}）。`, `Gần nhất: đúng ${correct} / ${answered} câu đã nộp (${percent(correct, answered, 'vi')}).`),
  completed: copy('本轮听力已完成，重做时仍分别保留首次和最近的成绩。', 'Bạn đã hoàn thành lượt nghe này. Lần đầu và lần gần nhất được giữ riêng khi làm lại.'),
};
export const listeningAudioStates: Record<AudioStatus, BilingualCopy> = {
  idle: copy('点击播放，收听本题。', 'Bấm Nghe để phát câu này.'), loading: copy('正在加载音频…', 'Đang tải âm thanh…'),
  playing: copy('正在播放教材原声。', 'Đang phát âm thanh giáo trình.'), paused: copy('已暂停。', 'Đã tạm dừng.'),
  ended: copy('本段播放完毕，可以再次收听。', 'Đã nghe hết đoạn. Bạn có thể nghe lại.'),
  error: copy('无法播放音频，请检查网络后点击重听。', 'Không phát được âm thanh. Kiểm tra kết nối rồi bấm Nghe lại.'),
};
const listeningErrors: Readonly<Record<string, BilingualCopy>> = {
  empty: copy('所选课程和筛选条件下没有听力题，请调整范围后开始。', 'Không có câu nghe trong các bài và bộ lọc đã chọn. Hãy đổi phạm vi rồi bắt đầu.'),
  'empty-session': copy('本轮暂无听力题，请开始新一轮。', 'Chưa có câu nghe trong lượt này. Hãy bắt đầu lượt mới.'),
  'not-current': copy('请在当前题目中操作。', 'Hãy thực hiện thao tác ở câu đang mở.'),
  'already-submitted': copy('本题已提交，请开始新一轮练习。', 'Câu này đã nộp. Hãy mở lượt mới để luyện lại.'),
  'invalid-answer': copy('请选择四个选项中的一个。', 'Đáp án cần là một trong bốn lựa chọn.'),
  'answer-required': copy('请先选择并提交当前答案，再继续。', 'Hãy chọn và nộp đáp án hiện tại trước khi tiếp tục.'),
  'content-changed': copy('题目内容已更新，请开始新一轮。', 'Nội dung câu nghe đã đổi phiên bản. Hãy mở lượt mới.'),
  'invalid-position': copy('题目位置无效，请返回当前题目。', 'Vị trí câu nghe không hợp lệ. Hãy trở về câu đang mở.'),
  'invalid-lessons': copy('请选择第 1 至 15 课。', 'Hãy chọn các bài từ 1 đến 15.'),
  'invalid-preferences': copy('练习设置无效，请重新选择。', 'Tùy chọn luyện nghe không hợp lệ. Hãy chọn lại.'),
  'invalid-options': copy('请检查练习设置，每轮可选 5 题、10 题或全部。', 'Hãy kiểm tra tùy chọn; số câu nghe cần là 5, 10 hoặc tất cả.'),
  'invalid-state': copy('练习记录已达限制或无效，请先下载备份。', 'Bản ghi luyện nghe vượt giới hạn hoặc không hợp lệ. Hãy tải bản sao lưu trước.'),
};
export function listeningFailure(outcome: { reason?: string; message?: string }): BilingualCopy {
  return listeningErrors[outcome.reason ?? ''] ?? copy(listeningCopy.genericFailure.zh, outcome.message ?? listeningCopy.genericFailure.vi);
}
const audioIssues = new Map<string, BilingualCopy>([
  ['Trình duyệt chưa cho phép phát. Bấm Nghe lại để thử.', copy('浏览器尚未允许播放，请点击重听。', 'Trình duyệt chưa cho phép phát. Bấm Nghe lại để thử.')],
  ['Âm thanh chưa bắt đầu phát. Kiểm tra kết nối rồi bấm Nghe lại.', copy('音频尚未开始播放，请检查网络后点击重听。', 'Âm thanh chưa bắt đầu phát. Kiểm tra kết nối rồi bấm Nghe lại.')],
  ['Âm thanh đã kết thúc trước khi bắt đầu phát. Hãy thử lại.', copy('音频未开始播放就已结束，请重试。', 'Âm thanh đã kết thúc trước khi bắt đầu phát. Hãy thử lại.')],
  ['Đoạn âm thanh nằm ngoài bản ghi.', copy('所选音频片段超出录音范围。', 'Đoạn âm thanh nằm ngoài bản ghi.')],
  ['Bản ghi ngắn hơn đoạn âm thanh đã chọn. Hãy thử lại.', copy('录音短于所选片段，请重试。', 'Bản ghi ngắn hơn đoạn âm thanh đã chọn. Hãy thử lại.')],
  ['Đoạn âm thanh không hợp lệ.', copy('音频片段无效，请选择其他题目。', 'Đoạn âm thanh không hợp lệ. Hãy chọn câu khác.')],
  ['Chưa có âm thanh để phát.', copy('暂无可播放的音频。', 'Chưa có âm thanh để phát.')],
  ['Không phát được âm thanh. Kiểm tra kết nối rồi thử lại.', listeningAudioStates.error],
  ['Không tải được âm thanh. Kiểm tra kết nối rồi thử lại.', listeningAudioStates.error],
]);
export function listeningAudioFailure(issue?: string | null, code?: PlaybackResult['code']): BilingualCopy {
  if (code === 'unsupported') return copy('浏览器不支持此音频，请换一个浏览器重试。', 'Trình duyệt không hỗ trợ âm thanh này. Hãy thử trình duyệt khác.');
  return issue ? audioIssues.get(issue) ?? copy(listeningAudioStates.error.zh, `${listeningAudioStates.error.vi} ${issue}`) : listeningAudioStates.error;
}
