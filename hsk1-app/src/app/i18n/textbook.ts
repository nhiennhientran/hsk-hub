import type { BilingualCopy } from '../bilingual.ts';
import type { Section } from '../contracts.ts';
import type { AudioStatus } from '../../services/audio/index.ts';
import type { StoreStatus } from '../../services/storage/index.ts';

const pair = (zh: string, vi: string): BilingualCopy => ({ zh, vi });

/** Interface copy only: never transforms curriculum text, answer options or saved data. */
export const textbookCopy = {
  title: pair('教材', 'Giáo trình'),
  missingLesson: pair('未找到本课内容，请重新选择课程。', 'Không tìm thấy bài học. Hãy chọn lại bài.'),
  servicesUnavailable: pair('学习服务暂不可用，请刷新后重试。', 'Chưa mở được dịch vụ học tập. Hãy tải lại trang.'),
  loading: (lesson: number) => pair(`第 ${lesson} 课 · 正在加载…`, `Bài ${lesson} · Đang tải thông tin…`),
  sections: pair('教材目录', 'Các mục giáo trình'),
  contents: pair('教材内容', 'Nội dung giáo trình'),
  markRead: pair('标记本课已读', 'Đánh dấu đã đọc bài'),
  completed: pair('我已读完本课', 'Tôi đã đọc xong bài này'),
  readingHint: pair('教材阅读标记与练习成绩、提交状态分别记录。', 'Đánh dấu đọc giáo trình riêng với điểm và tình trạng nộp bài tập.'),
  retrySave: pair('重新保存', 'Thử lưu lại'),
  manageData: pair('管理数据与备份', 'Quản lý dữ liệu và bản sao lưu'),
  otherPractice: pair('其他练习', 'Các dạng luyện tập khác'),
  originalPractice: pair('原版练习 · 选择 / 排序 / 翻译 / 听力', 'Bài tập gốc · Chọn / Sắp xếp / Dịch / Nghe'),
  homework: pair('课后作业', 'Bài tập sau bài'),
  continue: pair('继续学习', 'Tiếp tục học'),
  otherLesson: pair('选择其他课', 'Chọn bài khác'),
  chooseLesson: pair('选择课程', 'Chọn bài học'),
  nextLesson: (id: number) => pair(`继续第 ${id} 课 →`, `Tiếp đến bài ${id} →`),
  lesson: (id: number, direction: 'previous' | 'next') => pair(direction === 'previous' ? `← 第 ${id} 课` : `第 ${id} 课 →`, direction === 'previous' ? `← Bài ${id}` : `Bài ${id} →`),
  readingProgress: (count: number, complete: boolean) => pair(`已打开 ${count} / 5 个教材部分${complete ? ' · 已标记本课读完。' : '。'}`, `Đã mở ${count} / 5 mục giáo trình${complete ? ' · Đã đánh dấu đọc xong bài.' : '.'}`),
  text: {
    heading: pair('课文', 'Bài khoá'),
    select: pair('选择课文', 'Chọn bài khoá'),
    scenes: pair('课文场景', 'Các bài khoá'),
    listenMode: pair('听力练习：隐藏对话', 'Luyện nghe: ẩn lời thoại'),
    showOriginal: pair('显示对话', 'Hiện lời thoại'),
    playScene: pair('听整篇课文 · 教材原声', 'Nghe cả bài khoá · âm thanh gốc'),
    slow: pair('慢速播放 0.75×', 'Nghe chậm 0,75×'),
    playLine: pair('听本句 · 教材原声', 'Nghe câu này · âm thanh gốc'),
    lineLabel: (lesson: number, scene: number, line: number) => pair(`第 ${lesson} 课 · 课文 ${scene} · 第 ${line} 句`, `Bài ${lesson} · Bài khoá ${scene} · Câu ${line}`),
    noLineAudio: pair('暂无本句独立音频', 'Chưa có đoạn âm thanh riêng'),
    audioUnavailable: pair('暂无此项教材原声音频。', 'Chưa có âm thanh gốc cho mục này.'),
    tongueHeading: pair('绕口令', 'Luyện đọc câu khó'),
    tongueHint: pair('先听教材原声，再跟读。可在播放器中调慢速度。', 'Nghe âm thanh gốc giáo trình rồi đọc theo. Bạn có thể chọn tốc độ chậm ở thanh điều khiển.'),
    original: pair('教材原文', 'Nguyên văn trong giáo trình'),
    tonguePlay: pair('听绕口令 · 教材原声', 'Nghe câu khó · âm thanh gốc'),
    tongueLabel: (lesson: number) => pair(`绕口令 · 第 ${lesson} 课`, `Luyện đọc nhanh · bài ${lesson}`),
  },
  language: {
    phonetics: pair('语音', 'Ngữ âm'),
    grammar: pair('语法', 'Ngữ pháp'),
    deviceHint: pair('朗读例句使用设备的中文语音，并非教材原声。', 'Nút đọc ví dụ dùng giọng tiếng Trung của thiết bị, không phải âm thanh gốc giáo trình.'),
    readExample: pair('朗读例句 · 设备语音', 'Đọc ví dụ · giọng thiết bị'),
    exampleLabel: pair('语音 / 语法例句', 'Ví dụ ngữ âm / ngữ pháp'),
    tips: pair('小语助力', 'Gợi ý của Tiểu Ngữ'),
  },
  player: {
    controls: pair('音频控制', 'Điều khiển âm thanh'),
    pause: pair('暂停', 'Tạm dừng'),
    resume: pair('继续', 'Tiếp tục'),
    replay: pair('从头重听', 'Nghe lại từ đầu'),
    stop: pair('停止', 'Dừng'),
    rate: pair('播放速度', 'Tốc độ'),
    tts: pair('设备语音', 'Giọng đọc của thiết bị'),
    original: pair('教材原声', 'Âm thanh gốc giáo trình'),
    rateHint: pair('调整语速将在重听时生效。', 'Đổi tốc độ có hiệu lực khi nghe lại.'),
    position: (index: number, total: number) => pair(`第 ${index} / ${total} 项`, `Mục ${index} / ${total}`),
    details: pair('错误详情', 'Chi tiết lỗi'),
  },
  hanzi: {
    curriculum: {
      strokes: pair('笔画', 'Nét chữ'), order: pair('笔顺', 'Thứ tự nét'),
      structure: pair('字形结构', 'Kết cấu chữ'), radicals: pair('部首', 'Bộ thủ'),
    },
    choices: pair('选择汉字查看笔顺', 'Chọn chữ để xem thứ tự nét'),
    choiceHint: pair('重点汉字来自教材汉字部分；其余汉字来自本课词汇。', 'Chữ trọng tâm theo phần Hán tự của giáo trình; các chữ còn lại lấy từ từ vựng của bài.'),
    primary: pair('重点汉字', 'Chữ trọng tâm'),
    additional: pair('词汇中的汉字', 'Chữ trong từ vựng'),
    canvas: (character: string) => pair(`汉字 ${character} 书写区`, `Bảng viết chữ ${character}`),
    animate: pair('观看书写', 'Xem viết'), practice: pair('练习书写', 'Luyện viết'), reset: pair('重置', 'Đặt lại'),
    words: pair('本课词汇', 'Từ trong bài'),
    loading: pair('正在加载笔画…', 'Đang tải nét chữ…'),
    count: (count: number) => pair(`${count} 画`, `${count} nét`),
    stroke: (index: number) => pair(`第 ${index} 画`, `Nét ${index}`),
    strokeImage: (character: string, index: number) => pair(`${character} · 第 ${index} 画`, `${character} · nét ${index}`),
    strokes: pair('分步笔画', 'Từng nét'),
    ready: pair('查看笔画，或选择“练习书写”按笔顺练习。', 'Xem từng nét hoặc chọn “Luyện viết” để viết theo thứ tự.'),
    retry: pair('重新加载笔画', 'Thử tải lại nét chữ'),
    loadError: (character: string) => pair(`未能加载“${character}”的笔画数据。请联网后重试。`, `Chưa tải được dữ liệu nét chữ “${character}”. Hãy thử lại khi có kết nối.`),
    opening: pair('正在打开书写区…', 'Đang mở bảng viết…'),
    animating: pair('正在逐笔书写…', 'Đang viết lần lượt từng nét…'),
    animated: pair('演示结束。可以重看或练习书写。', 'Đã xem xong. Có thể xem lại hoặc luyện viết.'),
    start: (character: string) => pair(`书写 ${character}：从第 1 画开始。写错 2 次后会显示笔画提示。`, `Viết chữ ${character}: bắt đầu từ nét 1. Sau 2 lần chưa đúng, gợi ý nét sẽ xuất hiện.`),
    mistake: (stroke: number, mistakes: number) => pair(`请重写第 ${stroke} 画。已写错 ${mistakes} 次。请按图示方向和笔顺书写。`, `Thử lại nét ${stroke}. Đã viết chưa đúng ${mistakes} lần. Viết theo chiều và thứ tự trong hình.`),
    correct: (stroke: number, remaining: number) => pair(`第 ${stroke} 画正确，还剩 ${remaining} 画。`, `Đúng nét ${stroke}. Còn ${remaining} nét.`),
    complete: (character: string, mistakes: number) => pair(`已写完 ${character}。写错 ${mistakes} 次。选择“重置”继续练习。`, `Đã viết xong chữ ${character}. Số lần chưa đúng: ${mistakes}. Chọn “Đặt lại” để luyện thêm.`),
    resetDone: pair('已重置。请选择“观看书写”或“练习书写”。', 'Đã đặt lại. Chọn “Xem viết” hoặc “Luyện viết”.'),
    openError: pair('未能打开书写区。请选择“重置”重试。', 'Chưa mở được bảng viết. Chọn “Đặt lại” để thử lại.'),
    empty: pair('本节暂无汉字。', 'Chưa có chữ Hán trong nội dung này.'),
  },
  practice: {
    note: pair('复习本课词汇和对话。此处成绩与课后作业分别记录。', 'Ôn tập từ vựng và câu thoại của bài này. Kết quả này tách riêng với bài tập về nhà.'),
    basic: (count: number) => pair(`基础 · ${count} 题`, `Cơ bản · ${count} câu`),
    advanced: (count: number) => pair(`课文 · ${count} 题`, `Bài khoá · ${count} câu`),
    question: (index: number, total: number) => pair(`第 ${index}/${total} 题`, `Câu ${index}/${total}`),
    types: { 'Từ vựng': pair('词汇', 'Từ vựng'), Pinyin: pair('拼音', 'Pinyin'), 'Bài khoá': pair('课文', 'Bài khoá') } as Readonly<Record<string, BilingualCopy>>,
    // Instructions add no hints or answer material; the original prompt stays intact.
    prompts: { 'Từ vựng': '请选择正确的越南语释义。', Pinyin: '请选择正确的拼音。', 'Bài khoá': '请选择课文句子的正确译文。' } as Readonly<Record<string, string>>,
    instruction: pair('选择答案，然后点击“提交”。', 'Chọn đáp án rồi bấm “Nộp bài”.'),
    result: (correct: number, total: number, percent: number) => pair(`成绩：${correct}/${total} · ${percent}%`, `Kết quả: ${correct}/${total} · ${percent}%`),
    correct: pair('正确', 'Đúng'), missing: pair('未作答', 'Chưa chọn'), wrong: pair('未答对', 'Chưa đúng'),
    answer: pair('答案', 'Đáp án'), explain: pair('解析', 'Giải thích'),
    submit: pair('提交', 'Nộp bài'), reset: pair('重做', 'Làm lại'),
  },
};

const sectionCopy: Record<Section, BilingualCopy> = {
  vocab: pair('词汇', 'Từ vựng'), text: textbookCopy.text.heading, grammar: textbookCopy.language.grammar,
  hanzi: pair('汉字', 'Hán tự'), practice: pair('练习', 'Luyện tập'),
};
export function textbookSection(section: Section, lesson: number): BilingualCopy {
  return section === 'grammar' && lesson === 1 ? textbookCopy.language.phonetics : sectionCopy[section];
}
export const audioStatusCopy: Record<AudioStatus, BilingualCopy> = {
  idle: pair('请选择音频播放。', 'Chọn âm thanh để nghe.'), loading: pair('正在加载音频…', 'Đang tải âm thanh…'),
  playing: pair('正在播放', 'Đang phát'), paused: pair('已暂停', 'Đã tạm dừng'),
  ended: pair('播放结束', 'Đã nghe xong'), error: pair('暂时无法播放音频。', 'Chưa phát được âm thanh.'),
};
export const readingStatusCopy: Record<StoreStatus, BilingualCopy> = {
  empty: pair('暂无需要保存的数据。', 'Chưa có dữ liệu cần lưu.'), saved: pair('已保存到此设备。', 'Đã lưu trên thiết bị này.'),
  unsaved: pair('有尚未保存的更改。', 'Có thay đổi chưa lưu.'), saving: pair('正在保存…', 'Đang lưu…'),
  conflict: pair('其他标签页有更改。你的更改仍保留在此标签页。', 'Có thay đổi ở tab khác. Thay đổi của bạn vẫn còn trong tab này.'),
  corrupt: pair('无法读取数据。请在数据管理中保留原始数据。', 'Dữ liệu không đọc được. Hãy giữ lại dữ liệu gốc trong mục quản lý dữ liệu.'),
  unavailable: pair('尚未保存到设备，更改仅保留在此标签页。', 'Chưa lưu được trên thiết bị. Thay đổi chỉ ở trong tab này.'),
};

// Service messages have no stable codes yet. Match only explicit full messages,
// and retain an unknown diagnostic below a translated safe status, never guess.
const knownIssues: readonly BilingualCopy[] = [
  pair('未找到本课对话。', 'Không tìm thấy hội thoại của bài học.'),
  pair('未找到本课对话中的句子。', 'Không tìm thấy câu hội thoại của bài học.'),
  pair('音频尚未开始。请检查网络连接后点击重听。', 'Âm thanh chưa bắt đầu phát. Kiểm tra kết nối rồi bấm Nghe lại.'),
  pair('音频片段无效。', 'Đoạn âm thanh không hợp lệ.'),
  pair('音频尚未开始就已结束。请重试。', 'Âm thanh đã kết thúc trước khi bắt đầu phát. Hãy thử lại.'),
  pair('所选音频片段超出了录音范围。', 'Đoạn âm thanh nằm ngoài bản ghi.'),
  pair('录音长度不足以播放所选片段。请重试。', 'Bản ghi ngắn hơn đoạn âm thanh đã chọn. Hãy thử lại.'),
  pair('无法加载音频。请检查网络连接后重试。', 'Không tải được âm thanh. Kiểm tra kết nối rồi thử lại.'),
  pair('浏览器尚未允许播放。请点击重听。', 'Trình duyệt chưa cho phép phát. Bấm Nghe lại để thử.'),
  pair('无法播放音频。请检查网络连接后重试。', 'Không phát được âm thanh. Kiểm tra kết nối rồi thử lại.'),
  pair('暂无可播放的音频。', 'Chưa có âm thanh để phát.'),
  pair('设备语音尚未开始就已结束。请重试。', 'Giọng máy đã kết thúc trước khi bắt đầu đọc. Hãy thử lại.'),
  pair('无法使用设备语音朗读。请重试。', 'Không đọc được bằng giọng máy. Hãy thử lại.'),
  pair('浏览器不支持中文设备语音。', 'Trình duyệt không hỗ trợ giọng máy tiếng Trung.'),
  pair('暂无可朗读的文字。', 'Chưa có chữ để đọc.'),
  pair('设备尚未安装中文语音。请安装后重试。', 'Chưa có giọng máy tiếng Trung trên thiết bị. Cài giọng tiếng Trung rồi thử lại.'),
  pair('无法读取浏览器存储，草稿仅保留在此标签页。', 'Không đọc được bộ nhớ của trình duyệt. Bản nháp chỉ ở trong tab này.'),
  pair('无法读取原始数据，不会覆盖。请下载并保留原始数据。', 'Dữ liệu gốc không đọc được. Không ghi đè; hãy tải dữ liệu gốc để giữ lại.'),
  pair('其他标签页有更改。本页草稿仍在，请先备份再重新读取。', 'Có thay đổi ở tab khác. Bản nháp trong tab này vẫn còn; hãy sao lưu trước khi đọc lại.'),
  pair('存储空间已满，尚未保存。草稿仍在，可下载备份。', 'Bộ nhớ đã đầy. Chưa lưu; bản nháp vẫn còn và có thể tải bản sao lưu.'),
  pair('尚无法确认保存成功。草稿仍在，请下载备份。', 'Chưa xác nhận được việc lưu. Bản nháp vẫn còn; hãy tải bản sao lưu.'),
  pair('浏览器不支持安全写入锁，仍可下载备份。', 'Trình duyệt không hỗ trợ khóa ghi an toàn. Bạn vẫn có thể tải bản sao lưu.'),
  pair('预览已过期，请重新预览后再确认。', 'Bản xem trước đã hết hạn. Hãy xem trước lại trước khi xác nhận.'),
];
export function textbookIssue(issue: string | null, fallback: BilingualCopy): BilingualCopy {
  if (!issue) return fallback;
  return knownIssues.find(copy => copy.vi === issue) ?? pair(`${fallback.zh} ${textbookCopy.player.details.zh}：${issue}`, `${fallback.vi} ${textbookCopy.player.details.vi}: ${issue}`);
}
