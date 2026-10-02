import type { Feature } from './contracts.ts';

export const featureLabels: Record<Feature, string> = {
  home: 'Chọn bài học', textbook: 'Giáo trình', homework: 'Bài tập sau bài', listening: 'Luyện nghe',
  exercises: 'Luyện tập', vocabulary: 'Ôn từ vựng', review: 'Ôn đến hạn', progress: 'Tiến độ',
};
export const sectionLabels = { vocab: 'Từ vựng', text: 'Bài khoá', grammar: 'Ngữ âm / Ngữ pháp', hanzi: 'Hán tự', practice: 'Luyện tập' };
export const partLabels = { choice: 'Chọn đáp án', sort: 'Xếp câu', translation: 'Dịch tự viết', listening: 'Nghe chọn đáp án', translationChoice: 'Dịch chọn đáp án' };

export const sectionChinese = { vocab: '生词', text: '课文', grammar: '语音 · 语法', hanzi: '汉字', practice: '练习' };

export const featureChinese: Record<Feature, string> = { home: '选课', textbook: '教材', exercises: '综合练习', homework: '课后作业', listening: '听力', vocabulary: '词卡', review: '复习', progress: '进度' };

export const partChinese = { choice: '选择题', sort: '句子排序', translation: '翻译写作', listening: '听力选择', translationChoice: '翻译选择' };
