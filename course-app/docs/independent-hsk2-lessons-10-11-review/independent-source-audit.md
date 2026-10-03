# Independent source audit HSK2 lessons 10 and 11

2026-10-03 UTC. **Source audit complete. This is not acceptance of a new interactive draft, artwork, browser behavior or release.**

## Result and scope

No substantive baseline Chinese, printed pinyin, Vietnamese translation, source-question transcription or existing official-answer error was found. Preserve existing text, pinyin, Vietnamese, IDs, question options and order. Vietnamese translations, grammar-example pinyin and suggested free-response completions are editorial supplements; do not label them literal printed-source material or official answer keys.

The source-response inventory contains **90 atomic fields**:

- Lesson 10: **47 = 21 official + 22 nonunique reference + 4 open**
- Lesson 11: **43 = 19 official + 23 nonunique reference + 1 open**

These counts include one open dialogue response per classroom activity. They exclude supplementary homework and supplementary listening. They do not count decorative graphics as learning tasks or imply that an absent culture quiz should be invented.

There are **29 relevant source scenes**, 13 in lesson10 and 16 in lesson11. Both lessons have only three text-context pictures: **neither has a text4 photograph**. Lesson10 has six warm-up1 pictures, seven comprehensive-picture blanks, and **no culture panel**. Lesson11 has an additional four-picture warm-up2 description activity. Neither lesson has a response matrix or learning-summary table.

Each baseline contains exactly **30 homework records**, in the established distribution of 10 vocabulary/grammar, 5 ordering, 5 listening, 5 translation-choice and 5 manual-writing items, plus 4 separate supplemental listening records. Keep these unchanged. `baseline-preservation.json` records file hashes, canonical homework/listening hashes and unchanged-byte verification; the baseline JSON snapshots preserve the original bytes.

Only this review directory was written. No content, drafts, shared renderer/code, public artwork or remote branch was changed or pushed.

## Evidence actually examined

The following **27 applicable pages** were rendered from the preserved sources and opened as actual pixels:

- Textbook PDF99–107, printed84–92: all nine lesson10 pages
- Textbook PDF108–116, printed93–101: all nine lesson11 pages
- Objective-answer PDF13–15: all three applicable answer pages, including image-embedded warm-up keys
- Textbook PDF156–161, printed141–146: the POS legend, star legend and complete vocabulary appendix

`source-render-index.json` records document hashes, page numbers, PNG paths, sizes, hashes and visual-inspection status. `source-page-coverage.json` specifies each lesson page's content. The textbook is image-only, so extraction is not sufficient evidence. `answers-text.txt` is an extraction aid; its text does not include the warm-up answers printed on images.

The visual review covered titles/objectives; all eight texts, contexts and source pinyin; vocabulary numbering/POS senses; grammar explanations, examples and full dialogue frames; all questions/options; warm-ups; picture tasks; tips; classroom instructions and examples; and lesson11's culture heading/image/video marker. It was cross-checked against the baseline JSON. No fresh audio decoding, ASR or listening, browser/storage/build/CI, publication, or qualified-teacher/native-speaker certification is claimed.

## Official keys and exact provenance

Only these **40 atomic answers** have official objective keys. Letter indices in JSON are zero-based when referring to the option array; true/false uses 正确 at index0 and 错误 at index1.

### Lesson 10

- Warm-up1: **E D B F A C** = 考试 / 错 / 题 / 本子 / 门 / 笑. Textbook PDF99/P84; answer image on **answer PDF13**. Picture order is top row left-to-right, then bottom row left-to-right
- Text1 listening: **C B** = 门后面 / 桌子上. Textbook PDF100/P85; both on **answer PDF13**
- Text2 listening: **A B** = 看书 / 本子上. Textbook PDF102/P87; both on **answer PDF13**
- Text3 listening: **C B** = 比上次好 / 做菜. Textbook PDF103/P88. **Question1 C is on answer PDF13; question2 B is on answer PDF14**. The key crosses a page boundary
- Text4 listening: **F T** = 错误 / 正确. Textbook PDF105/P90; both on **answer PDF14**
- Text4 reading: **B C** = 快要开学了 / 孩子上学，他们比孩子还忙. Textbook PDF106/P91; both on **answer PDF14**
- Word selection: **E D A C B** = 笑 / 考试 / 后面 / 帮 / 错. Textbook PDF106/P91; all five on **answer PDF14**

### Lesson 11

- Warm-up1: **C D B A** = 药店 / 路上 / 药 / 疼. Textbook PDF108/P93; actual answer image on **answer PDF14**
- Text1 listening: **C A** = 教室 / 开车. Textbook PDF109/P94; both on **answer PDF14**
- Text2 listening: **A C** = 开车 / 下雪. Textbook PDF110/P95; both on **answer PDF15**
- Text3 listening: **C C** = 头不那么疼了 / 去做菜. Textbook PDF112/P97; both on **answer PDF15**
- Text4 listening: **F F** = 错误 / 错误. Textbook PDF114/P99; both on **answer PDF15**
- Text4 reading: **B A** = 药店 / 睡觉. Textbook PDF115/P100; both on **answer PDF15**
- Word selection: **E D B A C** = 路上 / 身体 / 慢 / 经常 / 时. Textbook PDF115/P100; all five on **answer PDF15**

No official objective key is supplied for either warm-up2, texts1–3 reading responses, any grammar completion, any comprehensive-picture completion, or either classroom activity. Even a constrained function-word blank such as 最 must remain reference-only unless an official key is actually supplied. Use nonunique-reference/self-review handling, never exact-string auto-grading. Personal-preference responses and classroom dialogues are open.

## Lesson 10 task inventory

`lesson-10-source-task-inventory.json` enumerates every original response with source page, baseline owner/path, options, actual key provenance or an explicitly editorial reference.

### PDF99 P84 warm-ups with nine responses

Warm-up1 contains six separate matches, with options A 门, B 题, C 笑, D 错, E 考试, F 本子. Each field requires its own source-bound visual prompt. Preserve the 2×3 picture arrangement or an unambiguous responsive reading order.

Warm-up2 contains three independent personal responses. Retain the direction 根据实际情况互相问答 and every option in the question:

1. 爷爷买了奶茶、咖啡和牛奶，你想喝什么？
2. 商场有白色的裤子，也有黑色的裤子，你买哪条？
3. 明天星期六，可以在家看电视，也可以去看电影，你想做什么？

These are personal choices; do not supply a compulsory preferred drink, garment or weekend plan.

### Texts with sixteen responses

- Text1: two listening choices PDF100/P85; two reading questions PDF101/P86: 刘小明什么时候开学？ / 刘小明准备好了吗？为什么？
- Text2: two listening choices PDF102/P87; two reading questions PDF103/P88: 刘小雪明天要做什么？ / 这些词的意思刘小雪都懂了吗？
- Text3: two listening choices PDF103/P88; two reading questions PDF105/P90: 王一雪叫刘小雪做什么？ / 孩子们洗完手了吗？
- Text4: two true/false listening questions PDF105/P90; two reading choices PDF106/P91

Use original text tracks 10-1 / 10-3 / 10-5 / 10-7 and retain the listen-twice directions. The text3 and text4 audio markers precede their passages on the prior PDF pages; do not infer the listening-question page from the passage page. Vocabulary tracks10-2 / 10-4 / 10-6 / 10-8 are separate.

For text1 reading question2, the end state is that Xiaoming is ready because his father has helped him. For text3 reading question2, the younger brother has finished washing his hands while the older sister has not. A reference must preserve that distinction rather than claim both children are finished.

### Grammar with nine completion fields

Each grammar point has three one-blank dialogues. Preserve the full A/B context, supplied fixed text and all existing examples.

1. 主谓谓语句, PDF101/P86:
   - A：刘明工作忙吗？ B：____。
   - A：你知道哪个电影好看吗？ B：这个电影____，很好看。
   - A：陈天中学习怎么样？ B：____。
   - Possible references: 刘明工作很忙 / 我看过 / 陈天中学习很好
   - Retain the explanation that the subject of the inner subject-predicate phrase is part of or related to the main subject, and examples 我的书包你看见了吗？ / 弟弟手很小。 / 这件事他知道。
2. 选择问句, PDF103/P88:
   - 你吃____？ with 饺子，我觉得饺子比包子更好吃
   - 你想____？ with 打车吧，坐公交车没有打车快
   - 你喝____？ with 奶茶吧，我觉得奶茶比茶和咖啡好喝
   - References can be 饺子还是包子 / 坐公交车还是打车 / 奶茶、茶还是咖啡. Do not duplicate 你吃/你想/你喝 already outside the blank
   - Retain all three source examples, including the three-way sports alternative and the two-question time alternative
3. 要/快/快要/就要……了, PDF105/P90:
   - ____，你别出去吃了。 with 小王还在饭馆等我呢
   - ____，陈天中怎么还没来？ with 今天不舒服，不来上课了
   - 儿子10号过生日，今天都7号了。 是啊，____。（3天）
   - References: 饭菜快要做好了 / 就要上课了 / 再过三天儿子就要过生日了
   - Preserve the **3天** hint and the source generalization that with a time adverbial one normally uses 就要……了. Retain all three source examples

All nine references are editorial and illustrative. Different grammatical completions satisfying the context are valid; avoid a green/red answer gate based solely on matching these strings.

### PDF106 P91 word selection with five fields

Preserve the original full prompts and option bank 后面 / 错 / 帮 / 考试 / 笑. Split the existing combined question block into five independent response fields without removing its content or A/B contexts.

1. 看到生日礼物，儿子高兴地____了。
2. 小雪，你们什么时候____？你准备好了吗？
3. 我们公司____有一个商店，下班后我就去那儿买东西。
4. A：不好意思，你能____我叫一下白家月吗？ B：没问题，你等一下。
5. A：这个字写____了，左边是“口”，不是“日”。 B：好的，我知道了。

The source also prints the English parenthetic gloss “to call” after 叫 in task4. This is vocabulary help, not an additional blank; the baseline Vietnamese already conveys gọi. Any new inline gloss must be labeled editorial/translation appropriately and must not alter the fixed Chinese dialogue.

### PDF107 P92 picture completion with seven fields

The four picture prompts contain **1 + 2 + 2 + 2** blanks:

1. 往左边走____往右边走？
2. ____我都____了。
3. ____下雨____，别玩了，我们回家吧。
4. 电影____开始____，你到哪儿了？

References are 还是; 水果 / 洗完; 快要 / 了; 就要 / 了. Each blank is separately stateful. Keep 我都 and terminal 了 outside task2 fields; reference 洗完 must not add another 了. In tasks3–4, retain both separate function-word slots rather than replacing the frame with one full-sentence box.

The second photo shows washing fruit under a faucet. The third shows two children playing in sand under a gray sky, not rainfall already in progress. The fourth shows a cinema attendee on the phone with other audience members reacting; do not add a specific start time. No official objective picture key exists.

### PDF107 P92 classroom activity with one open dialogue

Retain two-person grouping, discussion of study progress, what has been learned, how study is going, whether there are mistaken answers, and using this lesson's vocabulary/grammar. Preserve the complete source example:

A：开学快一个月了，你学会什么了？

B：学会了60多个词，还写了20多个汉字。

……

Do not turn the example's “60多个词” or “20多个汉字” into facts about the learner. No culture panel or learning-summary table is printed in lesson10.

## Lesson 11 task inventory

`lesson-11-source-task-inventory.json` supplies every source field, prompt, key and source-bound reference.

### PDF108 P93 warm-ups with eight responses

Warm-up1 has four matches. Preserve A 疼, B 药, C 药店, D 路上 and picture order pharmacy / road / medicine / pain, keyed CDBA.

Warm-up2 is separate: **four independent numbered picture descriptions**, each asking for one verb or verbal phrase. Preserve its exact instruction 用一个动词或动词短语描述下面的图片 and blanks ① through④.

- ① Snow falling at night: example 下雪
- ② A girl with headphones: example 听音乐
- ③ A hand opening a door: example 开门
- ④ A hand holding a bottle: example 拿水瓶

These are nonunique editorial examples, not official keys. The source does not require the learner to use 着 here; do not impose a grammar restriction absent from this warm-up. Avoid giving these answer phrases as labels visible before response.

### Texts with sixteen responses

- Text1: two listening choices PDF109/P94; two reading questions PDF110/P95: 白家月为什么不回家？ / 白家月现在能不能动？为什么？
- Text2: two listening choices PDF110/P95; two reading questions PDF111/P96: 王一飞为什么要开慢一点儿？ / 李文一会儿要做什么？
- Text3: two listening choices PDF112/P97; two reading questions PDF113/P98: 白家月为什么头不那么疼了？ / 李文让白家月做什么？
- Text4: two true/false listening questions PDF114/P99; two reading choices PDF115/P100

Preserve listen-twice directions and text tracks11-1 / 11-3 / 11-5 / 11-7. The even-numbered tracks are vocabulary, not substitutes for listening activities. Text2's listening page is PDF110 while its dialogue/image is PDF111; text3's listening page is PDF112 while its dialogue/image is PDF113.

The reading references in the JSON preserve both traffic and snowfall as the reason to drive slowly, Li Wen's upcoming visit, the medicine already taken in the narrative, and his advice to eat properly. These summarize fictional source events; they are not learner-specific medical advice.

### Grammar with nine completion fields

1. 动态助词“着”（1）, PDF110/P95, three fields:
   - A：你看见我的手机了吗？ B：别找了，我____呢。
   - A：小雪回来了吗？ B：回来了，在她的房间____呢。
   - A：房间的门____，但是刘爷爷没在里边。 B：他出去了吧？我给他打个电话。
   - References: 拿着 / 坐着 / 开着. The explanation, negative 没（有） placement and all three original examples remain
2. 动态助词“着”（2）, PDF112/P97, three fields:
   - A：安妮，你看见我了吗？我穿着____。 B：看见了，你快过来吧。
   - A：外边____，你别出去跑步了。 B：好吧，那就在家运动运动。
   - A：小明，电视____？ B：没有，我们都没看电视。
   - References: 白色的裤子 / 下着雪 / 开着没有
   - Preserve **both explanatory groups** and all six examples: object placement after 着, then the three interrogatives with 吗, 没有, and 动词+没+动词+着. Do not merge away the question-form examples or misread zhe as zháo
3. 程度副词“最”, PDF114/P99, three fields:
   - 这里的鱼做得____, after the question about having visited the restaurant
   - 我____, after 你最想去哪儿旅游？
   - 我____, after 你最喜欢什么颜色？
   - References: 最好吃 / 最想去中国旅游 / 最喜欢白色
   - The destination and color are examples, not a preferred correct personal answer. Retain all three original 最 examples and the scope of comparison in the source explanation

### PDF115 P100 comprehensive practice with nine fields

Five word-selection fields use 经常 / 慢 / 时 / 身体 / 路上 and official EDBAC:

1. ____车多人多，你慢点儿开。
2. 他今天____不舒服，所以没来上课。
3. 我游泳游得很____，但我跑步跑得很快。
4. A：星期天我____跟朋友去踢球。 B：我也喜欢踢球，下次叫我一起去吧。
5. A：昨天雪太大，公交车开得很慢。 B：是啊，我到家____都快9点了。

Four picture tasks follow, each with one blank:

1. 他是我的老师，也是我____好的朋友。
2. 这是离我家最近的____，我不舒服时就来这儿买药。
3. 他生病了，____。
4. 看完电影，她还在那里____。

Reference examples: 最 / 药店 / 头疼 / 坐着. They have **no supplied official objective key**, including the constrained first two. Retain the four figures, complete fixed text and individual response bindings. The third image is a man touching his forehead opposite a doctor, and does not establish a diagnosis. The fourth is a girl remaining seated in a cinema, not leaving it.

### PDF116 P101 classroom activity and culture

Provide one open role-play response. Preserve two-person grouping, doctor/patient roles, the patient with a headache, questions about onset, prior medicine and recent activities, and the instruction to use this lesson's vocabulary/grammar. Retain:

A：你哪里不舒服？

B：头疼，不能动，一动就疼。

……

This is fictional language practice; do not require users to disclose real symptoms or medicines. Keep source learning content, without turning the activity into a diagnosis or prescribing task.

Culture contains 中国人喝热水的习惯, video marker11-1, and a photograph of water being poured from a kettle into a cup. The supplied video is unavailable. Preserve the existing disclosure and editorial description, and do not substitute text audio11-1, reconstruct unseen video contents, invent a culture exercise, or claim a medical benefit from warm water.

## Original tables and vocabulary appendix

`original-table-inventory.json` explicitly records **zero original response tables** for both lessons. The only lesson tables are the eight informational vocabulary panels, four per lesson:

- Lesson10: PDF100 rows1–5; PDF102 rows6–11; PDF104 rows12–13; PDF106 row14
- Lesson11: PDF109 rows1–5; PDF111 rows6–7; PDF113 rows8–12; PDF114 row13

Each panel preserves number/headword/pinyin/POS/gloss relationships and its even-numbered audio track. Lesson10 has **14 numbered headwords and15 baseline lexical sense rows**, because 考试 is one printed v./n. entry and two baseline senses. Lesson11 has **13 numbered headwords and13 baseline records**.

`vocabulary-appendix-inventory.json` binds all **28 baseline sense rows** to exact appendix pages and source numbering/POS. None of these lessons' vocabulary is starred. The star legend on PDF156/P141 means beyond this level's syllabus; do not invent stars based on perceived difficulty.

Lesson10 appendix bindings:

- PDF157/P142: 帮、本子、笔、词、错
- PDF158/P143: 还是、后面、开学、考、考试、快要
- PDF159/P144: 门、题
- PDF160/P145: 笑

Lesson11 appendix bindings:

- PDF157/P142: 动
- PDF158/P143: 进、经常、路上、慢
- PDF159/P144: 身体、时、疼
- PDF160/P145: 头、药、药店、着
- PDF161/P146: 最

The appendix lists 笔 for lessons10 and13, and 还是 for lessons2 and10; that is not duplicate-entry evidence. Preserve lesson10 考试's verb/noun distinction. 后面 is printed n.; its more specific Vietnamese label “danh từ chỉ phương vị” is editorially precise but not a literal printed POS. Lesson11 疼 is printed adj., 时 and 路上 are n., and 着 is part. Preserve these source classifications.

Preserve neutral syllables in běnzi, háishi, lùshang and zhe, hǎohǎo in lesson10 text2 and lesson11 text3, and source full-tone gè in lesson11 几个中国菜. Contextual sandhi as printed should not be replaced by an automatic dictionary-tone rewrite. Grammar-example pinyin is not printed on the source grammar panels and remains an editorial aid.

## Scene and artwork requirements

`source-scene-inventory.json` specifies all 29 original auxiliary-art targets, exact source pages, baseline owners and response-field bindings.

- Lesson10: 6 warm-up1 figures PDF99; 3 text/context figures PDF100/102/104; 4 practice figures PDF107. Total13
- Lesson11: 4 warm-up1 and4 warm-up2 figures PDF108; 3 text/context figures PDF109/111/113; 4 practice figures PDF115; 1 culture figure PDF116. Total16

The torn-paper background behind each text4 diary passage is a layout device; it is not a missing diary-writing photograph. Decorative speaker portraits, mascots and section graphics do not require independent learning activities.

Create original auxiliary art, with explicit source/owner/field bindings and legible neutral alternative text. Audit rasters are private source evidence and must not be copied into website artwork. Every question figure must remain visibly present and attached to the appropriate response, including both lesson11 warm-ups. Preserve the differences between exam desks and arithmetic problems, between laughing and pain, between snowing and impending rain, and between a passenger using a phone and a driver driving.

Existing image descriptions are editorial source descriptions. Answer-bearing wording should appear only as optional closed hints/references after an attempt; it should not silently disclose correct option labels or blank completions. Do not add arbitrary numerical timing, diagnoses, named medicines, dosages, or health-benefit claims.

## Next acceptance gate

After authoring, independently compare the exact draft hashes against these frozen baselines; verify all **90 source-response bindings**, all **40 official keys and actual answer-PDF pages**, all **29 final artwork pixels/manifests**, the absence of invented response matrices/culture content, and every preserved source question/frame/example. Recheck the **60 unchanged homework records** and8 separate listening records.

Exercise official wrong/correct states, reference/open completion without false exact-match grading, lesson10's multi-blank persistence, warm-up2 figure ownership, per-field reload/reset, stale-feedback clearing, delayed answer disclosure and required artwork accessibility. Real browser/release checks remain separate. This source audit does not approve unbuilt interactivity or unseen final artwork.
