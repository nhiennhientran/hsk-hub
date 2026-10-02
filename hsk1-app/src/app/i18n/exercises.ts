import type { ExerciseFilter, ExerciseGroup, ExerciseSet, ExerciseSource } from '../../domain/exercises/catalogue.ts';
import type { StoreStatus } from '../../services/storage/index.ts';
import type { AudioStatus } from '../../services/audio/index.ts';

/** Interface copy only. Curriculum, answer keys, submitted text and domain rules stay unchanged. */
const pair = (zh: string, vi: string) => ({ zh, vi });
export const exerciseCopy = {
  title: pair('练习', 'Luyện tập'),
  loading: pair('正在打开练习…', 'Đang mở bài tập…'),
  loadFailed: pair('暂时无法打开练习，请刷新页面重试', 'Chưa mở được bài tập. Hãy thử tải lại trang.'),
  originalTitle: pair('综合练习', 'Luyện tập tổng hợp'),
  pilotTitle: pair('第9课拓展', 'Bài 9 mở rộng'),
  reviewTitle: pair('已交作业复习', 'Ôn câu đã nộp'),
  introduction: pair('选择题型，逐题练习，随时回来继续', 'Chọn dạng bài, làm từng câu và quay lại khi cần.'),
  reviewIntroduction: pair('逐题复习错题或到期题目，复习不会改变已交作业的首次成绩', 'Luyện từng câu sai hoặc đến hạn. Các lượt ôn không thay đổi điểm lần đầu của bài tập đã nộp.'),
  sets: pair('练习题库', 'Bộ bài tập'),
  groups: pair('练习题型', 'Nhóm bài tập'),
  filter: pair('筛选题目', 'Câu cần luyện'),
  navigator: pair('选择题目', 'Chọn câu'),
  retrySave: pair('重试保存', 'Thử lưu lại'),
  backup: pair('数据与备份', 'Dữ liệu và sao lưu'),
  refresh: pair('更新题目列表', 'Cập nhật danh sách câu'),
  translationChoice: pair('翻译选择 · 自动评分', 'Dịch lựa chọn · tự chấm'),
  translationManual: pair('翻译书写 · 教师批阅', 'Dịch tự viết · giáo viên xem'),
  choicePath: pair('翻译选择', 'Lựa chọn'),
  writingPath: pair('翻译书写', 'Tự viết'),
  oral: pair('口语拓展 · 不计入30道题', 'Luyện nói mở rộng · không tính trong 30 câu'),
  teacherSheet: pair('书写内容供教师批阅，不自动评分', 'Bài tự viết để giáo viên xem; không có điểm tự động.'),
  draft: pair('未提交的草稿', 'Bản nháp chưa nộp'),
  writingSaved: pair('书写已保存', 'Đã lưu bài viết'),
  notWritten: pair('尚未作答', 'Chưa viết'),
  noAnswer: pair('（尚未作答）', '(chưa có câu trả lời)'),
  copySheet: pair('复制书写内容', 'Sao chép bài viết'),
  printSheet: pair('打印 / 保存PDF', 'In / lưu PDF'),
  closeSheet: pair('关闭书写单', 'Đóng phiếu'),
  copied: pair('书写内容已复制，可以发送给老师', 'Đã sao chép bài viết. Bạn có thể gửi cho giáo viên.'),
  copyFailed: pair('浏览器暂不允许复制，可以选中书写单内容或截图', 'Trình duyệt chưa cho sao chép. Bạn có thể chọn nội dung phiếu hoặc chụp màn hình.'),
  noGroupQuestions: pair('此题型暂无题目', 'Không có câu trong nhóm này'),
  noMatchingQuestions: pair('暂无符合条件的题目', 'Chưa có câu phù hợp'),
  chooseAnotherGroup: pair('请选择其他题型', 'Chọn một nhóm bài tập khác.'),
  queueRules: pair('错题和到期题目只根据已提交的答题记录生成；书写题不进入自动评分列表', 'Câu sai và câu đến hạn chỉ dựa trên bài đã nộp. Bài tự viết không vào danh sách tự chấm.'),
  readPassage: pair('请先读完整段对话，再回答问题', 'Đọc toàn bộ đoạn hội thoại trước khi trả lời'),
  play: pair('播放原音', 'Nghe audio gốc'),
  pause: pair('暂停', 'Tạm dừng'),
  resume: pair('继续播放', 'Tiếp tục'),
  replay: pair('重播', 'Nghe lại'),
  audioRate: pair('播放速度', 'Tốc độ nghe'),
  audioFailed: pair('暂时无法播放音频，请重试', 'Chưa phát được âm thanh. Hãy thử lại.'),
  chooseAnswer: pair('选择一个答案', 'Chọn một đáp án'),
  chosenTokens: pair('已排列的句子', 'Câu đã xếp'),
  availableTokens: pair('尚未使用的词语', 'Từ chưa dùng'),
  sortHint: pair('点击词语加入句子，再次点击已选词语可放回', 'Chạm từ để thêm vào câu; chạm từ đã chọn để trả lại.'),
  writeChinese: pair('用中文写句子', 'Viết câu tiếng Trung'),
  manualHint: pair('书写内容会保存供教师批阅，不显示参考答案，也不自动判定对错', 'Bài tự viết được lưu để giáo viên xem. Không hiện đáp án mẫu và không tự chấm đúng/sai.'),
  writingTooLong: pair('书写内容超过4,000字，请缩短后再离开此题', 'Bài viết vượt 4.000 ký tự; hãy rút ngắn trước khi rời câu.'),
  showSheet: pair('查看书写单 / 截图', 'Xem phiếu / chụp màn hình'),
  manualFeedback: pair('书写已保存 · 等待教师批阅', 'Đã lưu bài viết · chờ giáo viên xem'),
  correct: pair('回答正确', 'Đúng'),
  incorrect: pair('还不正确', 'Chưa đúng'),
  redo: pair('重做此题', 'Làm lại câu này'),
  submitWriting: pair('保存书写，供教师批阅', 'Lưu bài viết để giáo viên xem'),
  submit: pair('提交答案', 'Nộp câu'),
  finishComposing: pair('请先完成文字输入，再提交', 'Hãy hoàn tất nhập chữ rồi nộp bài.'),
  restarted: pair('已开始新一轮，首次成绩仍保留', 'Đã mở lượt mới. Kết quả lần đầu vẫn được giữ.'),
  incomplete: pair('请完成作答后再提交', 'Hãy trả lời đầy đủ trước khi nộp.'),
  manualSubmitted: pair('书写已保存，不自动评分', 'Đã lưu bài viết; không chấm điểm tự động.'),
  submitted: pair('此题结果已记录', 'Đã ghi kết quả của câu này.'),
  submitFailed: pair('暂时无法保存答案', 'Chưa lưu được câu trả lời.'),
  previous: pair('上一题', 'Câu trước'),
  next: pair('下一题', 'Câu sau'),
  reviewPaths: pair('选择复习内容', 'Chọn nội dung ôn'),
  reviewWrong: pair('作业错题', 'Câu bài tập còn sai'),
  reviewDue: pair('作业到期复习', 'Câu bài tập đến hạn'),
  reviewOriginal: pair('原题到期复习', 'Ôn bài tập gốc'),
};
export const exerciseSets: Record<ExerciseSet, ReturnType<typeof pair>> = {
  original: pair('综合练习 · 300题', 'Luyện tổng hợp · 300 câu'),
  pilot: pair('第9课拓展 · 30题', 'Bài 9 mở rộng · 30 câu'),
  'homework-review': exerciseCopy.reviewTitle,
};
export const exerciseGroups: Record<ExerciseGroup, ReturnType<typeof pair>> = {
  choice: pair('选择题', 'Chọn đáp án'), sort: pair('排列句子', 'Xếp câu'),
  translation: pair('越译中', 'Dịch Việt → Trung'), listening: pair('听力选择', 'Nghe chọn đáp án'),
  words: pair('词汇与拼音', 'Từ vựng & pinyin'), grammar: pair('语法', 'Ngữ pháp'),
  reading: pair('阅读理解', 'Đọc hiểu'), ordering: pair('排列句子', 'Xếp câu'),
};
export const exerciseFilters: Record<ExerciseFilter, ReturnType<typeof pair>> = {
  all: pair('全部题目', 'Tất cả câu'), wrong: pair('最近答错的题目', 'Câu gần nhất còn sai'), due: pair('已到复习时间', 'Câu đã đến hạn'),
};
export const exerciseSaveStates: Record<StoreStatus, ReturnType<typeof pair>> = {
  saved: pair('已保存在此设备', 'Đã lưu trên thiết bị này'), empty: pair('暂无需要保存的更改', 'Chưa có thay đổi cần lưu'),
  saving: pair('正在保存…', 'Đang lưu…'), unsaved: pair('正在等待保存到此设备…', 'Đang chờ lưu trên thiết bị…'),
  conflict: pair('其他标签页有新更改', 'Có thay đổi ở tab khác'), corrupt: pair('无法读取原始数据', 'Dữ liệu gốc không đọc được'),
  unavailable: pair('暂时无法保存在此设备', 'Chưa thể lưu trên thiết bị này'),
};
export const exerciseAudioStates: Record<AudioStatus, ReturnType<typeof pair>> = {
  idle: pair('可以播放', 'Sẵn sàng nghe'), loading: pair('正在加载…', 'Đang tải…'), playing: pair('正在播放', 'Đang phát'),
  paused: pair('已暂停', 'Đã tạm dừng'), ended: pair('播放结束', 'Đã nghe hết'), error: pair('暂时无法播放', 'Chưa phát được'),
};

export const exerciseText = {
  openQuestion: (index: number) => pair(`打开第${index}题`, `Mở câu ${index}`),
  question: (index: number, total: number, group: ExerciseGroup) => pair(`第${index}/${total}题 · ${exerciseGroups[group].zh}`, `Câu ${index}/${total} · ${exerciseGroups[group].vi}`),
  automaticSummary: (submitted: number, total: number, first: number, latest: number) => pair(`已提交：${submitted}/${total} · 首次答对：${first} · 最近答对：${latest}`, `Đã nộp: ${submitted}/${total} · Đúng lần đầu: ${first} · Đúng gần nhất: ${latest}`),
  manualSummary: (submitted: number, total: number) => pair(`书写已保存：${submitted}/${total} · 教师批阅，不自动评分`, `Đã lưu bài viết: ${submitted}/${total} · giáo viên xem, không tự chấm điểm`),
  sheetTitle: (lesson: number, set: ExerciseSet) => pair(`书写单 · 第${lesson}课 · ${exerciseSets[set].zh}`, `Phiếu bài viết · Bài ${lesson} · ${exerciseSets[set].vi}`),
  profile: (name: string, className: string) => pair(`姓名：${name || '未填写'} · 班级：${className || '未填写'}`, `Họ tên: ${name || 'Chưa điền'} · Lớp: ${className || 'Chưa điền'}`),
  answer: (answer: string) => pair(`答案：${answer}`, `Đáp án: ${answer}`),
  reviewAt: (at: number) => pair(`下次复习：${new Date(at).toLocaleString('zh-CN')}`, `Ôn tiếp: ${new Date(at).toLocaleString('vi-VN')}`),
  source: (source: ExerciseSource, lesson: number) => {
    if (source.page) return pair(`来源：${source.book ?? '教材'}，第${source.page}页${source.pdfPage ? ` · PDF第${source.pdfPage}页` : ''}`, `Nguồn: ${source.book ?? 'Giáo trình'}, tr. ${source.page}${source.pdfPage ? ` · PDF ${source.pdfPage}` : ''}`);
    if (source.label) return pair(`来源：${source.printPages?.length ? `教材，第${source.printPages.join('、')}页` : source.label}`, `Nguồn: ${source.label}`);
    return pair(`来源：原练习题库 · 第${lesson}课`, `Nguồn: ngân hàng bài tập gốc · Bài ${lesson}`);
  },
};

// Exact service messages, not pattern-based translation. Keep Vietnamese diagnostics intact.
const issues = new Map<string, string>([
  ['Không đọc được bộ nhớ của trình duyệt. Bản nháp chỉ ở trong tab này.', '无法读取浏览器存储，草稿仅保留在当前标签页'],
  ['Dữ liệu gốc không đọc được. Không ghi đè; hãy tải dữ liệu gốc để giữ lại.', '无法读取原始数据，不会覆盖；请下载原始数据留存'],
  ['Có thay đổi ở tab khác. Bản nháp trong tab này vẫn còn; hãy sao lưu trước khi đọc lại.', '其他标签页有新更改，当前草稿仍保留；请先备份，再重新读取'],
  ['Bộ nhớ đã đầy. Chưa lưu; bản nháp vẫn còn và có thể tải bản sao lưu.', '设备存储已满，尚未保存；草稿仍保留，可下载备份'],
  ['Chưa xác nhận được việc lưu. Bản nháp vẫn còn; hãy tải bản sao lưu.', '无法确认保存是否成功，草稿仍保留；请下载备份'],
  ['Trình duyệt không hỗ trợ khóa ghi an toàn. Bạn vẫn có thể tải bản sao lưu.', '浏览器不支持安全写入锁，仍可下载备份'],
  ['Bản xem trước đã hết hạn. Hãy xem trước lại trước khi xác nhận.', '预览已过期，请重新预览后再确认'],
  ['Số phiên lưu vượt giới hạn.', '保存版本数已超出限制'],
  ['Thời gian lưu không hợp lệ.', '保存时间无效'],
  ['Trang dữ liệu đã đóng.', '数据页面已关闭'],
  ['Dữ liệu luyện câu không hợp lệ hoặc kết quả đã bị sửa.', '练习数据无效或答题结果已被修改'],
  ['Bài học không hợp lệ.', '课号无效'],
  ['Thời gian nộp không hợp lệ.', '提交时间无效'],
  ['Đã đạt giới hạn lịch sử cho câu này. Hãy sao lưu trước khi đặt lại.', '此题历史记录已达上限，请先备份再重置'],
  ['Số lượt bài tập gốc không hợp lệ.', '原作业的答题次数无效'],
  [exerciseCopy.incomplete.vi, exerciseCopy.incomplete.zh],
  ['Âm thanh chưa bắt đầu phát. Kiểm tra kết nối rồi bấm Nghe lại.', '音频尚未开始播放，请检查网络连接后点击重播'],
  ['Âm thanh đã kết thúc trước khi bắt đầu phát. Hãy thử lại.', '音频在开始播放前已结束，请重试'],
  ['Đoạn âm thanh nằm ngoài bản ghi.', '所选音频片段超出录音范围'],
  ['Bản ghi ngắn hơn đoạn âm thanh đã chọn. Hãy thử lại.', '录音长度短于所选音频片段，请重试'],
  ['Không tải được âm thanh. Kiểm tra kết nối rồi thử lại.', '无法加载音频，请检查网络连接后重试'],
  ['Trình duyệt chưa cho phép phát. Bấm Nghe lại để thử.', '浏览器尚未允许播放，请点击重播重试'],
  ['Không phát được âm thanh. Kiểm tra kết nối rồi thử lại.', '无法播放音频，请检查网络连接后重试'],
  ['Đoạn âm thanh không hợp lệ.', '音频片段无效'],
  ['Chưa có âm thanh để phát.', '暂无可播放的音频'],
]);
export function exerciseIssue(issue: string, fallback: ReturnType<typeof pair>) {
  return pair(issues.get(issue) ?? `${fallback.zh}（${issue}）`, issue);
}
