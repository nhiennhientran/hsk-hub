# Independent HSK2 pilot content review: lessons 01–03

- Date: 2026-10-02 UTC
- Baseline: author commit `f7f8f4e`; independent reviewer did not author that baseline
- Reviewer: independent Codex AI content-review worker
- Owned changes: three HSK2 lesson JSON files and this audit only
- Result: source-pixel, Chinese, pinyin, Vietnamese, provenance and assessment pass completed with the corrections below. This is **not qualified-teacher/native-speaker certification or full semantic audio certification**

## Source coverage actually verified

Actual local PNG pixels were opened and inspected for every one-based textbook PDF page **16–43**, corresponding to printed pages **1–28**. OCR was not substituted for image inspection. The original answer PDF was independently rendered with PyMuPDF and the actual rendered pixels of **pages 1–4** were inspected. These pages cover all objective answers for the three lessons. No raw scans, answer PDF, or audio archive were added to the repository or uploaded.

| Lesson | Textbook PDF pages viewed | Printed pages | Vocabulary | Texts | Grammar | Homework | Independent listening | Other sections |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 16, 17, 18, 19, 20, 21, 22, 23, 24 | 1–9 | 15 | 4 | 3 | 30 | 4 | 5 |
| 2 | 25, 26, 27, 28, 29, 30, 31, 32, 33 | 10–18 | 17 | 4 | 3 | 30 | 4 | 6 |
| 3 | 34, 35, 36, 37, 38, 39, 40, 41, 42, 43 | 19–28 | 15 | 4 | 3 | 30 | 4 | 6 |

Verified all 12 complete texts / 55 speaker turns or narrative blocks, all 48 source text questions, the 47 actual printed vocabulary entries, all nine grammar explanations and their examples/practices, warm-ups, 15 integrated fill-in items, picture sentence frames, tips, classroom activities and culture panels. Source objective question keys (30 across the three lessons) agree with answer-PDF pages 1–4. Source exercise word banks and gap content also agree with the key. The warm-up image order agrees with the answer images; these descriptions remain ungraded source-task representations.

Lesson 3's complete three-lesson review is retained: two vocabulary self-assessment rows, nine distinct grammar rows with their exact Chinese example sentences, both “understand” and “can use” criteria, and an improvement field. Its source pages are PDF 42–43 / printed 27–28. No review rows were collapsed away.

Vocabulary counts are not syllabus estimates: 45 numbered entries plus two printed proper nouns, 北京烤鸭 and 北京大学. There is no repeated-word padding. No claim is made that 西安 is a separately printed lesson-3 vocabulary entry.

## Language and transcription findings

The source transcription was substantially accurate. One Chinese context omission was corrected: lesson 1 text 2 now includes the printed 在 before 聊天儿 (PDF 18 / printed 3). All 55 actual Chinese text turns/narrative blocks and their speaker assignments were retained after comparison. The slightly unusual printed 是您姐姐来接的我们 remains intact rather than being silently rewritten.

Reviewed every Vietnamese value for meaning, roles, tense/aspect, negation, quantity and naturalness. Corrected “rửa … quần áo” to the natural Vietnamese “giặt … quần áo” in lesson 3 ordering item hw11. Editorial Vietnamese correctly follows Chinese 姐姐 as “chị gái”; the source English's “cousin” discrepancy was not imported. Printed school counts and ticket prices remain narrative facts, not current real-world data. All Vietnamese is editorial translation.

Reviewed all text/vocabulary pinyin plus editorial grammar-example pinyin: names, Xī'ān syllable separator, ordinal dì-yī, tone-sandhi forms of 一/不, neutral syllables, and relevant polyphones/readings such as 还 hái (not huán), 好 hǎo, 给 gěi, 间 jiān, 看 kàn, 为 wèi, 累 lèi, and direction verbs 回来/回去/出去. No additional pinyin correction was warranted against these pages. Source orthography is preserved rather than relabelled as phonetic transcription. Grammar examples' pinyin is an editorial supplement.

## Important assessment corrections

1. **Predictable keys:** original supplemental choices repeatedly followed A/B/C. All 60 homework choice positions and 12 independent-listening positions were reviewed and varied. Each lesson's 20 homework choices now has a 7/7/6 distribution with no simple cyclic pattern. Printed textbook option order/keys are unchanged
2. **Ordering difficulty:** 14 of 15 original ordering questions had only three chunks, usually with start/end already specified. All 15 now have **5–6 distinct chunks**, remain tied to an explicit Vietnamese meaning and starting expression, and have an anchored final punctuation chunk. Keys were independently reconstructed. Lesson 2 hw14 adds 大 / “lớn” consistently; lesson 3 hw12 now distinguishes thinking first from the timing of tomorrow's trip
3. **Manual-writing payload clues:** all 15 writing `focus` strings now say only `Dịch viết tổng hợp`. No Chinese target phrases, answer-bearing fields, suggested solutions, or marking keys are stored in those objects. Removed answer-clue strings are deliberately not reproduced in this report
4. **Ambiguous numeric listening threshold:** `hsk2-fltrp-2026:l02:listen03` originally asked which price threshold tickets were below, making both 20 and 300 logically true. It now asks which amount Bai Jiayue explicitly said after 还不到, and uses 10/20/30 as distractors
5. **Weak or misleading distractors:** many unrelated nouns and nonsensical word orders were replaced by level-appropriate contrasts involving roles, time, transport, negation, quantity or action. In particular l02:hw23 no longer uses the potentially acceptable colloquial first distractor with 卖的; alternatives now distinguish bought/sold and cheap/expensive. Some direct recognition/grammar-form items are intentionally easy; the set progresses through recognition, constrained construction, original-recording comprehension, contrastive translation and five open writing tasks
6. **Precise prompts:** lesson 1 hw07 explicitly asks for speculative confirmation; hw09 specifies that the speaker is presently at school, resolving 来/去 perspective. Lesson 2 hw01 now asks for the expression matching a taxi, rather than relying on an unsupported assumption that a taxi must be faster. Its hw09 now asks which word the phrase modifies. Lesson 3 hw01 explicitly tests result-complement position; hw09 uses familiar 票 instead of the untaught menu word. Hw22 now uses a contextual rest suggestion rather than nearly duplicating the bare reduplication-form question

Every lesson retains exactly **10 vocab/grammar + 5 ordering + 5 original-audio listening + 5 Vietnamese-to-Chinese choice + 5 manual Vietnamese-to-Chinese writing**. All 90 homework items and 12 separate listening items have supplemental provenance. Exact task signatures are distinct across this 102-item pilot; shared grammar practice across different formats is deliberate, not quantity padding. A teacher may naturally accept multiple valid formulations for manual writing; no automatic single-sentence writing key is imposed.

## Provenance changes

Warm-up image descriptions in all three lessons are now explicitly labelled `图片描述（编辑补充）` / `Mô tả tranh (biên tập bổ sung)` and have their own supplemental source object, rather than inheriting only the surrounding textbook source. All 12 text contexts now have an exact source object; context-page PDF sequences are lesson 1: **17,18,20,22**; lesson 2: **26,27,29,31**; lesson 3: **35,36,38,40**. This fixes traceability where a context appears on the page before the dialogue. Chinese dialogue source mappings remain unchanged.

## Audio and unavailable media: exact verification limits

Original tracks `1-1`–`1-8`, `2-1`–`2-8`, `3-1`–`3-8`: **24/24 local files exist, independently SHA256-match the ingestion manifest, and independently pass complete ffmpeg decode**. Printed odd-track dialogue/narrative labels and even-track vocabulary labels were checked against the page pixels. All 27 audio questions (15 homework plus 12 independent) were checked for semantic support in the corresponding printed text; each uses the correct original odd-numbered track. Vocabulary controls refer to complete original word-list recordings, not purported isolated-word cuts.

No available audio-listening/transcription tool was found. Therefore this review **does not certify the spoken contents, pronunciation or spoken speaker labels of those MP3s through full listening**. Printed-text semantic support, manifest/file integrity, decoder success and human-equivalent listening are separate claims. The lesson review notes preserve this limitation explicitly.

Culture videos `1-1`, `2-1`, `3-1` are absent from the supplied assets. The source topics and image descriptions are retained with honest resource notes. The same-numbered lesson MP3s are not misrepresented as those videos.

## Validation

- `HSK_PILOT=1 node tools/validate-content.mjs`: passed with zero issues on the current working tree (pilot mode; not a complete-course release pass)
- Independently checked exact 10/5/5/5/5 distribution, no writing answer-bearing fields or Chinese focus hints, three distinct options per supplemental choice, all ordering permutations, reconstructed ordering sentences, and no duplicate full task signatures across the pilot
- All revised keys were read against their final displayed options after repositioning; answers remain semantically consistent with explanations
- Independent audio full decode + SHA256 checks: 24/24 passed
- UI behavior, legacy HSK1, deployment, accessibility, persisted learner state, and later lessons are outside this worker's ownership and were not certified here

## Exhaustive changed-string ledger

The following records every changed instructional/prompt/option/token/explanation string in the owned lesson JSONs. Option-order-only differences are also recorded so answer movement is auditable. Shared review-status notes and newly added source location/provenance objects are documented above. Writing focus changes are recorded by item ID and neutral replacement only to avoid republishing the removed answer clues.

### Lesson 01
- `hsk2-fltrp-2026:l01:text2.context.zh`: "在王一雪的车里，白家月、安妮和王一雪聊天儿。" → "在王一雪的车里，白家月、安妮和王一雪在聊天儿。"
- `warmup1.items[1].zh`: "图1：年轻人帮老人提袋子；图2：女子向坐着的人表示歉意；图3：一家人在景点合影；图4：男生介绍两位同学。" → "图片描述（编辑补充）：图1：年轻人帮老人提袋子；图2：女子向坐着的人表示歉意；图3：一家人在景点合影；图4：男生介绍两位同学。"
- `warmup1.items[1].vi`: "Tranh 1: người trẻ xách túi giúp người lớn tuổi; tranh 2: cô gái bày tỏ sự áy náy; tranh 3: gia đình chụp ảnh ở điểm tham quan; tranh 4: nam sinh giới thiệu hai bạn học." → "Mô tả tranh (biên tập bổ sung): Tranh 1: người trẻ xách túi giúp người lớn tuổi; tranh 2: cô gái bày tỏ sự áy náy; tranh 3: gia đình chụp ảnh ở điểm tham quan; tranh 4: nam sinh giới thiệu hai bạn học."

`hsk2-fltrp-2026:l01:hw01`
- options: ["让", "次", "意思"] → ["和", "给", "让"]
- answer (zero-based): 0 → 2

`hsk2-fltrp-2026:l01:hw02`
- options: ["在", "给", "从"] → ["给", "在", "从"]
- answer (zero-based): 1 → 0

`hsk2-fltrp-2026:l01:hw03`
- options: ["个", "名", "次"] → ["名", "次", "个"]
- answer (zero-based): 2 → 1

`hsk2-fltrp-2026:l01:hw04`
- options: ["帮", "到", "接"] → ["接", "帮", "问"]
- answer (zero-based): 0 → 1

`hsk2-fltrp-2026:l01:hw05`
- options: ["有时", "已经", "意思"] → ["已经", "还没", "有时"]
- answer (zero-based): 1 → 0

`hsk2-fltrp-2026:l01:hw06`
- options: ["介绍", "旅游", "意思"] → ["地方", "时候", "意思"]

`hsk2-fltrp-2026:l01:hw07`
- prompt.zh: "你已经知道她大概是老师，想请她确认，应该说什么？" → "你猜对方是老师，想用本课学的语气助词表达揣测并请对方确认。哪句最合适？"
- prompt.vi: "Bạn đoán cô ấy là giáo viên và muốn xác nhận; nên nói gì?" → "Bạn đoán người nghe là giáo viên. Câu nào dùng trợ từ ngữ khí đã học để thể hiện phỏng đoán và xin xác nhận?"
- options: ["你是老师吧？", "你是哪儿？", "你老师几点？"] → ["你是老师吧？", "你是老师了。", "你是老师吗？"]

`hsk2-fltrp-2026:l01:hw08`
- options: ["你去北京吗？", "你昨天是几点到北京的？", "北京有几点？"] → ["你昨天是和谁一起到北京的？", "你昨天是怎么到北京的？", "你昨天是几点到北京的？"]
- answer (zero-based): 1 → 2

`hsk2-fltrp-2026:l01:hw09`
- prompt.zh: "说明自己不是坐车来的，哪句正确？" → "你现在在学校，要告诉老师：这次你没有坐车到这里。哪句与这个意思一致？"
- prompt.vi: "Chọn câu nói mình không đến bằng xe." → "Bạn đang ở trường và muốn nói với thầy/cô rằng lần này bạn không đến đây bằng xe. Câu nào diễn đạt đúng ý đó?"
- options: ["我不坐车的是来。", "我不是来坐车。", "我不是坐车来的。"] → ["我不是坐车去的。", "我不是坐车来的。", "我不是昨天来的。"]
- answer (zero-based): 2 → 1

`hsk2-fltrp-2026:l01:hw11`
- tokens: ["看书。", "让", "老师", "我们"] → ["书。", "老师", "看", "让", "我们"]
- answer (zero-based): [2, 1, 3, 0] → [1, 3, 4, 2, 0]

`hsk2-fltrp-2026:l01:hw12`
- prompt.vi: "Hãy bắt đầu bằng “我”: Tôi đã đến vào sáng hôm qua. (Khối có dấu câu phải giữ đúng vị trí trong câu.)" → "Hãy bắt đầu bằng “我是”: Tôi đã đến vào sáng hôm qua. (Khối có dấu câu phải giữ đúng vị trí trong câu.)"
- tokens: ["到的。", "昨天早上", "我是"] → ["的。", "我是", "到", "昨天", "早上"]
- answer (zero-based): [2, 1, 0] → [1, 3, 4, 2, 0]

`hsk2-fltrp-2026:l01:hw13`
- tokens: ["打电话。", "姐姐", "给我"] → ["电话。", "我", "姐姐", "给", "打"]
- answer (zero-based): [1, 2, 0] → [2, 3, 1, 4, 0]

`hsk2-fltrp-2026:l01:hw14`
- prompt.vi: "Hãy bắt đầu bằng “这”: Đây là lần thứ ba tôi đến Trung Quốc. (Khối có dấu câu phải giữ đúng vị trí trong câu.)" → "Hãy bắt đầu bằng “这是我”: Đây là lần thứ ba tôi đến Trung Quốc. (Khối có dấu câu phải giữ đúng vị trí trong câu.)"
- tokens: ["来中国。", "第三次", "这是我"] → ["这是我", "中国。", "来", "第三", "次"]
- answer (zero-based): [2, 1, 0] → [0, 3, 4, 2, 1]

`hsk2-fltrp-2026:l01:hw15`
- prompt.vi: "Hãy bắt đầu bằng “我”: Tôi muốn nhờ bạn đón một người bạn. (Khối có dấu câu phải giữ đúng vị trí trong câu.)" → "Hãy bắt đầu bằng “我想”: Tôi muốn nhờ bạn đón một người bạn. (Khối có dấu câu phải giữ đúng vị trí trong câu.)"
- tokens: ["接一个朋友。", "请你", "我想"] → ["请", "朋友。", "我想", "接", "一个", "你"]
- answer (zero-based): [2, 1, 0] → [2, 0, 5, 3, 4, 1]

`hsk2-fltrp-2026:l01:hw16`
- options: ["王一飞请她来接学生。", "她要去旅游。", "她要给学生上课。"] → ["她要去旅游。", "王一飞请她来接学生。", "她要给学生上课。"]
- answer (zero-based): 0 → 1

`hsk2-fltrp-2026:l01:hw17`
- options: ["王一雪", "安妮", "王一飞"] → ["王一雪", "王一飞", "安妮"]
- answer (zero-based): 1 → 2

`hsk2-fltrp-2026:l01:hw21`
- options: ["不好意思，我已经到北京了。", "不好意思，我明天到北京了。", "不好意思，北京已经到我了。"] → ["不好意思，我还没到北京。", "不好意思，我明天去北京。", "不好意思，我已经到北京了。"]
- answer (zero-based): 0 → 2

`hsk2-fltrp-2026:l01:hw22`
- options: ["妈妈叫回家我。", "妈妈叫我回家。", "我叫妈妈回家。"] → ["我叫妈妈回家。", "妈妈叫我回家。", "妈妈叫我去学校。"]

`hsk2-fltrp-2026:l01:hw23`
- options: ["你在哪儿买这本书吗？", "你这本书哪儿买？", "这本书你是在哪儿买的？"] → ["这本书你是在哪儿买的？", "这本书你是什么时候买的？", "这本书你是给谁买的？"]
- answer (zero-based): 2 → 0

`hsk2-fltrp-2026:l01:hw24`
- options: ["我有时不懂她的意思。", "我已经不懂她的旅游。", "我有时意思不懂她。"] → ["我每次都懂她的意思。", "我有时不懂她的意思。", "她有时不懂我的意思。"]
- answer (zero-based): 0 → 1

`hsk2-fltrp-2026:l01:hw25`
- options: ["我们来是的旅游。", "我们是来旅游的。", "我们是旅游来吗。"] → ["我们是来旅游的。", "我们是来学习的。", "我们是来工作的。"]
- answer (zero-based): 1 → 0
- `hsk2-fltrp-2026:l01:hw26.focus`: removed answer-clue metadata → `Dịch viết tổng hợp`
- `hsk2-fltrp-2026:l01:hw27.focus`: removed answer-clue metadata → `Dịch viết tổng hợp`
- `hsk2-fltrp-2026:l01:hw28.focus`: removed answer-clue metadata → `Dịch viết tổng hợp`
- `hsk2-fltrp-2026:l01:hw29.focus`: removed answer-clue metadata → `Dịch viết tổng hợp`
- `hsk2-fltrp-2026:l01:hw30.focus`: removed answer-clue metadata → `Dịch viết tổng hợp`

`hsk2-fltrp-2026:l01:listen01`
- options: ["王一雪", "王一飞", "李文"] → ["李文", "王一雪", "王一飞"]
- answer (zero-based): 1 → 2

`hsk2-fltrp-2026:l01:listen02`
- options: ["都来过", "只有安妮来过", "都没有来过"] → ["都没有来过", "都来过", "只有安妮来过"]
- answer (zero-based): 2 → 0

`hsk2-fltrp-2026:l01:listen03`
- options: ["李文", "王一雪", "白家月"] → ["李文", "白家月", "王一雪"]

### Lesson 02
- `warmup1.items[1].zh`: "图1：黄色公交车；图2：女子招手叫出租车；图3：有桌椅和黑板的教室；图4：工作人员检查乘客的票。" → "图片描述（编辑补充）：图1：黄色公交车；图2：女子招手叫出租车；图3：有桌椅和黑板的教室；图4：工作人员检查乘客的票。"
- `warmup1.items[1].vi`: "Tranh 1: xe buýt vàng; tranh 2: phụ nữ vẫy taxi; tranh 3: phòng học có bàn ghế và bảng; tranh 4: nhân viên kiểm tra vé của hành khách." → "Mô tả tranh (biên tập bổ sung): Tranh 1: xe buýt vàng; tranh 2: phụ nữ vẫy taxi; tranh 3: phòng học có bàn ghế và bảng; tranh 4: nhân viên kiểm tra vé của hành khách."

`hsk2-fltrp-2026:l02:hw01`
- prompt.zh: "今天我没有车，想快一点到医院，可以______去。" → "想坐出租车去医院，可以说：我想______去医院。"
- prompt.vi: "Hôm nay tôi không có xe, muốn đến bệnh viện nhanh thì có thể đi bằng cách nào?" → "Muốn đi taxi đến bệnh viện: hãy chọn cách nói tương ứng."
- options: ["打车", "车站", "教室"] → ["开车", "打车", "坐公交车"]
- answer (zero-based): 0 → 1

`hsk2-fltrp-2026:l02:hw02`
- options: ["间", "但", "名"] → ["因为", "所以", "但"]
- answer (zero-based): 1 → 2

`hsk2-fltrp-2026:l02:hw03`
- options: ["千", "百", "万"] → ["万", "千", "百"]
- answer (zero-based): 2 → 0

`hsk2-fltrp-2026:l02:hw04`
- options: ["间", "名", "张"] → ["张", "名", "间"]
- answer (zero-based): 0 → 2

`hsk2-fltrp-2026:l02:hw06`
- options: ["三多十个学生", "三十个学生多", "三十多个学生"] → ["三十多个学生", "三十个多学生", "三十名多学生"]
- answer (zero-based): 2 → 0

`hsk2-fltrp-2026:l02:hw07`
- options: ["五块多钱", "五多块钱", "五十多块钱"] → ["五块多钱", "五十多块钱", "五多块钱"]

`hsk2-fltrp-2026:l02:hw08`
- options: ["还是家里在我们。", "我们还是在家休息吧。", "我们家还是在吗。"] → ["我们还是去学校吧。", "我们还是在家休息吧。", "我们还是去车站吧。"]

`hsk2-fltrp-2026:l02:hw09`
- prompt.zh: "“我买的票”中，“我买的”说明什么？" → "“我买的票”中，“我买的”修饰哪个词？"

`hsk2-fltrp-2026:l02:hw10`
- options: ["别", "票", "远"] → ["再", "别", "都"]
- answer (zero-based): 0 → 1

`hsk2-fltrp-2026:l02:hw11`
- tokens: ["去车站吧。", "还是", "我们"] → ["吧。", "车站", "我们", "还是", "去"]
- answer (zero-based): [2, 1, 0] → [2, 3, 4, 1, 0]

`hsk2-fltrp-2026:l02:hw12`
- tokens: ["名老师。", "三十多", "学校里有"] → ["有", "名", "学校里", "三十", "多", "老师。"]
- answer (zero-based): [2, 1, 0] → [2, 0, 3, 4, 1, 5]

`hsk2-fltrp-2026:l02:hw13`
- prompt.vi: "Bắt đầu bằng “这”: Đây là vé xem phim chị gái tôi mua. (Khối có dấu câu phải giữ đúng vị trí trong câu.)" → "Bắt đầu bằng “这是”: Đây là vé xem phim chị gái tôi mua. (Khối có dấu câu phải giữ đúng vị trí trong câu.)"
- tokens: ["电影票。", "我姐姐买的", "这是"] → ["这是", "的", "我姐姐", "买", "电影票。"]
- answer (zero-based): [2, 1, 0] → [0, 2, 3, 1, 4]

`hsk2-fltrp-2026:l02:hw14`
- prompt.vi: "Bắt đầu bằng “那边”: Bên kia có một phòng học. (Khối có dấu câu phải giữ đúng vị trí trong câu.)" → "Bắt đầu bằng “那边”: Bên kia có một phòng học lớn. (Khối có dấu câu phải giữ đúng vị trí trong câu.)"
- tokens: ["一间", "那边有", "教室。"] → ["大", "教室。", "有", "那边", "一间"]
- explanation.zh: "那边有一间教室。" → "那边有一间大教室。"
- answer (zero-based): [1, 0, 2] → [3, 2, 4, 0, 1]

`hsk2-fltrp-2026:l02:hw15`
- tokens: ["去看电影了。", "我们", "别"] → ["去看", "电影", "我们", "了。", "别"]
- answer (zero-based): [1, 2, 0] → [2, 4, 0, 1, 3]

`hsk2-fltrp-2026:l02:hw17`
- options: ["老师说的", "网上说的", "服务员说的"] → ["服务员说的", "老师说的", "网上说的"]
- answer (zero-based): 1 → 2

`hsk2-fltrp-2026:l02:hw18`
- options: ["车站", "饭店", "教室"] → ["饭店", "教室", "车站"]
- answer (zero-based): 2 → 1

`hsk2-fltrp-2026:l02:hw20`
- options: ["明天早上", "有时间的时候", "学生少的时候"] → ["明天早上", "学生少的时候", "有时间的时候"]
- answer (zero-based): 1 → 2

`hsk2-fltrp-2026:l02:hw21`
- options: ["有公交车，但车站有点儿远。", "有车站，但公交车很教室。", "但公交车有，远点儿车站。"] → ["有公交车，但车站不远。", "有公交车，但车站有点儿远。", "没有公交车，车站也很远。"]
- answer (zero-based): 0 → 1

`hsk2-fltrp-2026:l02:hw22`
- options: ["教室里有二十个多学生。", "教室里有二十多个学生。", "教室里有二多十个学生。"] → ["教室里有二十多个学生。", "教室里有二十多个老师。", "教室里有二十个学生。"]
- explanation.zh: "多放在二十后面。" → "二十多个学生表示学生超过二十人；二十个学生是正好二十人，老师不是学生。"
- explanation.vi: "多 đặt sau 二十." → "二十多个学生 là hơn 20 học sinh; 二十个学生 là đúng 20 người, còn 老师 là giáo viên."
- answer (zero-based): 1 → 0

`hsk2-fltrp-2026:l02:hw23`
- options: ["他们电影票卖的很便宜。", "卖他们的很便宜电影票。", "他们卖的电影票很便宜。"] → ["他们卖的电影票很便宜。", "他们卖的电影票很贵。", "他们买的电影票很便宜。"]
- answer (zero-based): 2 → 0

`hsk2-fltrp-2026:l02:hw24`
- options: ["我们还是打车去吧。", "我们打车还是吗。", "我们是还车打吧。"] → ["我们还是坐公交车去吧。", "我们还是开车去吧。", "我们还是打车去吧。"]
- answer (zero-based): 0 → 2

`hsk2-fltrp-2026:l02:hw25`
- options: ["别学校现在去。", "现在别去学校。", "现在学校别。"] → ["明天别去学校。", "现在别去学校。", "现在去学校吧。"]
- `hsk2-fltrp-2026:l02:hw26.focus`: removed answer-clue metadata → `Dịch viết tổng hợp`
- `hsk2-fltrp-2026:l02:hw27.focus`: removed answer-clue metadata → `Dịch viết tổng hợp`
- `hsk2-fltrp-2026:l02:hw28.focus`: removed answer-clue metadata → `Dịch viết tổng hợp`
- `hsk2-fltrp-2026:l02:hw29.focus`: removed answer-clue metadata → `Dịch viết tổng hợp`
- `hsk2-fltrp-2026:l02:hw30.focus`: removed answer-clue metadata → `Dịch viết tổng hợp`

`hsk2-fltrp-2026:l02:listen01`
- options: ["说太贵了", "说没有时间", "说没问题"] → ["说没有时间", "说没问题", "说太贵了"]
- answer (zero-based): 2 → 1

`hsk2-fltrp-2026:l02:listen02`
- options: ["三千多名", "四万多名", "三十多名"] → ["三十多名", "四万多名", "三千多名"]
- answer (zero-based): 0 → 2

`hsk2-fltrp-2026:l02:listen03`
- prompt.zh: "听后选择：有的电影票低于哪个价格？" → "听后选择：白家月说，有的电影票“还不到”多少元？"
- prompt.vi: "Nghe: Một số vé có giá dưới mức nào?" → "Nghe: Gia Nguyệt nói có vé xem phim “còn chưa đến” bao nhiêu tệ?"
- options: ["十元", "二十元", "三百元"] → ["二十元", "十元", "三十元"]
- answer (zero-based): 1 → 0

`hsk2-fltrp-2026:l02:listen04`
- options: ["很小、没有电影院", "学生少、电影票贵", "很大、很漂亮"] → ["学生少、电影票贵", "很小、没有电影院", "很大、很漂亮"]

### Lesson 03
- `warmup1.items[1].zh`: "图1：男子竖起大拇指；图2：洗车；图3：女子坐在电脑前显得疲倦；图4：手拿纸杯。" → "图片描述（编辑补充）：图1：男子竖起大拇指；图2：洗车；图3：女子坐在电脑前显得疲倦；图4：手拿纸杯。"
- `warmup1.items[1].vi`: "Tranh 1: người đàn ông giơ ngón cái; tranh 2: rửa xe; tranh 3: người phụ nữ mệt mỏi trước máy tính; tranh 4: bàn tay cầm cốc giấy." → "Mô tả tranh (biên tập bổ sung): Tranh 1: người đàn ông giơ ngón cái; tranh 2: rửa xe; tranh 3: người phụ nữ mệt mỏi trước máy tính; tranh 4: bàn tay cầm cốc giấy."

`hsk2-fltrp-2026:l03:hw01`
- prompt.zh: "还有两个问题没做，不能说工作做______了。" → "表示全部完成工作时，“完”应放在哪个位置？"
- prompt.vi: "Còn hai câu chưa làm, chưa thể nói đã hoàn thành công việc." → "Muốn diễn đạt đã làm xong toàn bộ công việc, phải đặt 完 ở vị trí nào?"
- options: ["完", "这么", "每"] → ["我做完工作了。", "我做工作完了。", "我完做工作了。"]
- explanation.zh: "做完表示全部完成。" → "结果补语“完”紧接动词“做”，宾语“工作”放在“做完”后面。"
- explanation.vi: "做完 nghĩa là làm xong toàn bộ." → "Bổ ngữ kết quả 完 đứng ngay sau 做; tân ngữ 工作 đứng sau 做完."

`hsk2-fltrp-2026:l03:hw02`
- options: ["我不看懂了这篇介绍。", "我还没看懂这篇介绍。", "我没这篇介绍看懂了。"] → ["我已经看懂这篇介绍。", "我还没看完这篇介绍。", "我还没看懂这篇介绍。"]
- answer (zero-based): 1 → 2

`hsk2-fltrp-2026:l03:hw03`
- options: ["票", "教室", "手"] → ["苹果", "手", "衣服"]
- answer (zero-based): 2 → 1

`hsk2-fltrp-2026:l03:hw04`
- options: ["自己", "为什么", "每"] → ["自己", "每天", "一起"]

`hsk2-fltrp-2026:l03:hw05`
- options: ["这么", "每", "完"] → ["两", "一", "每"]
- answer (zero-based): 1 → 2

`hsk2-fltrp-2026:l03:hw06`
- options: ["为什么", "完", "一起"] → ["自己", "每天", "一起"]

`hsk2-fltrp-2026:l03:hw07`
- options: ["你再想一想吧。", "你再想一了吧。", "你再想好好想了吧。"] → ["你别再想了。", "你再想一想吧。", "你已经想好了。"]
- answer (zero-based): 0 → 1

`hsk2-fltrp-2026:l03:hw08`
- options: ["休休息", "休息休息", "休息息"] → ["休息休息", "休息息", "休休息"]
- answer (zero-based): 1 → 0

`hsk2-fltrp-2026:l03:hw09`
- prompt.zh: "说明刚才简单看过菜单，选哪句？" → "说明刚才简单看过这张票，选哪句？"
- prompt.vi: "Muốn nói vừa xem qua thực đơn, chọn câu nào?" → "Muốn nói vừa xem qua tấm vé này, chọn câu nào?"
- options: ["我刚才看看了菜单。", "我刚才看一了菜单。", "我刚才看了看菜单。"] → ["我刚才看看了这张票。", "我刚才看了看这张票。", "我刚才看一看这张票。"]
- answer (zero-based): 2 → 1

`hsk2-fltrp-2026:l03:hw10`
- options: ["帮了帮忙", "帮忙了帮忙", "帮忙忙了"] → ["帮忙了帮忙", "帮了忙帮", "帮了帮忙"]
- answer (zero-based): 0 → 2

`hsk2-fltrp-2026:l03:hw11`
- prompt.vi: "Bắt đầu bằng “我”: Tôi chưa rửa xong quần áo. (Khối có dấu câu phải giữ đúng vị trí trong câu.)" → "Bắt đầu bằng “我”: Tôi chưa giặt xong quần áo. (Khối có dấu câu phải giữ đúng vị trí trong câu.)"
- tokens: ["洗完衣服。", "还没", "我"] → ["还", "我", "衣服。", "没", "洗完"]
- answer (zero-based): [2, 1, 0] → [1, 0, 3, 4, 2]

`hsk2-fltrp-2026:l03:hw12`
- prompt.vi: "Bắt đầu bằng “你”: Bạn suy nghĩ thêm một chút nhé. (Khối có dấu câu phải giữ đúng vị trí trong câu.)" → "Bắt đầu bằng “你先”: Trước tiên, bạn nghĩ một chút xem ngày mai đi đâu chơi nhé. (Khối có dấu câu phải giữ đúng vị trí trong câu.)"
- tokens: ["想一想吧。", "你", "再"] → ["去", "你先", "玩吧。", "想一想", "明天", "哪儿"]
- explanation.zh: "你再想一想吧。" → "你先想一想明天去哪儿玩吧。"
- explanation.vi: "再 đứng trước 想一想, 吧 kết thúc lời đề nghị." → "先 gắn với hành động suy nghĩ; 明天 chỉ thời điểm của chuyến đi, nên nằm trong cụm 明天去哪儿玩."
- answer (zero-based): [1, 2, 0] → [1, 3, 4, 0, 5, 2]

`hsk2-fltrp-2026:l03:hw13`
- tokens: ["网上的介绍。", "看了看", "我"] → ["的", "网上", "看了看", "我", "介绍。"]
- answer (zero-based): [2, 1, 0] → [3, 2, 1, 0, 4]

`hsk2-fltrp-2026:l03:hw14`
- tokens: ["送我", "爸爸开车", "去学校。"] → ["送", "学校。", "开车", "我", "去", "爸爸"]
- answer (zero-based): [1, 0, 2] → [5, 2, 0, 3, 4, 1]

`hsk2-fltrp-2026:l03:hw15`
- tokens: ["都很累。", "每天", "他"] → ["都", "天", "累。", "他", "每", "很"]
- answer (zero-based): [2, 1, 0] → [3, 4, 1, 0, 5, 2]

`hsk2-fltrp-2026:l03:hw16`
- options: ["还没做完", "已经做完", "没有工作"] → ["没有工作", "还没做完", "已经做完"]
- answer (zero-based): 0 → 1

`hsk2-fltrp-2026:l03:hw17`
- options: ["王一雪", "刘明", "孩子"] → ["刘明", "王一雪", "孩子"]
- answer (zero-based): 1 → 0

`hsk2-fltrp-2026:l03:hw18`
- options: ["买票", "洗苹果", "洗手"] → ["洗苹果", "买票", "洗手"]

`hsk2-fltrp-2026:l03:hw19`
- options: ["网上", "医院里", "车站里"] → ["车站里", "网上", "医院里"]
- answer (zero-based): 0 → 1

`hsk2-fltrp-2026:l03:hw20`
- options: ["送孩子以前", "送完孩子回家后", "晚上睡觉后"] → ["送完孩子回家后", "晚上睡觉后", "送孩子以前"]
- answer (zero-based): 1 → 0

`hsk2-fltrp-2026:l03:hw21`
- options: ["我没吃完饭。", "我没吃完饭了。", "我不饭吃完。"] → ["我没吃完饭。", "我还没吃饭。", "我已经吃完饭了。"]

`hsk2-fltrp-2026:l03:hw22`
- prompt.vi: "Tôi muốn nghỉ ngơi một chút." → "Mệt rồi thì hãy nghỉ ngơi một chút nhé."
- options: ["我想休休息。", "我想休息休息。", "我想休息息。"] → ["累了就去上班吧。", "累了也别休息了。", "累了就休息休息吧。"]
- explanation.zh: "休息用ABAB形式。" → "“累了就……”说明条件，“休息休息”用ABAB形式表示休息一会儿。"
- explanation.vi: "休息 lặp theo dạng ABAB." → "累了就… nêu điều kiện; 休息休息 là dạng ABAB, nghĩa là nghỉ một chút."
- answer (zero-based): 1 → 2

`hsk2-fltrp-2026:l03:hw23`
- options: ["你拿自己吧。", "自己你吧拿。", "你自己拿吧。"] → ["我帮你拿吧。", "你自己拿吧。", "我自己拿吧。"]
- answer (zero-based): 2 → 1

`hsk2-fltrp-2026:l03:hw24`
- options: ["我看了看这本书。", "我看看了这本书。", "我看一了这本书。"] → ["我看了看这本书。", "我没看这本书。", "我想看看这本书。"]

`hsk2-fltrp-2026:l03:hw25`
- options: ["他送每天早上孩子都去学校。", "他每天早上都送孩子去学校。", "他每天都早上学校去送。"] → ["他每天早上都接孩子回家。", "他每天早上都送孩子去学校。", "他每天晚上都送孩子去学校。"]
- `hsk2-fltrp-2026:l03:hw26.focus`: removed answer-clue metadata → `Dịch viết tổng hợp`
- `hsk2-fltrp-2026:l03:hw27.focus`: removed answer-clue metadata → `Dịch viết tổng hợp`
- `hsk2-fltrp-2026:l03:hw28.focus`: removed answer-clue metadata → `Dịch viết tổng hợp`
- `hsk2-fltrp-2026:l03:hw29.focus`: removed answer-clue metadata → `Dịch viết tổng hợp`
- `hsk2-fltrp-2026:l03:hw30.focus`: removed answer-clue metadata → `Dịch viết tổng hợp`

`hsk2-fltrp-2026:l03:listen01`
- options: ["喝茶", "吃饭", "买水果"] → ["吃饭", "买水果", "喝茶"]
- answer (zero-based): 1 → 0

`hsk2-fltrp-2026:l03:listen02`
- options: ["已经决定去北京", "已经买票了", "还没想好"] → ["已经买票了", "还没想好", "已经决定去北京"]
- answer (zero-based): 2 → 1

`hsk2-fltrp-2026:l03:listen03`
- options: ["桌子上", "房间外边", "车里"] → ["车里", "房间外边", "桌子上"]
- answer (zero-based): 0 → 2

`hsk2-fltrp-2026:l03:listen04`
- options: ["马上开车", "休息休息", "再去医院"] → ["再去医院", "马上开车", "休息休息"]
- answer (zero-based): 1 → 2

