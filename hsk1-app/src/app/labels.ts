import type { Feature } from './contracts.ts';

export const featureLabels: Record<Feature, string> = {
  home: 'Chọn bài học', textbook: 'Giáo trình', homework: 'Bài tập', listening: 'Luyện nghe',
  exercises: 'Bài tập gốc & ôn câu', vocabulary: 'Ôn từ vựng', review: 'Ôn đến hạn', progress: 'Tiến độ',
};
export const sectionLabels = { vocab: 'Từ vựng', text: 'Bài khoá', grammar: 'Ngữ âm / Ngữ pháp', hanzi: 'Hán tự', practice: 'Luyện tập' };
export const partLabels = { choice: 'Chọn đáp án', sort: 'Xếp câu', translation: 'Dịch tự viết' };

export const sectionChinese = { vocab: '生词', text: '课文', grammar: '语音 · 语法', hanzi: '汉字', practice: '练习' };
