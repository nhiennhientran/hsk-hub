import type { AppData } from '../storage/compatibility.ts';
import type { SourceData } from './state.ts';
export function primaryCounts(data:AppData) {
  return {
    reading:Object.keys(data.reading.modules).length,homeworkLessons:Object.keys(data.homework.lessons).length,newHomeworkLessons:Object.keys(data.homework30?.lessons??{
    }).length
  };
}
export function sourceCounts(data:SourceData) {
  return {
    activities:Object.keys(data.records).length,submissions:Object.values(data.records).reduce((n,r)=>n+r.history.length,0)
  };
}
export function pairDescription(before:{
  primary:AppData;
  source:SourceData
},after:{
  primary:AppData;
  source:SourceData
}) {
  const a=primaryCounts(before.primary),b=primaryCounts(after.primary),x=sourceCounts(before.source),y=sourceCounts(after.source);
  return {
    zh:`将替换HSK1的学习记录和教材练习记录。学习记录：教材学习 ${a.reading}→${b.reading}课；旧作业 ${a.homeworkLessons}→${b.homeworkLessons}课；新版作业 ${a.newHomeworkLessons}→${b.newHomeworkLessons}课。其他学习记录也会替换。教材练习记录 ${x.activities}→${y.activities}组，已提交记录 ${x.submissions}→${y.submissions}次。若备份中某类记录为空，导入后会清空这一类。可恢复本次替换前的两类记录；浏览器中的旧版原始记录不变。`,     vi:`Sẽ thay dữ liệu học tập và dữ liệu luyện tập theo giáo trình HSK1. Dữ liệu học tập: bài đã học trong giáo trình ${a.reading}→${b.reading}; bài tập cũ ${a.homeworkLessons}→${b.homeworkLessons} bài; bài tập phiên bản mới ${a.newHomeworkLessons}→${b.newHomeworkLessons} bài. Các dữ liệu học tập khác cũng được thay. Dữ liệu luyện tập theo giáo trình ${x.activities}→${y.activities} nhóm, số lần đã nộp ${x.submissions}→${y.submissions}. Nếu một loại dữ liệu trong bản sao lưu trống, nhập tệp sẽ xóa loại đó. Có thể khôi phục cả hai loại dữ liệu trước lần thay này; giữ nguyên bản lưu gốc cũ trong trình duyệt.`
  };
}
