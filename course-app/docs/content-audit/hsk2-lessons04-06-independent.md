# Independent HSK2 content review: lessons 04–06

- Date: 2026-10-02 UTC
- Baselines: lesson 04 author commit `a0b196e`; lessons 05–06 author commit `5f26158`
- Reviewer: independent Codex AI content-review worker, separate from the authors of those baselines
- Owned files: lessons 04, 05 and 06 JSON plus this report only
- Result: independent source-pixel, Chinese/pinyin, Vietnamese, provenance, original-assessment and automated-audio-evidence review completed with corrections below. **This is not qualified-teacher/native-speaker certification or full human listening/pronunciation certification**

## Actual source inspection and coverage

Every actual PNG image for one-based textbook PDF pages **44–70** was opened and inspected, covering printed pages **29–55**. OCR was only a locating aid. The supplied original answer PDF was independently rendered with PyMuPDF and its actual **pages 5, 6, 7, 8 and 9** were opened. Answer page 9 is required to finish lesson 6; stopping at page 8 would omit its final keys. Enlarged image crops were also opened to resolve the printed tone of 个 in PDF 48, 62, 64 and 67. All source files were located using the supplied source manifest. No raw scans, answer PDF, source packages, ASR outputs or extracted audio were added to the repository.

| Lesson | Textbook PDF pages actually viewed | Printed pages | Answer pages covering lesson | Texts / turns | Vocabulary records | Grammar | Homework | Separate listening | Other sections |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 04 | 44,45,46,47,48,49,50,51 | 29–36 | 5–6 | 4 / 19 | 16 | 3 | 30 | 4 | 3 |
| 05 | 52,53,54,55,56,57,58,59,60 | 37–45 | 6–7 | 4 / 22 | 20 | 3 | 30 | 4 | 4 |
| 06 | 61,62,63,64,65,66,67,68,69,70 | 46–55 | 7–9 | 4 / 22 | 15 | 3 | 30 | 4 | 6 |

This unit retains **12 complete texts / 63 turns or narrative blocks, 48 printed text questions, 51 actual lexical records, nine grammar points with 36 source examples and 27 source dialogue-completion tasks, 90 original homework questions and 12 independent listening questions**. All objectives, six warm-ups, 15 integrated word-bank gaps, 12 picture sentence frames, three classroom role-plays and their example exchanges were checked. The text Chinese and speaker attribution needed no replacement. All 30 printed objective text keys agree with the supplied answer PDF; the 15 gap-bank answers also agree.

- Lesson 4 keys: text 1 A/A, text 2 C/C, text 3 B/B, text 4 F/T and A/B; gap bank A/D/E/B/C
- Lesson 5 keys: text 1 C/C, text 2 C/B, text 3 C/A, text 4 F/F and A/C; gap bank A/B/E/D/C
- Lesson 6 keys: text 1 C/B, text 2 A/C, text 3 C/C, text 4 F/F and A/B; gap bank A/E/D/C/B

These are source-exercise keys, not answers to the manual-writing tasks. Printed objective options were not reordered. Image-only tasks remain explicitly labelled editorial picture descriptions with supplemental provenance. Lesson 5’s directional warm-up retains the speaker-position caveat; it is not falsely represented as an independently gradeable image exercise without that viewpoint.

### Lexical count and unit review

Lesson 4 has 16 printed entries. Lesson 5 has 17 numbered entries plus the separately printed headword 下面; splitting the printed adverb/adjective senses of 快 and preposition/conjunction senses of 跟 yields 20 records. Lesson 6 has 14 numbered entries, with noun and verb senses of 画 split into 15 records. These are counted lexical records, not syllabus-count estimates or repeated-word padding.

The entire lesson-6 unit review (PDF 70 / printed 55) was compared row by row: two vocabulary fields; nine distinct grammar rows and their exact Chinese example sentences; separate 理解 and 会用 checks; and the final improvement field. All are present, and no review rows were condensed away.

## Source-fidelity, pinyin, Vietnamese and provenance corrections

1. **Printed grammar word:** lesson 5 grammar 3 example 2 printed at PDF 58 / page 43 is `都8点半了，你还不起来吗？`. The baseline silently used 起床. Restored 起来 and changed its editorial pinyin to qǐlái
2. **Printed 个 tone:** restored source gè from baseline neutral ge in lesson 4 text 3 line 1 (PDF 48), lesson 6 text 1 lines 2 and 6 (PDF 62), text 2 line 8 (PDF 64), and text 4 (PDF 67). Also aligned the repeated editorial pinyin of lesson 6 grammar 1 example 1. Enlarged pixels make these fourth-tone marks unambiguous. This preserves printed orthography; it does not assert that neutral ge is impossible in natural speech
3. **Complete 的 explanations:** restored all three printed parenthetical noun expansions from PDF 49 / page 34 alongside lesson 4 grammar 3 examples: the three schoolbag-colour phrases, 买的面包, and 便宜的衣服. Vietnamese and pinyin for those annotations are editorial
4. **Context provenance:** added the missing explicit source objects to all four lesson-4 contexts: PDF **45,46,48,50**. Its text-2 context is on the preceding page, not on the dialogue page 47. Lesson-5 and lesson-6 context mappings were already correct
5. **Vietnamese precision/naturalness:** changed lesson 5’s hotel context from the physically misleading “Dưới tầng trệt” to “Ở tầng dưới”; improved the corresponding below/up/down expressions; translated 小妹妹 as a little girl without unnecessarily asserting a family relationship; improved the lesson-4 food/cooking gap and lesson-6 rest/advice and drawing gap so filling the blanks produces natural Vietnamese. All Vietnamese remains explicitly editorial
6. **Exact supporting pages:** lesson-6 hw07 and hw23 refer directly to the breakfast example printed on PDF 67 / page 52 and now use that page rather than the preceding grammar-introduction page

Relevant readings were checked across texts and words: particle 过 guo in lesson 4 versus verb 过 guò in lesson 6; 更 gèng, 绿色 lǜsè, 长 cháng, 地 de, 还 hái, 给 gěi, 觉 jiào in 睡一觉, neutral syllables, names, syllable separators and source 一/不 tone-sandhi. Source numbers and narrative events were preserved. The distinction between buying a cake and cooking noodles was not lost. The unusual printed three-person role-play’s A/B turn arrangement on PDF 69 was retained, rather than silently rewritten.

## Original-assessment review and repairs

Each lesson has exactly **10 vocabulary/grammar choice + 5 ordering + 5 original-audio choice + 5 Vietnamese-to-Chinese choice + 5 manual Vietnamese-to-Chinese writing**. Each also retains four separately identified listening questions. All 102 original tasks have supplemental provenance; the printed exercises remain separate.

### Key ambiguities removed

- Lesson 6 hw13’s separate 送 / 给 tokens allowed both “送给姐姐” and “给姐姐送” with the requested meaning. Combined 送给 into one token; the task still has six meaningful tokens
- Lesson 6 hw14 allowed both 在家好好地 and 好好地在家. The bilingual prompt now explicitly asks for the place phrase before the manner phrase, and the former long opening chunk is split to retain seven meaningful tokens
- Lesson 6 hw15 allowed either 我们 as the first clause’s subject or as the second clause’s subject. It now uses 我们想 as one chunk and explicitly anchors the second clause, retaining five tokens
- Lesson 4 hw14 and hw15 now state the expected verb/object relationship in both languages, excluding equally natural topic-fronting alternatives that the old one-key task did not accept
- Lesson 4 hw06 now supplies the actual rain/cancellation context before asking for cause-before-result order, so merely putting 因为 first cannot make the reversed-causality distractor correct

### Quality and answer-leak improvements

- Replaced weak or malformed distractors in selected lesson-4 recognition and translation questions with distinctions involving experience, desire, colour, polarity, degree, object reference and shopping action. Its hw07 now tests the reference of the 的 phrase in the stated bag context
- Lesson 4 hw16’s Chinese prompt now asks whether the two characters had visited the mall, matching its Vietnamese and the recording. The old formulation asked awkwardly whether the mall had previously opened to receive them
- Lesson 4 hw24 now tests the taught 更 comparison directly and no longer introduces a required 比 structure outside this lesson’s instruction
- Lesson 5 hw17’s Chinese listening question was made idiomatic while preserving the same listening target. Its hw11 uses 酒店楼下, avoiding the misleading literal “under the hotel” reading of 酒店下面
- Changed lesson-5 ordering hw12–14 details so their answers cannot be copied verbatim from earlier choice items. Changed lesson-4 manual prompts hw29–30, which had substantially duplicated earlier ordering prompts
- Lesson 6 hw05 and hw10 now use ordinary action/time contrasts rather than obviously nonsensical alternatives; hw08 contrasts the newly taught verb sense of 过 with the earlier aspect particle and another verb sense. Hw17 now accurately describes opening/seeing the gift
- All 15 writing payloads were checked recursively: only id, part, prompt, focus and source. Their Chinese instruction is neutral; their Vietnamese prompt contains no target Chinese; focus is the neutral Vietnamese `Dịch viết tổng hợp`. No answer, model, key, solution, explanation, options or tokens are stored in those objects

| Lesson | Homework choice-key counts A/B/C | Ordering token counts |
| --- | --- | --- |
| 04 | 7 / 7 / 6 | 5,7,5,7,6 |
| 05 | 7 / 6 / 7 | 6,6,6,6,6 |
| 06 | 6 / 7 / 7 | 6,6,6,7,5 |

Keys are not a mechanical A/B/C cycle. Every final key was reconstructed/read against its displayed options or tokens. Every ordering has distinct chunks, preserved punctuation, and enough context/explicit constraints for its one expected answer. There are no duplicate full task signatures within these 102 tasks; the repository validator also checks across the currently authored corpus. Grammar naturally recurs across formats, but the directly copyable supplemental duplicates identified above were removed. Some basic form-recognition questions remain deliberately easy. Manual writing can have several valid natural answers and is not forced into an automatic single-sentence key.

## Independent audio evidence and exact limits

All original tracks **4-1–4-8, 5-1–5-8 and 6-1–6-8 (24/24)** independently SHA256-match the ingestion manifest and pass full ffmpeg decode with exit 0 and no decoder errors. Printed odd-track text and even-track vocabulary labels were compared to source pixels. Vocabulary buttons correctly refer to whole original word-list recordings, including the same list for two POS senses; no isolated-word cut is claimed.

All **24** supplied `faster-whisper-small-int8` JSON transcript outputs, including every segment, were read and compared with the corresponding printed texts/lists. All 12 odd-track transcripts cover the beginning, intervening content and ending of the intended source text. All 12 even-track transcripts account for the expected ordered headwords, allowing the recognition issues below. No evidence of a wrong-track mapping or omitted content-bearing passage was found. All 27 original audio questions (15 homework + 12 independent) are supported by the relevant printed text and the corresponding ASR-recognized passage.

| Track(s) | Recognition observation and disposition |
| --- | --- |
| 4-1, 4-7 | Traditional characters; source meaning retained; 4-1 omits 儿 in 点儿 |
| 4-2 | ASR 调 where the source headword is 条; the expected list position and homophonous reading explain the recognition substitution |
| 4-3, 4-5, 4-6, 4-8 | Expected complete text/list content; punctuation/segment boundaries differ only |
| 4-4 | ASR 是 where source list has 试; same shì reading, not a reason to rewrite the printed word |
| 5-1, 5-3, 5-7 | Source names recognized as 佳玥/佳悦, 医学姐/依学姐 and 依妃; same-name-context mappings remain source-backed; 他/她 and traditional-script differences do not establish spoken errors |
| 5-2 | All nine spoken headwords accounted for; 一会儿 recognized without 儿; 快 is said once for its two printed POS senses |
| 5-4, 5-6, 5-8 | Expected complete lists; 跟 is said once for its two printed POS senses |
| 5-5 | Complete dialogue and meal/tea roles supported; 点儿 recognized without 儿 |
| 6-1, 6-3, 6-4, 6-8 | Expected complete text/list; script, punctuation and 点儿 orthography differences only |
| 6-2 | 忘 recognized as homophonous 望; the list otherwise matches, and 画 is said once for both POS senses |
| 6-5 | Complete food list, younger-brother call, outing and closing birthday statement; 面条儿 recognized without 儿 |
| 6-6 | 地 recognized as 的; this does not resolve a written character distinction from speech, so source 地 de is preserved |
| 6-7 | Complete diary events present; 舒舒服服 recognized as 叔叔夫夫, 地 as 的, plus missing 儿 and script differences. No task depends on accepting those written ASR errors |

Automated recognition, file integrity and decoder success are evidence of mapping/coverage and task support, **not a human/native listening check or pronunciation/tone certification**. No new human-listening claim is made. The lesson review-status notes explicitly distinguish these levels of evidence. Source pinyin remains authoritative over ASR-generated spellings.

Culture videos **5-1 and 6-1 are absent** from the supplied media. Their printed topics and image descriptions are retained with honest resource notes. The similarly numbered MP3s are not substituted for video. Lesson 4 has **no printed culture/video panel** on PDF 44–51, so no invented filler section was added. Lesson 6’s separate noodle/long-life tip on PDF 66 / printed 51 remains intact.

## Validation and boundaries

- `HSK_PILOT=1 node tools/validate-content.mjs`: **passed, zero issues** after the corrections and review-status update; this is pilot mode, not a complete-course release assertion
- Additional independent checks: exact 10/5/5/5/5 distribution; 15 uniquely tokenized ordering keys reconstruct the displayed solution; all choice answers are in range and have three distinct options; all writing payload fields and hints checked; 102 task IDs/signatures unique; all original listening tracks are the correct odd numbers; nine distinct review check rows retained
- Independent MP3 checks: **24/24 SHA256 matches, 24/24 complete decode passes**
- Current authored-corpus validation can include concurrently added later lessons; this review certifies only lessons 4–6
- Engine/UI behaviour, legacy HSK1, deployment, learner storage, accessibility and later lessons are outside this worker’s ownership and are not certified here

## Exhaustive changed public-field ledger

Review-status notes are covered above. The following ledger records every other modified field, including page/provenance additions, pinyin, Vietnamese, question prompts/options/tokens and answer movement. No manual-writing Chinese reference answers are included.

### Lesson 04

- `hsk2-fltrp-2026:l04:grammar3.examples[0].py`: `"Hóngsè de, lǜsè de, hēisè de, nǐ xiǎng mǎi nǎge?"` → `"Hóngsè de, lǜsè de, hēisè de, nǐ xiǎng mǎi nǎge? (=Hóngsè de shūbāo, lǜsè de shūbāo, hēisè de shūbāo.)"`
- `hsk2-fltrp-2026:l04:grammar3.examples[0].vi`: `"Cái đỏ, cái xanh lá, cái đen, bạn muốn mua cái nào?"` → `"Cái đỏ, cái xanh lá, cái đen, bạn muốn mua cái nào? (Tức là: cặp đỏ, cặp xanh lá, cặp đen.)"`
- `hsk2-fltrp-2026:l04:grammar3.examples[0].zh`: `"红色的、绿色的、黑色的，你想买哪个？"` → `"红色的、绿色的、黑色的，你想买哪个？（=红色的书包、绿色的书包、黑色的书包）"`
- `hsk2-fltrp-2026:l04:grammar3.examples[1].py`: `"Zhège miànbāo shì bàba mǎi de, māma mǎi de zài nàr."` → `"Zhège miànbāo shì bàba mǎi de, māma mǎi de zài nàr. (=Mǎi de miànbāo.)"`
- `hsk2-fltrp-2026:l04:grammar3.examples[1].vi`: `"Bánh mì này bố mua; cái mẹ mua ở đằng kia."` → `"Bánh mì này bố mua; cái mẹ mua ở đằng kia. (买的 chỉ bánh mì đã mua.)"`
- `hsk2-fltrp-2026:l04:grammar3.examples[1].zh`: `"这个面包是爸爸买的，妈妈买的在那儿。"` → `"这个面包是爸爸买的，妈妈买的在那儿。（=买的面包）"`
- `hsk2-fltrp-2026:l04:grammar3.examples[2].py`: `"Zhè jiàn yīfu tài guì le, háishi mǎi nà jiàn piányi de ba."` → `"Zhè jiàn yīfu tài guì le, háishi mǎi nà jiàn piányi de ba. (=Piányi de yīfu.)"`
- `hsk2-fltrp-2026:l04:grammar3.examples[2].vi`: `"Bộ quần áo này đắt quá, hay là mua bộ rẻ kia đi."` → `"Bộ quần áo này đắt quá, hay là mua bộ rẻ kia đi. (便宜的 chỉ món quần áo rẻ.)"`
- `hsk2-fltrp-2026:l04:grammar3.examples[2].zh`: `"这件衣服太贵了，还是买那件便宜的吧。"` → `"这件衣服太贵了，还是买那件便宜的吧。（=便宜的衣服）"`
- `hsk2-fltrp-2026:l04:grammar3.practice[2].vi`: `"A: Hôm nay cơm và thức ăn là bố nấu, ngon không? B: Ngon, nhưng con thích ăn ______ mẹ hơn."` → `"A: Hôm nay cơm và thức ăn là bố nấu, ngon không? B: Ngon, nhưng con thích ăn đồ mẹ ______ hơn."`
- `hsk2-fltrp-2026:l04:hw02.options`: `["我没吃过饺子。", "我不吃过饺子。", "我没吃饺子过。"]` → `["我没吃过饺子。", "我已经吃过饺子。", "我不想吃饺子。"]`
- `hsk2-fltrp-2026:l04:hw04.options`: `["看看颜色", "听听", "试试"]` → `["看看颜色", "洗洗", "试试"]`
- `hsk2-fltrp-2026:l04:hw06.prompt.vi`: `"Chọn câu nêu nguyên nhân trước, kết quả sau."` → `"Hôm nay trời mưa nên chúng tôi không ra ngoài. Câu nào diễn đạt đúng sự việc, nêu nguyên nhân trước và kết quả sau?"`
- `hsk2-fltrp-2026:l04:hw06.prompt.zh`: `"选择原因在前、结果在后的句子。"` → `"今天下雨，我们因此没出去。哪句按“原因在前、结果在后”的顺序准确表达这件事？"`
- `hsk2-fltrp-2026:l04:hw07.options`: `["黑色是", "黑色得", "黑色的"]` → `["黑色的书", "黑色的裤子", "黑色的书包"]`
- `hsk2-fltrp-2026:l04:hw07.prompt.vi`: `"Có hai cặp, một đỏ một đen. Tôi thích cái màu đen."` → `"Có hai chiếc cặp, một đỏ, một đen. Tiểu Lâm nói “Tôi thích cái màu đen”. 黑色的 ở đây chỉ gì?"`
- `hsk2-fltrp-2026:l04:hw07.prompt.zh`: `"两个书包一个红、一个黑。我喜欢______。"` → `"两个书包一个红、一个黑。小林说“我喜欢黑色的”。这里“黑色的”指什么？"`
- `hsk2-fltrp-2026:l04:hw08.options`: `["更", "过", "条"]` → `["更", "很", "也"]`
- `hsk2-fltrp-2026:l04:hw14.prompt.vi`: `"Bắt đầu bằng “你”: Bạn thử chiếc quần đỏ kia đi. (Khối có dấu câu phải giữ đúng vị trí trong câu.)"` → `"Bắt đầu bằng “你”; đặt hành động ngay sau chủ ngữ, rồi đến đồ vật: Bạn thử chiếc quần đỏ kia đi. (Khối có dấu câu phải giữ đúng vị trí trong câu.)"`
- `hsk2-fltrp-2026:l04:hw14.prompt.zh`: `"按越南语意思与常规语序排列词语；带标点的词语放在对应分句末尾。"` → `"按越南语意思，以“主语—动词—宾语—语气助词”的顺序排列；带标点的词块放在句末。"`
- `hsk2-fltrp-2026:l04:hw15.prompt.vi`: `"Bắt đầu bằng “你”: Bạn đã từng xem bộ phim này chưa? (Khối có dấu câu phải giữ đúng vị trí trong câu.)"` → `"Bắt đầu bằng “你”; đặt cụm chỉ bộ phim sau động từ và trợ từ chỉ trải nghiệm: Bạn đã từng xem bộ phim này chưa? (Khối có dấu câu phải giữ đúng vị trí trong câu.)"`
- `hsk2-fltrp-2026:l04:hw15.prompt.zh`: `"按越南语意思与常规语序排列词语；带标点的词语放在对应分句末尾。"` → `"按越南语意思排列；宾语放在“动词+过”后面，带标点的词块放在句末。"`
- `hsk2-fltrp-2026:l04:hw16.prompt.zh`: `"听原音4-1：这家商场以前开过门接待她们吗？"` → `"听原音4-1：王一雪和刘小雪以前来过这家商场吗？"`
- `hsk2-fltrp-2026:l04:hw21.options`: `["我吃这个菜过。", "我吃过这个菜。", "我过吃这个菜。"]` → `["我还没吃过这个菜。", "我吃过这个菜。", "我想吃这个菜。"]`
- `hsk2-fltrp-2026:l04:hw22.explanation.vi`: `"Nguyên nhân là mưa; kết quả là không ra ngoài."` → `"Nguyên nhân là chưa từng mặc màu đỏ; kết quả là muốn thử chiếc quần này."`
- `hsk2-fltrp-2026:l04:hw22.explanation.zh`: `"原因是下雨，结果是不出去。"` → `"原因是没穿过红色的，结果是想试试这条裤子。"`
- `hsk2-fltrp-2026:l04:hw22.options`: `["因为下雨，所以我今天没出去。", "因为我今天没出去，所以下雨。", "所以今天下雨，因为我没出去。"]` → `["因为没穿过红色的，所以我想试试这条裤子。", "因为没穿过红色的，所以我不想试这条裤子。", "因为已经穿过红色的，所以我想试试这条裤子。"]`
- `hsk2-fltrp-2026:l04:hw22.prompt.vi`: `"Vì trời mưa nên hôm nay tôi không ra ngoài."` → `"Vì chưa từng mặc màu đỏ nên tôi muốn thử chiếc quần này."`
- `hsk2-fltrp-2026:l04:hw22.source.pdfPage`: `48` → `47`
- `hsk2-fltrp-2026:l04:hw22.source.printedPage`: `33` → `32`
- `hsk2-fltrp-2026:l04:hw23.options`: `["我想要红色是，不想要黑色是。", "我想要的红色，不想要的黑色。", "我想要红色的，不想要黑色的。"]` → `["我想要黑色的，不想要红色的。", "我想要红色的，也想要黑色的。", "我想要红色的，不想要黑色的。"]`
- `hsk2-fltrp-2026:l04:hw24.explanation.vi`: `"比 nêu đối tượng so sánh; 更 đứng trước tính từ."` → `"这个 chỉ chiếc này; 更 cho biết mức độ đẹp cao hơn khi so sánh."`
- `hsk2-fltrp-2026:l04:hw24.explanation.zh`: `"“比”引出比较对象，“更”放在形容词前。"` → `"“这个”指这一件，“更”表示相比之下程度更高。"`
- `hsk2-fltrp-2026:l04:hw24.options`: `["这个书包那更个好看。", "这个书包比那个更好看。", "这个书包更那个好看比。"]` → `["这个书包也很好看。", "这个书包更好看。", "那个书包更好看。"]`
- `hsk2-fltrp-2026:l04:hw24.prompt.vi`: `"Chiếc cặp này đẹp hơn chiếc kia."` → `"Đang so sánh hai chiếc cặp: Chiếc cặp này đẹp hơn."`
- `hsk2-fltrp-2026:l04:hw25.answer`: `0` → `1`
- `hsk2-fltrp-2026:l04:hw25.options`: `["你先试试这条裤子吧。", "你试先这条裤子过。", "你先这条试试裤子吧。"]` → `["你先买这条裤子吧。", "你先试试这条裤子吧。", "你先试试那条裤子吧。"]`
- `hsk2-fltrp-2026:l04:hw26.focus`: `"writing-experience"` → `"Dịch viết tổng hợp"`
- `hsk2-fltrp-2026:l04:hw27.focus`: `"writing-cause-result"` → `"Dịch viết tổng hợp"`
- `hsk2-fltrp-2026:l04:hw28.focus`: `"writing-description"` → `"Dịch viết tổng hợp"`
- `hsk2-fltrp-2026:l04:hw29.focus`: `"writing-shopping"` → `"Dịch viết tổng hợp"`
- `hsk2-fltrp-2026:l04:hw29.prompt.vi`: `"Bạn thử chiếc quần màu đỏ kia đi."` → `"Tôi muốn thử chiếc quần màu đen trước, rồi xem chiếc màu trắng."`
- `hsk2-fltrp-2026:l04:hw30.focus`: `"writing-question"` → `"Dịch viết tổng hợp"`
- `hsk2-fltrp-2026:l04:hw30.prompt.vi`: `"Bạn đã từng xem bộ phim này chưa?"` → `"Chị gái bạn đã từng đến trung tâm thương mại này chưa?"`
- `hsk2-fltrp-2026:l04:text1.context.source` added: `{"pdfPage": 45, "printedPage": 30, "section": "课文1：情境", "provenance": "textbook"}`
- `hsk2-fltrp-2026:l04:text2.context.source` added: `{"pdfPage": 46, "printedPage": 31, "section": "课文2：情境", "provenance": "textbook"}`
- `hsk2-fltrp-2026:l04:text3.context.source` added: `{"pdfPage": 48, "printedPage": 33, "section": "课文3：情境", "provenance": "textbook"}`
- `hsk2-fltrp-2026:l04:text3:line1.py`: `"Māma, wǒ xiǎng mǎi ge xīn shūbāo."` → `"Māma, wǒ xiǎng mǎi gè xīn shūbāo."`
- `hsk2-fltrp-2026:l04:text4.context.source` added: `{"pdfPage": 50, "printedPage": 35, "section": "课文4：情境", "provenance": "textbook"}`

### Lesson 05

- `hsk2-fltrp-2026:l05:grammar1.examples[1].vi`: `"Gia Nguyệt đã đến dưới rồi, bạn xuống đón cô ấy đi. (Cả người nói và người nghe đều ở trên.)"` → `"Gia Nguyệt đã đến tầng dưới rồi, bạn xuống đón cô ấy đi. (Cả người nói và người nghe đều ở trên.)"`
- `hsk2-fltrp-2026:l05:grammar1.examples[6].vi`: `"Bạn đứng dậy nhé, nhường chỗ này cho em gái nhỏ ngồi."` → `"Bạn đứng dậy nhé, nhường chỗ này cho bé gái ngồi."`
- `hsk2-fltrp-2026:l05:grammar3.examples[1].py`: `"Dōu bā diǎn bàn le, nǐ hái bù qǐchuáng ma?"` → `"Dōu bā diǎn bàn le, nǐ hái bù qǐlái ma?"`
- `hsk2-fltrp-2026:l05:grammar3.examples[1].zh`: `"都8点半了，你还不起床吗？"` → `"都8点半了，你还不起来吗？"`
- `hsk2-fltrp-2026:l05:hw07.options`: `["爸爸买去了很多水果。", "爸爸买回了很多水果。", "爸爸买出了很多水果。"]` → `["爸爸买好了很多水果。", "爸爸买回了很多水果。", "爸爸送出了很多水果。"]`
- `hsk2-fltrp-2026:l05:hw11.explanation.vi`: `"在酒店下面 nêu địa điểm và đứng trước 等你."` → `"在酒店楼下 nêu địa điểm và đứng trước 等你."`
- `hsk2-fltrp-2026:l05:hw11.explanation.zh`: `"我在酒店下面等你。"` → `"我在酒店楼下等你。"`
- `hsk2-fltrp-2026:l05:hw11.prompt.vi`: `"Bắt đầu bằng “我”: Tôi đợi bạn ở phía dưới khách sạn. (Khối có dấu câu phải giữ đúng vị trí trong câu.)"` → `"Bắt đầu bằng “我”: Tôi đợi bạn ở tầng dưới của khách sạn. (Khối có dấu câu phải giữ đúng vị trí trong câu.)"`
- `hsk2-fltrp-2026:l05:hw11.tokens`: `["你。", "酒店", "我", "下面", "在", "等"]` → `["你。", "酒店", "我", "楼下", "在", "等"]`
- `hsk2-fltrp-2026:l05:hw12.explanation.vi`: `"教室 phải đứng trước 来; 快 bổ nghĩa cho hành động 进."` → `"房间 là tân ngữ địa điểm, đứng sau 进 và trước 来; 快 đứng trước hành động."`
- `hsk2-fltrp-2026:l05:hw12.explanation.zh`: `"你们快进教室来吧。"` → `"你快进房间来吧。"`
- `hsk2-fltrp-2026:l05:hw12.prompt.vi`: `"Thầy ở trong lớp. Bắt đầu bằng “你们”: Các em mau vào lớp đây đi. (Khối có dấu câu phải giữ đúng vị trí trong câu.)"` → `"Người nói ở trong phòng. Bắt đầu bằng “你”: Bạn mau vào phòng đây đi. (Khối có dấu câu phải giữ đúng vị trí trong câu.)"`
- `hsk2-fltrp-2026:l05:hw12.tokens`: `["来", "你们", "吧。", "进", "快", "教室"]` → `["来", "你", "吧。", "进", "快", "房间"]`
- `hsk2-fltrp-2026:l05:hw13.explanation.vi`: `"买回 là động từ kèm bổ ngữ xu hướng, sau đó là 了 và tân ngữ."` → `"买回 chỉ mua rồi mang về; 三本中文书 là tân ngữ chỉ ba quyển sách tiếng Trung."`
- `hsk2-fltrp-2026:l05:hw13.explanation.zh`: `"爸爸买回了很多水果。"` → `"姐姐买回了三本中文书。"`
- `hsk2-fltrp-2026:l05:hw13.prompt.vi`: `"Bắt đầu bằng “爸爸”: Bố đã mua về rất nhiều trái cây. (Khối có dấu câu phải giữ đúng vị trí trong câu.)"` → `"Bắt đầu bằng “姐姐”: Chị gái đã mua về ba quyển sách tiếng Trung. (Khối có dấu câu phải giữ đúng vị trí trong câu.)"`
- `hsk2-fltrp-2026:l05:hw13.tokens`: `["很多", "了", "爸爸", "水果。", "买", "回"]` → `["三本", "了", "姐姐", "中文书。", "买", "回"]`
- `hsk2-fltrp-2026:l05:hw14.explanation.vi`: `"都十点了 đứng trước dấu phẩy; 还不 nêu việc vẫn chưa làm."` → `"都十一点了 nhấn mạnh giờ đã muộn; 还不 nêu việc vẫn chưa làm."`
- `hsk2-fltrp-2026:l05:hw14.explanation.zh`: `"都十点了，你还不睡觉？"` → `"都十一点了，你还不睡觉？"`
- `hsk2-fltrp-2026:l05:hw14.prompt.vi`: `"Bắt đầu bằng “都”: Đã mười giờ rồi, sao bạn vẫn chưa ngủ? (Khối có dấu câu phải giữ đúng vị trí trong câu.)"` → `"Bắt đầu bằng “都”: Đã mười một giờ rồi, sao bạn vẫn chưa ngủ? (Khối có dấu câu phải giữ đúng vị trí trong câu.)"`
- `hsk2-fltrp-2026:l05:hw14.tokens`: `["你", "都", "睡觉？", "十点了，", "还", "不"]` → `["你", "都", "睡觉？", "十一点了，", "还", "不"]`
- `hsk2-fltrp-2026:l05:hw17.prompt.zh`: `"听音频：谁收到了白家月为孩子们准备的礼物说明？"` → `"听音频：白家月对谁说，这是给孩子们准备的礼物？"`
- `hsk2-fltrp-2026:l05:hw26.prompt.vi`: `"Tôi không lên nữa, tôi sẽ đợi bạn ở dưới khách sạn."` → `"Tôi không lên nữa, tôi sẽ đợi bạn ở tầng dưới của khách sạn."`
- `hsk2-fltrp-2026:l05:text1.context.vi`: `"Dưới tầng trệt khách sạn, Annie gọi điện cho Bạch Gia Nguyệt."` → `"Ở tầng dưới của khách sạn, Annie gọi điện cho Bạch Gia Nguyệt."`

### Lesson 06

- `hsk2-fltrp-2026:l06:grammar1.examples[0].py`: `"Wǒ zài gěi tā mǎi ge dàdà de shēngrì dàngāo."` → `"Wǒ zài gěi tā mǎi gè dàdà de shēngrì dàngāo."`
- `hsk2-fltrp-2026:l06:grammar3.practice[1].vi`: `"A: Bạn về nhà ngủ một giấc ______, mai cũng đừng đi làm. (好) B: Vâng, anh/chị cũng đừng làm mệt quá."` → `"A: Bạn về nhà ngủ một giấc ______, mai cũng đừng đi làm. (好) B: Vâng, anh/chị cũng đừng làm mình quá mệt."`
- `hsk2-fltrp-2026:l06:hw05.options`: `["打开", "忘了", "过了"]` → `["打开", "拿走", "关上"]`
- `hsk2-fltrp-2026:l06:hw07.source.pdfPage`: `66` → `67`
- `hsk2-fltrp-2026:l06:hw07.source.printedPage`: `51` → `52`
- `hsk2-fltrp-2026:l06:hw08.options`: `["guo，曾经", "guō，一种食物", "guò，庆祝或度过"]` → `["guo，表示曾经的经历", "guò，表示从一个地方经过", "guò，庆祝或度过"]`
- `hsk2-fltrp-2026:l06:hw10.options`: `["老师到了早早地教室。", "老师早早地到了教室。", "老师早早的到了地教室。"]` → `["老师早早地离开了教室。", "老师早早地到了教室。", "老师很晚才到了教室。"]`
- `hsk2-fltrp-2026:l06:hw13.answer`: `[4, 2, 0, 3, 6, 5, 1]` → `[3, 2, 0, 5, 4, 1]`
- `hsk2-fltrp-2026:l06:hw13.tokens`: `["送", "礼物。", "爸爸", "给", "这是", "的", "姐姐"]` → `["送给", "礼物。", "爸爸", "这是", "的", "姐姐"]`
- `hsk2-fltrp-2026:l06:hw14.answer`: `[2, 4, 0, 3, 1]` → `[2, 5, 6, 4, 0, 3, 1]`
- `hsk2-fltrp-2026:l06:hw14.prompt.vi`: `"Bắt đầu bằng “妈妈让我”: Mẹ bảo tôi ở nhà nghỉ ngơi cho tốt hai ngày. (Khối có dấu câu phải giữ đúng vị trí trong câu.)"` → `"Bắt đầu bằng “妈妈”; đặt cụm chỉ nơi chốn ngay sau “让我” và trước cụm chỉ cách thức: Mẹ bảo tôi ở nhà nghỉ ngơi cho tốt hai ngày. (Khối có dấu câu phải giữ đúng vị trí trong câu.)"`
- `hsk2-fltrp-2026:l06:hw14.prompt.zh`: `"按越南语意思排列词块；带标点的词块位置固定。"` → `"按越南语意思排列；“在家”放在“让我”后、“好好地”前，带标点的词块放在句末。"`
- `hsk2-fltrp-2026:l06:hw14.tokens`: `["好好地", "两天。", "妈妈让我", "休息", "在家"]` → `["好好地", "两天。", "妈妈", "休息", "在家", "让", "我"]`
- `hsk2-fltrp-2026:l06:hw15.answer`: `[2, 5, 0, 3, 1, 4]` → `[2, 4, 0, 1, 3]`
- `hsk2-fltrp-2026:l06:hw15.prompt.vi`: `"Bắt đầu bằng “明天”: Mai không đi học, chúng tôi muốn ngủ một giấc thật thoải mái. (Khối có dấu câu phải giữ đúng vị trí trong câu.)"` → `"Bắt đầu bằng “明天”: Mai không đi học, chúng tôi muốn ngủ một giấc thật thoải mái. (Mệnh đề thứ hai bắt đầu sau dấu phẩy bằng “我们想”.)"`
- `hsk2-fltrp-2026:l06:hw15.prompt.zh`: `"按越南语意思排列词块；带标点的词块位置固定。"` → `"按越南语意思排列；第二个分句以“我们想”开头，标点分别放在分句和全句末尾。"`
- `hsk2-fltrp-2026:l06:hw15.tokens`: `["我们", "舒舒服服地", "明天", "想", "睡一觉。", "不上学，"]` → `["我们想", "舒舒服服地", "明天", "睡一觉。", "不上学，"]`
- `hsk2-fltrp-2026:l06:hw17.prompt.zh`: `"听音频：小雪听说礼物是画笔后是什么态度？"` → `"听音频：小雪打开礼物、看到画笔后是什么态度？"`
- `hsk2-fltrp-2026:l06:hw23.source.pdfPage`: `66` → `67`
- `hsk2-fltrp-2026:l06:hw23.source.printedPage`: `51` → `52`
- `hsk2-fltrp-2026:l06:section2.blocks[3].vi`: `"(3) Nhìn này, đây là em gái tôi ______, có đẹp không?"` → `"(3) Nhìn này, đây là bức tranh em gái tôi ______, có đẹp không?"`
- `hsk2-fltrp-2026:l06:text1:line2.py`: `"Nǐ bù shuō, wǒ hái zhēn wàng le. Wǒmen gěi tā zhǔnbèi ge shénme lǐwù ne?"` → `"Nǐ bù shuō, wǒ hái zhēn wàng le. Wǒmen gěi tā zhǔnbèi gè shénme lǐwù ne?"`
- `hsk2-fltrp-2026:l06:text1:line6.py`: `"Hǎo de! Wǒ zài gěi tā mǎi ge dàdà de shēngrì dàngāo."` → `"Hǎo de! Wǒ zài gěi tā mǎi gè dàdà de shēngrì dàngāo."`
- `hsk2-fltrp-2026:l06:text2:line8.py`: `"Nà wǒ yào huà yí ge chuān báisè yīfu de jiějie."` → `"Nà wǒ yào huà yí gè chuān báisè yīfu de jiějie."`
- `hsk2-fltrp-2026:l06:text4:line1.py`: `"Jīntiān shì nǚ'ér de shēngrì. Wǒmen mǎile dàngāo, zuòle miàntiáor, hái zuòle yú a ròu a shénmede. Chīwán wǎnfàn, yì jiā rén qù kànle ge diànyǐng. Huí jiā hòu, háizimen zǎozǎo de jiù shàng chuáng le. Míngtiān bú shàngxué, tāmen shuō yào shūshūfúfú de shuì yí jiào, ràng wǒmen wǎn diǎnr jiào tāmen qǐchuáng. Zhè shì hěn máng, hěn lèi, dàn hěn kuàilè de yì tiān."` → `"Jīntiān shì nǚ'ér de shēngrì. Wǒmen mǎile dàngāo, zuòle miàntiáor, hái zuòle yú a ròu a shénmede. Chīwán wǎnfàn, yì jiā rén qù kànle gè diànyǐng. Huí jiā hòu, háizimen zǎozǎo de jiù shàng chuáng le. Míngtiān bú shàngxué, tāmen shuō yào shūshūfúfú de shuì yí jiào, ràng wǒmen wǎn diǎnr jiào tāmen qǐchuáng. Zhè shì hěn máng, hěn lèi, dàn hěn kuàilè de yì tiān."`
