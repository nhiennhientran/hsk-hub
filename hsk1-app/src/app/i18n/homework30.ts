import type { BilingualCopy } from '../bilingual.ts';
import type { Homework30Part } from '../../domain/homework30/engine.ts';
import { HOMEWORK30_COUNTS } from '../../domain/homework30/engine.ts';
import { homeworkCopy } from './homework.ts';
const copy = (zh: string, vi: string): BilingualCopy => ({ zh, vi });
export const homework30Parts: Record<Homework30Part, BilingualCopy> = {
  choice: copy('词汇与语法 · 10题', 'Từ vựng và ngữ pháp · 10 câu'), sort: copy('句子排序 · 5题', 'Xếp câu · 5 câu'),
  listening: copy('听力选择 · 5题', 'Nghe chọn đáp án · 5 câu'), translationChoice: copy('越译中选择 · 5题', 'Dịch Việt–Trung chọn đáp án · 5 câu'), translation: copy('越译中写作 · 5题', 'Dịch Việt–Trung tự viết · 5 câu'),
};
export const homework30Copy = {
  ...homeworkCopy,
  title: copy('课后作业 · 每课30题', 'Bài tập sau bài · 30 câu mỗi bài'),
  version: copy('新版30题 · v1：25题自动评分，5题教师批阅。综合练习已并入本作业。', 'Bản 30 câu · v1: 25 câu tự chấm, 5 câu giáo viên xem. Luyện tổng hợp đã được gộp vào bài tập này.'),
  legacy: copy('查看旧版作业与提交单', 'Xem bài tập và phiếu bản cũ'),
  allSubmitted: copy('本部分已全部提交。', 'Đã nộp đủ câu của phần này.'),
  part: (part: Homework30Part, locked = false) => copy(`${homework30Parts[part].zh}${locked ? ' · 未解锁' : ''}`, `${homework30Parts[part].vi}${locked ? ' · Chưa mở' : ''}`),
  locked: (part: Homework30Part) => copy(`提交“${homework30Parts[part].zh}”即可解锁，无需满分。`, `Nộp đủ ${HOMEWORK30_COUNTS[part]} câu của phần ${homework30Parts[part].vi} để mở phần này. Không cần đạt điểm tối đa.`),
  goToPart: (part: Homework30Part) => copy(`前往${homework30Parts[part].zh}`, `Đến phần ${homework30Parts[part].vi}`),
  automaticHint: copy('回答本部分全部题目后提交，即可查看结果和解析。', 'Trả lời đủ câu của phần này rồi nộp để xem kết quả và giải thích.'),
  missing: copy('请回答本部分全部题目后再提交。', 'Bạn cần trả lời đủ câu của phần này trước khi nộp.'),
  play: copy('播放课本原音', 'Nghe bản thu giáo trình'), pause: copy('暂停', 'Tạm dừng'), replay: copy('重播', 'Nghe lại'),
  audioFailed: copy('暂时无法播放，请重试。', 'Chưa phát được âm thanh. Vui lòng thử lại.'),
  transcript: copy('已提交 · 查看原文', 'Đã nộp · Xem lời thoại'),
};
