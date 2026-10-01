import type { Feature } from './contracts.ts';

export const featureLabels: Record<Feature, string> = {
  home: 'Chọn bài học', textbook: 'Giáo trình', homework: 'Bài tập', listening: 'Luyện nghe',
  vocabulary: 'Ôn từ vựng', review: 'Ôn đến hạn', progress: 'Tiến độ',
};
export const sectionLabels = { vocab: 'Từ vựng', text: 'Bài khoá', grammar: 'Ngữ âm / Ngữ pháp', hanzi: 'Hán tự', practice: 'Luyện tập' };
export const partLabels = { choice: 'Chọn đáp án', sort: 'Xếp câu', translation: 'Dịch tự viết' };
