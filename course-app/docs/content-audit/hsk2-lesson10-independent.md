# Independent HSK2 lesson10 review

Date: 2026-10-02 UTC. Reviewer: separate Codex AI worker from author baseline `62be277`. Scope: lesson10 and this audit only. This is an independent AI source/language/assessment review, not qualified-teacher/native-speaker certification.

## Source coverage

Opened actual rendered textbook PDF pages **99,100,101,102,103,104,105,106,107** (printed84–92), and independently rendered and opened supplied answer PDF pages **13–14**. Checked all three objectives, both warmups, four full texts (23 spoken/narrative blocks plus one printed scene-transition ellipsis), sixteen source questions, fifteen lexical/POS-sense records from fourteen numbered headwords, three grammar points/nine examples/nine completion tasks, the 呢 tip, five integrated gaps, four picture frames/descriptions and complete pair-work instruction/example. No culture panel is printed. Exact context/audio-label pages for texts3–4 precede full text pages and are retained.

Source answer keys agree: text1 C/B; text2 A/B; text3 C/B; text4 F/T and B/C; integrated bank E/D/A/C/B. Warmup E/D/B/F/A/C. Chinese source wording and source answer order remain unchanged. All Vietnamese is editorial translation; grammar-example pinyin is editorial. The textbook prints **hǎohǎo** on PDF102, so the earlier hǎohāo transcription was corrected. Warmup picture description now uses neutral “two people” rather than an unsupported gender identification.

## Assessment

Exactly30 original homework items in10/5/5/5/5 distribution, plus4 independent listening items. All5 orderings have at least5 meaningful chunks, explicit start/meaning constraints and anchored final punctuation. Reconstructed all answers; no duplicate chunks or multiple equally suitable orders found. Homework13 now has a new person/time/action instead of copying the printed grammar sentence. Homework10 now explicitly requests both meaning and topic-first structure; plausible correct-meaning/wrong-structure and opposite-meaning distractors replace malformed strings. Homework09 uses plausible human actions. Translation23 now expresses the new school term, not just the start of a generic study session.

All20 homework MC keys and4 separate listening keys checked against options/explanations; separate listening asks distinct facts. All5 manual-writing objects contain only id/part/prompt/focus/source, neutral Chinese instruction, Vietnamese task with no Chinese answer chunks, and neutral focus. No writing answers or teacher reference answers are published. Supplemental questions carry supplemental provenance.

## Audio evidence

Independently rehashed tracks10-1 through10-8: **8/8 SHA256 matches**. Reran complete ffmpeg decode: **8/8 exit0, no decoder errors**. Read every segment of all8 faster-whisper-small-int8 outputs. Odd tracks cover their source dialogues/narrative in sequence; even tracks match full ordered word lists. ASR’s 合笔 in10-7 and 呀 in10-5 are not authority to overwrite source 和笔/啊. All9 listening questions are supported by source text and mapped recording/ASR passage. Whole word-list audio is retained, without falsely claiming single-word cuts. This is machine-assisted semantic/mapping evidence, not human listening/tone certification.

## Validation

`HSK_PILOT=1 node tools/validate-content.mjs` passed with zero issues from course-app after edits (ten current lessons). Focused manual-writing/order/key assertions also passed. No app code, other lessons, raw source scans, answer package or remote publication was modified by this review.

## Changed public fields

- `lesson.reviewStatus.reviewer`: `"author-reviewed; independent reviewer pending"` → `"Independent Codex AI content-review worker; separate from lesson10 author"`
- `lesson.reviewStatus.notes`: `["Chinese source content checked against all lesson page images; source pinyin retained and editorial pinyin checked.", "All Vietnamese text is an editorial translation, not printed textbook content.", "Original homework and independent listening questions are supplemental.", "Final independent source, Vietnamese, pinyin, audio and pedagogical review is pending.", "All textbook PDF pages99–107 and answer PDF13–14 were visually inspected.", "There is no culture/video panel in lesson10; original classroom activity is preserved.", "14 numbered vocabulary headwords produce15 POS-sense records because 考试 has explicit verb and noun uses.", "All8 original audio transcripts were compared with printed source; ASR errors include 合笔 for 和笔. This is supporting evidence, not human listening certification."]` → `["Independently opened textbook PDF99–107 (printed84–92) and answer PDF13–14; checked complete source, Vietnamese, pinyin and assessments.", "Printed 好好 on PDF102 reads hǎohǎo; corrected the second syllable from hāo to hǎo. Grammar-example pinyin and all Vietnamese remain editorial supplements.", "Source has14 numbered headwords and15 POS-sense records, with separate noun/verb 考试. All printed tasks and the 呢 tip are preserved; no culture panel is printed.", "All8 original audio SHA256 matches and full ffmpeg decodes independently passed. All8 ASR transcripts/segments support source-track mappings and listening answers.", "Machine-assisted audio evidence is not human/native listening or pronunciation certification; qualified-teacher/native-speaker certification remains outside this review.", "Ordering context and distinct meaning-based distractors were reviewed; all5 manual-writing tasks remain answer-free."]`
- `lesson.homework[8].options[1]`: `"考"` → `"哭"`
- `lesson.homework[8].options[2]`: `"错"` → `"睡"`
- `lesson.homework[9].prompt.zh`: `"保持“这件事”为全句主语，后面用主谓短语，哪句合适？"` → `"用主谓谓语句表达“他知道这件事”，并以“这件事”开头，应选哪句？"`
- `lesson.homework[9].prompt.vi`: `"Giữ 这件事 làm chủ ngữ chính và dùng cụm chủ–vị phía sau, chọn câu phù hợp."` → `"Diễn đạt “anh ấy biết chuyện này” bằng câu có cụm chủ–vị làm vị ngữ, mở đầu với 这件事. Chọn câu phù hợp."`
- `lesson.homework[9].options[0]`: `"知道这件事他。"` → `"他知道这件事。"`
- `lesson.homework[9].options[2]`: `"他这件事知道是。"` → `"这件事他不知道。"`
- `lesson.homework[12].prompt.zh`: `"按越南语意思排列词块；带标点的词块位置固定。"` → `"按越南语意思，以“哥哥”开头排列词块；带句号的词块放在句末。"`
- `lesson.homework[12].prompt.vi`: `"Bắt đầu bằng “我们”: Tuần sau chúng tôi sắp thi rồi. (Khối có dấu câu phải giữ đúng vị trí trong câu.)"` → `"Bắt đầu bằng 哥哥: Tháng sau anh trai sắp đi Bắc Kinh rồi. (Khối có dấu chấm đặt cuối câu.)"`
- `lesson.homework[12].tokens[0]`: `"下星期"` → `"下个月"`
- `lesson.homework[12].tokens[1]`: `"我们"` → `"哥哥"`
- `lesson.homework[12].tokens[3]`: `"考试"` → `"去北京"`
- `lesson.homework[12].explanation.zh`: `"我们下星期就要考试了。"` → `"哥哥下个月就要去北京了。"`
- `lesson.homework[12].explanation.vi`: `"Trạng ngữ thời gian đứng trước 就要考试了."` → `"Sau chủ ngữ là thời gian 下个月, rồi 就要 + hành động + 了."`
- `lesson.homework[22].prompt.vi`: `"Chúng tôi sắp bắt đầu học rồi."` → `"Chúng tôi sắp bước vào kỳ học mới rồi."`
- `lesson.homework[22].explanation.vi`: `"快要开学了 nói ngày bắt đầu học sắp đến."` → `"快要开学了 nói ngày bắt đầu năm hoặc kỳ học sắp đến."`
- `lesson.texts[1].lines[2].py`: `"Zhèxiē cí yào hǎohāo kànkan."` → `"Zhèxiē cí yào hǎohǎo kànkan."`
- `lesson.warmup[0].items[1].zh`: `"图片描述（编辑补充）：学生在考场答题；红色叉号；数学题；几本笔记本；房间的门；两位女子坐在沙发上笑。"` → `"图片描述（编辑补充）：学生在考场答题；红色叉号；数学题；几本笔记本；房间的门；两个人坐在沙发上笑。"`
- `lesson.warmup[0].items[1].vi`: `"Mô tả tranh (biên tập bổ sung): học sinh làm bài thi; dấu chéo đỏ; các bài toán; vài quyển vở; cửa phòng; hai phụ nữ ngồi cười trên ghế sofa."` → `"Mô tả tranh (biên tập bổ sung): học sinh làm bài thi; dấu chéo đỏ; các bài toán; vài quyển vở; cửa phòng; hai người ngồi cười trên ghế sofa."`
