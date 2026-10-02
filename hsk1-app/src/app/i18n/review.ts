import type { BilingualCopy } from '../bilingual.ts';
const pair = (zh: string, vi: string): BilingualCopy => ({ zh, vi });

export const reviewCopy = {
  title: pair('练习与复习', 'Luyện tập và ôn tập'),
  introduction: pair('选择一种方式，继续自主练习。', 'Chọn một cách để tiếp tục tự luyện.'),
  paths: pair('选择练习', 'Chọn cách luyện tập'),
  vocabulary: pair('混课词卡', 'Thẻ từ vựng nhiều bài'),
  vocabularyDetail: pair('自由翻卡，或复习到期词。保留上次词卡。', 'Tự do chuyển thẻ hoặc ôn từ đến hạn. Tiếp tục lượt thẻ đã lưu.'),
  listening: pair('听力练习', 'Luyện nghe'),
  listeningDetail: pair('75道独立听力题，可混课练习。', '75 câu nghe độc lập, có thể luyện nhiều bài.'),
  textbook: pair('教材自练', 'Tự luyện theo giáo trình'),
  textbookDetail: (lesson: number) => pair(`第 ${lesson} 课的基础与提高练习。`, `Luyện cơ bản và nâng cao của bài ${lesson}.`),
};
