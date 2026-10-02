import type { BilingualCopy } from '../bilingual.ts';
const pair = (zh: string, vi: string): BilingualCopy => ({ zh, vi });
export const progressCopy = {
  reading: pair('教材阅读', 'Giáo trình'), homework: pair('课后作业', 'Bài tập'), translation: pair('我的翻译', 'Bản dịch của bạn'),
  listening: pair('独立听力', 'Luyện nghe độc lập'), vocabulary: pair('词汇与复习计划', 'Từ vựng và lịch ôn'),
  original: pair('综合练习 · 300题', 'Luyện tổng hợp · 300 câu'), pilot: pair('第9课拓展 · 30题', 'Bài 9 mở rộng · 30 câu'),
  perLesson: pair('每课进度', 'Tiến độ từng bài'), openBook: pair('打开教材', 'Mở giáo trình'), viewWork: pair('查看作业', 'Xem bài tập'),
  continueWork: pair('继续作业', 'Tiếp tục bài tập'), viewTranslation: pair('查看已提交翻译', 'Xem bản dịch đã nộp'), openTranslation: pair('开始翻译', 'Mở bài dịch'),
  review: pair('打开复习计划', 'Mở lịch ôn'), openExercise: pair('打开练习', 'Mở bài tập'),
  translationNote: pair('重做草稿与已提交内容分开保存。可打开翻译查看或打印最近一次提交；保存到本机不代表老师已收到。', 'Bản nháp làm lại được giữ riêng với bản đã nộp. Mở bài dịch để xem hoặc in bản nộp gần nhất. Lưu trên thiết bị không có nghĩa là giáo viên đã nhận.'),
  ratingNote: pair('词汇自评不是对错分数。同一汉字的不同词义或读音分别安排复习。', 'Tự đánh giá không phải điểm đúng/sai. Các nghĩa hoặc cách đọc khác nhau của cùng một dạng chữ được giữ riêng.'),
};
export const progressStatus: Record<string, BilingualCopy> = {
  empty: pair('暂无已保存的学习记录，可在数据管理中预览并导入旧记录。', 'Chưa có dữ liệu được lưu trong ứng dụng mới. Bạn có thể mở công cụ dữ liệu để nhập bản cũ.'),
  saved: pair('已保存到此设备。可下载备份后转移到其他设备。', 'Đã lưu trên thiết bị này. Có thể tải bản sao lưu để chuyển sang thiết bị khác.'),
  unsaved: pair('有更改尚未保存。离开前请等待保存，或到数据管理下载备份。', 'Có thay đổi chưa lưu trên thiết bị. Mở công cụ dữ liệu để tải bản sao lưu trước khi rời trang.'),
  saving: pair('正在保存到此设备…', 'Đang lưu dữ liệu trên thiết bị…'),
  conflict: pair('其他标签页已修改记录。下方仍为本页进度，请在数据管理中处理冲突。', 'Dữ liệu ở tab khác đã thay đổi. Tiến độ dưới đây là bản đang mở; hãy mở công cụ dữ liệu để xử lý.'),
  corrupt: pair('无法读取保存记录。下方数字不会替代旧数据；请先保留原始备份。', 'Không đọc được bản lưu. Các số bên dưới không thay thế dữ liệu cũ; hãy mở công cụ dữ liệu để giữ bản gốc.'),
  unavailable: pair('无法访问设备存储，请下载当前记录的备份。', 'Không truy cập được bộ nhớ thiết bị. Hãy mở công cụ dữ liệu để tải bản sao lưu đang mở.'),
};
export const progressMessages = {
 homeworkCount: (count:number,total:number) => pair(`作业已提交${count}/${total}题`, `Bài tập đã nộp ${count}/${total} câu`),
 reading: (visited:number,total:number,complete:number) => pair(`已打开${visited}/${total}课 · 自标完成${complete}/${total}课`, `Đã mở ${visited}/${total} bài · Tự đánh dấu hoàn thành ${complete}/${total} bài`),
 stars: (count:number) => pair(`已标记${count}个词。阅读与星标由你自定，不是作业分数。`, `${count} từ được gắn sao trong giáo trình. Dấu đọc và sao do bạn tự đánh dấu; không phải điểm bài tập.`),
 submitted: (count:number,total:number,lessons:number,lessonCount:number) => pair(`已提交${count}/${total}题 · 完成${lessons}/${lessonCount}课`, `Đã nộp ${count}/${total} câu · Hoàn thành ${lessons}/${lessonCount} bài`),
 scores: (first:number,latest:number,total:number,submitted:number) => submitted ? pair(`首次答对${first}/${total} · 最近答对${latest}/${total}（全课程）`, `Đúng lần đầu: ${first}/${total} · Đúng gần nhất: ${latest}/${total} câu toàn khóa`) : pair(`暂无成绩 · 全课程${total}道客观题`, `Chưa có điểm · ${total} câu khách quan toàn khóa`),
 objectiveNote: (count:number,total:number) => pair(`已提交${count}/${total}道选择与排序题。未提交题不计成绩；重做不改变首次成绩。`, `Đã nộp ${count}/${total} câu chọn đáp án và sắp xếp. Câu chưa nộp chưa có điểm; làm lại không thay điểm lần đầu.`),
 translation: (count:number,total:number) => pair(`已提交${count}/${total}道翻译 · 不自动评分`, `Đã nộp ${count}/${total} câu dịch · Không chấm điểm tự động`),
 drafts: (count:number,lessons:number) => pair(`未提交草稿：${lessons}课中有${count}题已填写`, `Bản nháp chưa nộp: ${count} câu đã điền hợp lệ trong ${lessons} bài`),
 listening: (count:number,total:number) => pair(`已提交${count}/${total}道听力题`, `Đã nộp ${count}/${total} câu nghe`),
 listeningWrong: (count:number) => pair(`最近仍答错${count}题，听力成绩与作业分开。`, `${count} câu gần nhất còn sai. Điểm nghe được tính riêng với bài tập.`),
 senses: (records:number,forms:number) => pair(`${records}个课内义项 · ${forms}种字形`, `${records} bản ghi nghĩa theo bài · ${forms} dạng chữ khác nhau`),
 ratings: (rated:number,total:number,again:number,hard:number,good:number) => pair(`已自评${rated}/${total}张义项卡 · 需重练${again} · 较难${hard} · 已记住${good}`, `Đã tự đánh giá ${rated}/${total} thẻ nghĩa · Cần luyện lại ${again} · Khó ${hard} · Đã nhớ ${good}`),
 due: (due:number,fresh:number,total:number) => pair(`到期${due} · 未学${fresh} · 到期或新词共${total}`, `Đến hạn ${due} · Chưa học ${fresh} · Tổng đến hạn hoặc mới ${total}`),
 extra: (submitted:number,total:number,first:number,latest:number) => pair(`已提交${submitted}/${total}道自动评分题 · 首次答对${first} · 最近答对${latest}`, `Đã nộp ${submitted}/${total} câu tự chấm · Đúng lần đầu: ${first} · Đúng gần nhất: ${latest}`),
 manual: (submitted:number,total:number) => pair(`手写翻译${submitted}/${total} · 由老师查看，不自动评分`, `Bài tự viết: ${submitted}/${total} · giáo viên xem, không có điểm tự động`),
 homeworkReview: (wrong:number,due:number) => pair(`错题${wrong} · 到期复习${due}。逐题复习不改变首次作业成绩。`, `${wrong} câu còn sai · ${due} câu đến hạn ôn. Lượt ôn từng câu không thay điểm bài nộp đầu tiên.`),
 readingState: (complete:boolean,visited:boolean,modules:number) => pair(`${complete?'自标完成':visited?'已打开':'尚未打开'} · 已打开${modules}/5部分`, `${complete?'Đã đánh dấu hoàn thành':visited?'Đã mở bài':'Chưa mở bài'} · ${modules}/5 mục giáo trình đã mở`),
 shortWork: (submitted:number,total:number,heard:number,all:number) => pair(`作业${submitted}/${total} · 听力${heard}/${all}`, `Bài tập đã nộp ${submitted}/${total} · Nghe đã nộp ${heard}/${all}`),
 lessonObjective: (first:number,latest:number,total:number,submitted:number) => submitted ? pair(`客观题：首次${first}/${total} · 最近${latest}/${total} · 已提交${submitted}/${total}`, `Khách quan: lần đầu ${first}/${total} · gần nhất ${latest}/${total} câu toàn bài · đã nộp ${submitted}/${total}`) : pair(`客观题：暂无分数 · 已提交0/${total}`, `Khách quan: chưa có điểm · đã nộp 0/${total}`),
 lessonTranslation: (submitted:number,total:number,drafts:number) => pair(`翻译：已提交${submitted}/${total} · 草稿${drafts}/${total} · 不评分`, `Dịch: đã nộp ${submitted}/${total} · nháp chưa nộp ${drafts}/${total} · không chấm điểm`),
 lessonListening: (first:number,latest:number,total:number,answered:number) => answered ? pair(`听力：首次${first}/${total} · 最近${latest}/${total} · 已提交${answered}/${total}`, `Nghe: lần đầu ${first}/${total} · gần nhất ${latest}/${total} câu toàn bài · đã nộp ${answered}/${total}`) : pair(`听力：暂无分数 · 已提交0/${total}`, `Nghe: chưa có điểm · đã nộp 0/${total}`),
};
