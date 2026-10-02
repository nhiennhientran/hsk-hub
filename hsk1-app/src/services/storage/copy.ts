import type { BilingualCopy } from '../../app/bilingual.ts';

/** Presentation only: never changes stored learning data or validation outcomes. */
export const dataCopy = {
  chooseFile: { zh: '选择备份文件', vi: 'Chọn tệp sao lưu' },
  "panelLabel": {
    "zh": "数据管理",
    "vi": "Quản lý dữ liệu"
  },
  "panelTitle": {
    "zh": "本机数据与备份",
    "vi": "Dữ liệu trên thiết bị và bản sao lưu"
  },
  "localOnly": {
    "zh": "数据仅保存在此浏览器中。迁移或导入不会修改旧记录，备份不包含登录状态。",
    "vi": "Dữ liệu chỉ ở trình duyệt này. Việc chuyển hoặc nhập không sửa các bản ghi cũ và không sao lưu phiên đăng nhập."
  },
  "noLocks": {
    "zh": "此浏览器不支持标签页之间的安全写入。目前仅可查看和下载备份；请使用支持此功能的浏览器导入数据。",
    "vi": "Trình duyệt này không hỗ trợ ghi an toàn giữa các tab. Chỉ xem và tải bản sao lưu; hãy dùng trình duyệt có hỗ trợ để nhập dữ liệu."
  },
  "currentData": {
    "zh": "当前数据",
    "vi": "Dữ liệu đang mở"
  },
  "previewMigration": {
    "zh": "预览旧数据",
    "vi": "Xem trước dữ liệu cũ trên thiết bị"
  },
  "exportBackup": {
    "zh": "下载当前备份",
    "vi": "Tải bản sao lưu hiện tại"
  },
  "exportOriginal": {
    "zh": "下载无法读取的原始记录",
    "vi": "Tải bản ghi gốc không đọc được"
  },
  "restore": {
    "zh": "恢复上次保留的数据",
    "vi": "Khôi phục bản đã giữ trước đó"
  },
  "reload": {
    "zh": "放弃未保存修改并重新读取",
    "vi": "Bỏ thay đổi chưa lưu và đọc lại dữ liệu"
  },
  "importLabel": {
    "zh": "导入新旧备份文件",
    "vi": "Nhập tệp sao lưu mới hoặc cũ"
  },
  "resetTitle": {
    "zh": "重置学习进度",
    "vi": "Đặt lại tiến độ học"
  },
  "resetDescription": {
    "zh": "可选择一课、一个模块或全课程。确认前请核对范围；重置前的数据可恢复。",
    "vi": "Chọn một bài, một phần hoặc toàn khóa. Xem rõ phạm vi trước khi xác nhận; bạn có thể khôi phục bản ngay trước lần đặt lại."
  },
  "lessonLabel": {
    "zh": "课程范围",
    "vi": "Phạm vi bài"
  },
  "allLessons": {
    "zh": "全课程 · 15课",
    "vi": "Toàn khóa · 15 bài"
  },
  "moduleLabel": {
    "zh": "学习模块",
    "vi": "Phần học"
  },
  "previewReset": {
    "zh": "预览重置",
    "vi": "Xem trước đặt lại"
  },
  "confirm": {
    "zh": "确认",
    "vi": "Xác nhận"
  },
  "exportPreview": {
    "zh": "下载预览数据备份",
    "vi": "Tải bản sao lưu của bản xem trước"
  },
  "cancel": {
    "zh": "取消预览",
    "vi": "Hủy xem trước"
  },
  "sourcesLabel": {
    "zh": "旧数据来源",
    "vi": "Nguồn dữ liệu cũ"
  },
  "sourcesTitle": {
    "zh": "本机或文件中的各个来源",
    "vi": "Từng nguồn trên thiết bị / trong tệp"
  },
  "sourcesDescription": {
    "zh": "条目数量包括已作答题目、复习计划、阅读标记或历史记录，不代表答对数量。未识别条目和恢复副本原样保留，不计入成绩。",
    "vi": "Số mục là câu đã có đáp án, lịch ôn, dấu đọc hoặc bản ghi lịch sử; không phải số câu đúng. Mục chưa hiểu và bản khôi phục được giữ nguyên, không cộng vào điểm."
  },
  "resetPreserved": {
    "zh": "所选范围之外的课程与模块、学员资料、偏好、旧数据来源和登录状态均保持不变。操作前的完整数据会保留一份以供恢复。",
    "vi": "Giữ nguyên các bài / phần ngoài phạm vi, hồ sơ học viên, tùy chọn, nguồn cũ và phiên đăng nhập. Một bản dữ liệu đầy đủ ngay trước thao tác sẽ được giữ để khôi phục."
  },
  "confirmReset": {
    "zh": "确认重置此范围",
    "vi": "Xác nhận đặt lại đúng phạm vi này"
  },
  "differences": {
    "zh": "与当前数据相比的变化",
    "vi": "Thay đổi so với dữ liệu đang mở"
  },
  "migrationPreserved": {
    "zh": "确认后仅补充缺失的旧进度。当前数据、草稿和正在进行的学习均保持不变，操作前的完整状态可恢复。",
    "vi": "Xác nhận chỉ bổ sung tiến độ cũ còn thiếu. Dữ liệu mới, nháp và lượt đang mở được giữ nguyên. Toàn bộ trạng thái trước thao tác có thể khôi phục."
  },
  "confirmSupplement": {
    "zh": "确认补充旧数据",
    "vi": "Xác nhận bổ sung dữ liệu cũ"
  },
  "replacementNote": {
    "zh": "确认将以此预览替换当前数据。应用会保留一份恢复副本，旧记录仍保持完整。",
    "vi": "Xác nhận sẽ thay thế dữ liệu hiện tại bằng bản xem trước này. Ứng dụng giữ một bản để khôi phục; các bản ghi cũ vẫn nguyên vẹn."
  },
  "firstImportNote": {
    "zh": "仅在确认后，预览数据才会保存到新应用。旧记录保持完整。",
    "vi": "Chỉ khi xác nhận, bản xem trước mới được lưu vào ứng dụng mới. Các bản ghi cũ vẫn nguyên vẹn."
  },
  "confirmReplace": {
    "zh": "确认替换当前数据",
    "vi": "Xác nhận thay thế dữ liệu hiện tại"
  },
  "confirmSave": {
    "zh": "确认保存预览",
    "vi": "Xác nhận lưu bản xem trước"
  },
  "completed": {
    "zh": "操作已完成并保存在本机。",
    "vi": "Thao tác đã hoàn tất và được lưu trên thiết bị."
  },
  "resetFailed": {
    "zh": "重置未完成。当前进度和已有恢复副本仍保持完整。",
    "vi": "Chưa đặt lại được dữ liệu. Tiến độ đang mở và bản khôi phục trước đó vẫn nguyên vẹn."
  },
  "stalePreview": {
    "zh": "预览已过期或其他标签页的数据已改变。请重新读取数据并再次预览。",
    "vi": "Bản xem trước đã cũ hoặc có thay đổi ở tab khác. Hãy đọc lại dữ liệu và xem trước lần nữa."
  },
  "importFailed": {
    "zh": "预览尚未保存。请下载预览备份以保留要导入的数据。",
    "vi": "Chưa lưu được bản xem trước. Hãy tải bản sao lưu của bản xem trước để giữ lại dữ liệu muốn nhập."
  },
  "restoreFailed": {
    "zh": "恢复未完成。当前数据和恢复副本仍保留。",
    "vi": "Chưa khôi phục được dữ liệu. Bản đang mở và bản khôi phục vẫn được giữ lại."
  },
  "resetError": {
    "zh": "重置未完成，当前进度仍保持不变。",
    "vi": "Chưa đặt lại được dữ liệu. Tiến độ đang mở vẫn được giữ nguyên."
  },
  "importError": {
    "zh": "数据尚未保存。若需保留导入的数据，请下载预览备份。",
    "vi": "Chưa lưu được dữ liệu. Hãy tải bản sao lưu của bản xem trước nếu muốn giữ dữ liệu nhập."
  },
  "restoreError": {
    "zh": "恢复未完成。请下载当前备份以保留数据。",
    "vi": "Chưa khôi phục được dữ liệu. Hãy tải bản sao lưu hiện tại để giữ lại dữ liệu."
  },
  "noLegacy": {
    "zh": "此设备上未找到旧数据，未修改任何记录。",
    "vi": "Không tìm thấy dữ liệu cũ trên thiết bị này. Không có bản ghi nào bị thay đổi."
  },
  "migrationTitle": {
    "zh": "旧应用数据迁移预览",
    "vi": "Xem trước dữ liệu chuyển từ ứng dụng cũ"
  },
  "migrationError": {
    "zh": "无法读取或迁移旧数据，旧记录仍保持不变。",
    "vi": "Không đọc hoặc chuyển được dữ liệu cũ. Các bản ghi cũ vẫn được giữ nguyên."
  },
  "readingFile": {
    "zh": "正在读取备份文件…",
    "vi": "Đang đọc tệp sao lưu…"
  },
  "invalidFile": {
    "zh": "文件无效或备份格式不受支持。数据尚未改变。",
    "vi": "Tệp không hợp lệ hoặc không thuộc định dạng sao lưu được hỗ trợ. Chưa thay đổi dữ liệu."
  },
  "resetPreviewError": {
    "zh": "无法生成重置预览，学习进度尚未改变。",
    "vi": "Không tạo được bản xem trước đặt lại. Chưa thay đổi tiến độ."
  },
  "scopeChanged": {
    "zh": "范围已改变，请重新预览后再确认。",
    "vi": "Phạm vi đã đổi. Hãy xem trước lại trước khi xác nhận."
  },
  "cancelled": {
    "zh": "已取消预览，数据尚未改变。",
    "vi": "Đã hủy xem trước. Chưa thay đổi dữ liệu."
  },
  "exportError": {
    "zh": "无法生成备份，当前数据仍保持不变。",
    "vi": "Không tạo được bản sao lưu. Dữ liệu đang mở vẫn được giữ nguyên."
  },
  "exportPreviewError": {
    "zh": "无法生成预览备份，数据尚未改变。",
    "vi": "Không tạo được bản sao lưu của bản xem trước. Chưa thay đổi dữ liệu."
  },
  "reloaded": {
    "zh": "已重新读取本机数据，未保存的修改已放弃。",
    "vi": "Đã đọc lại bản trên thiết bị; bản thay đổi chưa lưu đã được bỏ."
  }
} satisfies Record<string, BilingualCopy>;
export const dataStatusCopy = {
  "empty": {
    "zh": "新应用暂无数据，旧数据尚未改变。",
    "vi": "Chưa có dữ liệu trong ứng dụng mới. Dữ liệu cũ chưa bị thay đổi."
  },
  "saved": {
    "zh": "数据已保存在此设备。",
    "vi": "Đã lưu dữ liệu trên thiết bị này."
  },
  "unsaved": {
    "zh": "修改尚未保存。离开页面前请下载备份。",
    "vi": "Chưa lưu được thay đổi. Hãy tải bản sao lưu trước khi rời trang."
  },
  "saving": {
    "zh": "正在保存数据…",
    "vi": "Đang lưu dữ liệu…"
  },
  "conflict": {
    "zh": "其他标签页的数据已改变，当前页面尚未覆盖该数据。",
    "vi": "Dữ liệu đã thay đổi ở tab khác. Bản đang mở chưa ghi đè dữ liệu đó."
  },
  "corrupt": {
    "zh": "无法读取当前记录，请下载原始记录以保留数据。",
    "vi": "Bản ghi hiện tại không đọc được. Hãy tải bản gốc để giữ lại dữ liệu."
  },
  "unavailable": {
    "zh": "无法访问本机存储，仍可下载备份。",
    "vi": "Không truy cập được bộ nhớ thiết bị. Bạn vẫn có thể tải bản sao lưu."
  }
} satisfies Record<string, BilingualCopy>;
export const dataSummaryCopy = {
  "readingVisited": {
    "zh": "已打开的教材课次",
    "vi": "Bài giáo trình đã mở"
  },
  "readingCompleted": {
    "zh": "已完成的教材课次",
    "vi": "Bài giáo trình đã hoàn thành"
  },
  "masteredWords": {
    "zh": "已标记掌握的词语",
    "vi": "Từ đã đánh dấu thuộc"
  },
  "homeworkSubmitted": {
    "zh": "已提交的作业",
    "vi": "Bài tập đã nộp"
  },
  "automaticSubmitted": {
    "zh": "已提交的自动评分作业",
    "vi": "Bài chấm tự động đã nộp"
  },
  "automaticFirstCorrect": {
    "zh": "首次提交答对题数",
    "vi": "Số câu đúng ở lần nộp đầu"
  },
  "automaticLatestCorrect": {
    "zh": "最近提交答对题数",
    "vi": "Số câu đúng ở lần nộp mới nhất"
  },
  "manualSubmitted": {
    "zh": "已提交待教师查看的翻译",
    "vi": "Bài dịch đã nộp để giáo viên xem"
  },
  "listeningSubmitted": {
    "zh": "已提交的听力题",
    "vi": "Câu nghe đã nộp"
  },
  "listeningFirstCorrect": {
    "zh": "首次答对的听力题",
    "vi": "Câu nghe đúng ở lần đầu"
  },
  "listeningLatestCorrect": {
    "zh": "最近答对的听力题",
    "vi": "Câu nghe đúng ở lần mới nhất"
  },
  "scheduledSenses": {
    "zh": "有复习计划的义项卡片",
    "vi": "Thẻ nghĩa có lịch ôn"
  },
  "legacySources": {
    "zh": "保留的旧数据来源",
    "vi": "Bản dữ liệu cũ được giữ lại"
  },
  "exerciseSubmitted": {
    "zh": "已提交的补充练习题",
    "vi": "Câu luyện bổ sung đã nộp"
  },
  "exerciseDrafts": {
    "zh": "有草稿的补充练习题",
    "vi": "Câu luyện bổ sung đang có nháp"
  }
} satisfies Record<string, BilingualCopy>;
export const dataModuleCopy = {
  "all": {
    "zh": "所有学习模块",
    "vi": "Tất cả phần học"
  },
  "textbook": {
    "zh": "教材与掌握标记",
    "vi": "Giáo trình và dấu từ đã thuộc"
  },
  "homework": {
    "zh": "作业",
    "vi": "Bài tập"
  },
  "listening": {
    "zh": "听力练习",
    "vi": "Luyện nghe"
  },
  "vocabulary": {
    "zh": "词汇复习计划",
    "vi": "Lịch ôn từ vựng"
  },
  "exercises": {
    "zh": "原版练习、第9课拓展与句子复习",
    "vi": "Bài gốc, Bài 9 mở rộng và ôn câu"
  }
} satisfies Record<string, BilingualCopy>;

export const dataLessonCopy = (lesson: number): BilingualCopy => ({ zh: `第${lesson}课`, vi: `Bài ${lesson}` });
export const dataFileCopy = (filename: string, legacy = false): BilingualCopy => ({
  zh: `${legacy ? '旧备份' : '备份'}文件预览：${filename}`,
  vi: `${legacy ? 'Xem trước tệp cũ' : 'Xem trước tệp'} ${filename}`,
});
export const dataSourceCountCopy = (understood: number, unsupported: number, bytes: number): BilingualCopy => ({
  zh: `${understood} 项已识别 · ${unsupported} 项仅保留原始数据 · ${bytes} 字节`,
  vi: `${understood} mục đã hiểu · ${unsupported} mục chỉ giữ bản gốc · ${bytes} byte`,
});
export const dataResetCountCopy = (count: number): BilingualCopy => ({
  zh: `将重置 ${count} 条记录或正在进行的学习。所选范围内的首次成绩、最近成绩和草稿将从当前进度中移除。`,
  vi: `${count} bản ghi / lượt đang mở sẽ được đặt lại. Điểm lần đầu, lần gần nhất và nháp trong phạm vi đã chọn sẽ bị xóa khỏi tiến độ hoạt động.`,
});
export const dataDifferenceCopy = (label: BilingualCopy, before: number, after: number): BilingualCopy => ({
  zh: `${label.zh}：${before} → ${after}`, vi: `${label.vi}: ${before} → ${after}`,
});
/** Keep the original Vietnamese intact for existing consumers and evidence. */
export const dataWarning = (copy: BilingualCopy): string => `${copy.zh}\n${copy.vi}`;

const storageIssues: readonly BilingualCopy[] = [
  { zh: '无法读取浏览器存储，草稿仅在当前标签页中。', vi: 'Không đọc được bộ nhớ của trình duyệt. Bản nháp chỉ ở trong tab này.' },
  { zh: '无法读取原始数据。不会覆盖；请下载原始记录以保留数据。', vi: 'Dữ liệu gốc không đọc được. Không ghi đè; hãy tải dữ liệu gốc để giữ lại.' },
  { zh: '其他标签页已有修改。当前草稿仍保留；重新读取前请先备份。', vi: 'Có thay đổi ở tab khác. Bản nháp trong tab này vẫn còn; hãy sao lưu trước khi đọc lại.' },
  { zh: '存储空间已满，尚未保存。草稿仍保留，可下载备份。', vi: 'Bộ nhớ đã đầy. Chưa lưu; bản nháp vẫn còn và có thể tải bản sao lưu.' },
  { zh: '尚无法确认保存成功。草稿仍保留，请下载备份。', vi: 'Chưa xác nhận được việc lưu. Bản nháp vẫn còn; hãy tải bản sao lưu.' },
  { zh: '此浏览器不支持安全写入锁，仍可下载备份。', vi: 'Trình duyệt không hỗ trợ khóa ghi an toàn. Bạn vẫn có thể tải bản sao lưu.' },
  { zh: '预览已过期，请重新预览后再确认。', vi: 'Bản xem trước đã hết hạn. Hãy xem trước lại trước khi xác nhận.' },
];
const storageIssueByVietnamese = new Map(storageIssues.map(copy => [copy.vi, copy]));
/** Exact controlled messages only; unfamiliar diagnostics are retained verbatim. */
export const dataStorageIssueCopy = (detail: string): BilingualCopy => storageIssueByVietnamese.get(detail) ?? {
  zh: '存储出现问题。以下为保留的原始诊断信息：', vi: `Có vấn đề với bộ nhớ. Chi tiết gốc được giữ lại: ${detail}`,
};
export const dataOriginalWarning = (detail: string): string => dataWarning({
  zh: '旧数据校验提示。以下原始诊断信息保留供核对：', vi: `Lưu ý khi kiểm tra dữ liệu cũ. Chi tiết gốc: ${detail}`,
});

/** The domain owns the counts and wording; this only pairs their public warnings. */
export function dataExerciseWarnings(warnings: readonly string[], skipped: number): string[] {
  const copies: readonly BilingualCopy[] = [
    { zh: 'v2 学习数据没有内容指纹。仅按已核对的原题库 069f9d 映射；成绩从答案重新计算，不采信文件中的分数。', vi: 'Bản học tập v2 không có dấu vân tay nội dung. Chỉ ánh xạ theo ngân hàng gốc 069f9d đã đối chiếu; điểm được tính lại từ đáp án, không tin số điểm trong tệp.' },
    { zh: '只有分数的旧历史记录不会变成新的提交记录。原始来源仍保留供核对。', vi: 'Lịch sử cũ chỉ có số điểm không được biến thành lần nộp mới. Nguồn gốc vẫn được giữ nguyên để đối chiếu.' },
    { zh: `${skipped} 题未覆盖：内容已改变、来源不匹配或已有新的学习记录。原始数据仍保留。`, vi: `${skipped} câu không chép đè: nội dung đã sửa, nguồn chưa khớp hoặc đã có lượt học mới. Bản gốc được giữ lại.` },
  ];
  const byVietnamese = new Map(copies.map(copy => [copy.vi, copy]));
  return warnings.map(warning => { const copy = byVietnamese.get(warning); return copy ? dataWarning(copy) : dataOriginalWarning(warning); });
}
