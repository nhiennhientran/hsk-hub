# Independent source audit: HSK2 lessons 8–9

2026-10-03 UTC. **Source-audit gate complete; new interactive drafts have not been authored or reviewed in this scope.**

## Result and scope

No substantive baseline Chinese, printed pinyin, original-question transcription, or existing official-answer error was found in the audited lesson source. Preserve the existing text, pinyin, Vietnamese, IDs, question options and order. All Vietnamese is editorial translation; new free-response examples must also be explicitly editorial/nonunique.

The complete source-response inventory contains **117 atomic fields**:

- Lesson 8: 46 = 19 official + 26 nonunique reference + 1 open
- Lesson 9: 71 = 19 official + 22 nonunique reference + 30 open

These counts include one free dialogue response for each classroom activity. They do not prescribe activity grouping, count decorative graphics as tasks, or require invented culture quizzes. They exclude the existing supplemental homework and listening work. Both baselines contain **exactly 30 homework records** (10 vocabulary/grammar, 5 ordering, 5 listening, 5 translation choice, 5 manual writing) plus 4 separate supplemental listening records. Keep all of these deeply unchanged; `baseline-preservation.json` records source-file and canonical homework hashes, and the two baseline JSON snapshots preserve the original bytes.

Only this review directory was written. No content, drafts, renderer, shared code, public assets or remote branch was changed.

## Evidence actually examined

Every one of the following 30 pages was rendered from the preserved PDF and opened as actual pixels:

- Textbook lesson 8: PDF79–87 / printed 64–72, nine pages
- Textbook lesson 9: PDF88–98 / printed 73–83, eleven pages
- Objective-answer PDF10–13, four pages
- Textbook POS/vocabulary appendix PDF156–161 / printed 141–146, six pages

`source-render-index.json` records the original PDF hashes, exact page numbers, raster sizes, hashes and visual-inspection flags. Rasters are private audit evidence under `source-rasters/`, not website artwork. `book-text.txt` and `answers-text.txt` are extraction aids only; the checks rely on the opened pixels, including answer keys embedded as images.

Checked lesson titles/objectives, all eight texts and contexts, source vocabulary/POS senses, grammar explanations/examples/dialogue frames, text questions/options, warm-ups, picture tasks, both tips, classroom instructions/example turns, culture topics and all review rows. No fresh audio, ASR, pronunciation/tone, implementation, browser, storage, build, CI, push or release verification is claimed. This is independent AI review, not qualified-teacher/native-speaker certification.

## Official keys and exact answer-PDF boundaries

Only the following 38 atomic answers have official objective keys.

### Lesson 8

- Warm-up picture order: **D B A C** = 丈夫 / 右边 / 左边 / 妻子. Textbook PDF79/P64; actual key image on answer **PDF10**
- Text1 listen twice: **B C** = 手表 / 8800元. Textbook PDF80/P65; answer **PDF11**
- Text2 listen twice: **B A** = 看电影 / 网上. Textbook PDF81/P66; answer **PDF11**
- Text3 listen twice: **C A** = 8月27号 / 手表. Textbook PDF83/P68; answer **PDF11**
- Text4 listen twice: **F F** = 错误 / 错误. Textbook PDF85/P70; answer **PDF11**
- Text4 reading: **A C** = 自己的生日 / 去唱歌. Textbook PDF86/P71; answer **PDF11**
- Word selection: **C B E D A** = 手表 / 记得 / 花 / 有意思 / 左边. Textbook PDF86/P71; answer **PDF11**

### Lesson 9

- The lesson heading is on answer PDF11, but the actual warm-up key image is **PDF12**
- Warm-up picture order: **C D A B** = 咖啡 / 门口 / 个子 / 走路. Textbook PDF88/P73; answer **PDF12**
- Text1 listen twice: **A C** = 儿子的裤子坏了 / 上次买的裤子. Textbook PDF89/P74; answer **PDF12**
- Text2 listen twice: **B C** = 奶茶 / 咖啡店. Textbook PDF91/P76; answer **PDF12**
- Text3 listen twice: **A A** = 打车 / 半个多小时. Textbook PDF92/P77; answer **PDF12**
- Text4 listen twice: **F T** = 错误 / 正确. Textbook PDF95/P80; answer **PDF12**
- Text4 reading: **A C** = 衣服 / 咖啡店. Textbook PDF95/P80; answer **PDF12**
- Word selection: **D B A E C** = 个子 / 走路 / 旁边 / 这样 / 那么. Textbook PDF96/P81; all five actual answers on **PDF13**, even though its section heading is at the bottom of PDF12

No objective key is supplied for lesson8 antonyms, any grammar completion, texts1–3 reading responses, picture completions, personal tables, role-play/pair work or self-assessment. Do not present an editorial reference as official, or use exact-match scoring for these tasks.

## Lesson 8 task inventory

The machine-readable `lesson-08-source-task-inventory.json` gives every original prompt, baseline owner/question ID, field ordinal, source page, options and official key or explicitly nonunique suggested reference.

### PDF79/P64: warm-ups (9 fields)

1. Four picture matches, using A 左边, B 右边, C 妻子, D 丈夫 and four actual visual prompts. Official key DBAC
2. Five distinct antonym blanks: 贵____; 大____; 热____; 多____; 早____. Reference examples: 便宜 / 小 / 冷 / 少 / 晚. These are editorial references, not an answer-PDF key

### Texts (16 fields)

- Text1: two audio choices PDF80/P65 and two open reading questions PDF81/P66: 哪块手表好看？ and 手表贵不贵？
- Text2: two audio choices PDF81/P66 and two open reading questions PDF82/P67: 喜欢看什么电影？ and 为什么要到网上买票？
- Text3: two audio choices PDF83/P68 and two open reading questions PDF84/P69: 为什么点很多菜？ and 记得今天是自己的生日吗？
- Text4: two audio true/false questions PDF85/P70 and two reading choices PDF86/P71

The exact original questions/options are retained in the machine inventory. Each audio activity must retain the listen-twice direction and original text track 8-1 / 8-3 / 8-5 / 8-7. Do not attach the vocabulary-list track instead. Source text and answers need not become visible before a listening attempt.

### Grammar completions (9 fields)

Three dialogues × one blank for each of the three grammar points:

- 比较句（1）, PDF81/P66: 饺子吧，我觉得____; 这家书店____; 这条黑色的裤子____
- 比较句（2）, PDF83/P68: 我喜欢绿茶，____; ____，你明天早上起床后多穿点儿; 妈妈，您的床____
- 虽然……但是……, heading PDF84/P69 and all practice on PDF85/P70: 虽然有，但是____; ____，但是打得不太好; full B response to 你觉得这条白色的裤子怎么样？

Retain each complete A/B context. The comparison/additive-degree/contrast target constrains acceptable responses but does not provide a unique official answer. Inventory references demonstrate possible completions only.

### PDF86/P71: comprehensive practice (11 fields)

Five word-selection blanks, officially keyed CBEDA, followed by four picture-completion prompts with **six separate blanks**:

1. 虽然他____，但是都吃完了。
2. ____很晚了，____他还在教室里学习。
3. 这两件衣服都不错，但是我觉得黑色的____白色的____好看。
4. 我觉得你做的菜____饭馆的菜还好吃。

References are nonunique, including the seemingly constrained function-word gaps. Preserve the two separate fields in tasks2 and3. The image of used dishes does not uniquely establish hunger, portion size or another reason. Do not manufacture an official key for it.

### PDF87/P72: classroom activity (1 open dialogue)

Retain three-person grouping, one server and two customers, restaurant ordering, asking price and taste, comparing restaurant/home food, and using this lesson's vocabulary/grammar. Preserve source example A：你好！我们点菜。 B：好的。你们想吃点儿什么？ ……

Culture has the topic 中国人对数字的喜好 and the image 888; video8-1 is absent. This is distinct from audio text track8-1. Keep the existing unavailable-video disclosure. No source review/self-assessment table occurs in lesson8.

## Lesson 9 task inventory

The machine-readable `lesson-09-source-task-inventory.json` supplies every original prompt/field/source/key and supplemental nonunique reference.

### PDF88/P73: warm-ups (12 fields)

1. Four picture matches, options A 个子, B 走路, C 咖啡, D 门口. Official CDAB
2. The source personal table is **four rows × two response cells**, with a third physical column for row labels:
   - 气温: 今天____℃ | 昨天____℃
   - 价格: 咖啡____/杯 | 奶茶____/杯
   - 味道: 包子（非常、很、不）好吃 | 饺子（非常、很、不）好吃
   - 偏好: 看电视（非常、很、没）有意思 | 看电影（非常、很、没）有意思

All eight cells are independent personal/open responses. Keep ℃ and /杯 visible as printed, and retain the actual choices 不 versus 没 in their correct rows. The two columns have row-specific cell labels, not universal today/yesterday labels. Do not collapse paired data or invent numerical defaults, prices, currencies, correctness or scores.

### Texts (16 fields)

- Text1: two audio choices PDF89/P74; open reading PDF90/P75 asking whether trousers look good on their son and why, and whether they bought them
- Text2: two audio choices PDF91/P76; open reading PDF92/P77 asking whether the coffee shop is far and why 王一雪 does not want coffee
- Text3: two audio choices PDF92/P77; open reading PDF93/P78 asking why 王一雪 wants to walk home and how 刘明 commutes
- Text4: two audio true/false and two reading choices, all PDF95/P80

Retain all full source questions/options and listen-twice instructions; audio tracks are 9-1 / 9-3 / 9-5 / 9-7. For text1 reading question2, a reference such as 还没有，他们要再去那边看看 keeps the temporal boundary of that dialogue; avoid an invented later purchase.

### Grammar completions (10 fields)

- 比较句（3）: first dialogue PDF90/P75, remaining two PDF91/P76. Blanks: 四岁多，没有____; 好看，但____，还是买那件白色的吧; 今天____昨天那么____吗？ The third dialogue has **two** fields. Total4
- 离, PDF92/P77: 公司____; 我们酒店____; 现在____还有一个小时。 Total3
- 时量补语（1）, PDF94/P79: 儿子今天出去打了____。（一下午）; 你____，我去给你拿杯水来。（一会儿）; 没有，我都找____。（一天） Total3

Preserve all provided duration hints and surrounding fixed text. For example, the first duration reference is 一下午球, since 打了 is outside the blank; the third can be 了一天了, since 找 is outside the blank. Do not duplicate the existing fixed text. Retain all twelve duration examples and their explanatory grouping, including object/person position, repeated verbs, separable verbs and both ongoing-action two-了 examples.

### PDF96/P81: comprehensive practice (11 fields)

Five word-choice blanks, official DBAEC, followed by these four picture prompts with **six separate blanks**:

1. 我的桌子____教室门口很近。
2. 你看，超市____这儿____。
3. 她觉得那件衣服____这件衣服好看。
4. 左边的孩子____右边的孩子____。

No official objective key exists for these picture completions. Keep the two blanks in tasks2 and4 separate. The left child is visibly shorter, but no task asks for numerical height; do not derive a numeric-answer exercise from the ruler. No task supplies a numerical supermarket distance. Task3 is a subjective beauty comparison, not a universally correct judgment from a picture.

### PDF97/P82: classroom activity (1 open dialogue)

Retain two-person grouping, planning a trip together, comparing advantages/disadvantages of transport choices and using lesson vocabulary/grammar. Preserve A：你想怎么去上海？ B：我们都会开车，开车去吧。 ……

Culture is 新中式茶饮, with video9-1 unavailable. Preserve the disclosure and editorial photo-description qualification; do not invent ingredients, recipe, health claims or video content.

### PDF97–98/P82–83: learning summary (21 independent responses)

- Vocabulary table PDF97/P82: **2 rows × 1 response column** plus row labels: 我已经记住并会使用的词语 / 我还没记住的词语
- Grammar self-assessment PDF98/P83: **9 rows × 2 checkbox columns** 理解 / 会用. Each checkbox must retain independent state; all-unchecked is valid. The exact row contexts/examples are:
  1. 紧缩复句“一……就……” — 我一下飞机就给妈妈打电话。
  2. 状态补语（1） — 他跑得很快。
  3. 状态补语（2） — 他打篮球打得很好。
  4. 比较句（1） — 今天比昨天冷。
  5. 比较句（2） — 今天比昨天更冷。
  6. 转折复句“虽然……，但是……” — 外边虽然下雪了，但是不冷。
  7. 比较句（3） — 姐姐没有哥哥高。
  8. 动词“离” — 我家离学校很近。
  9. 时量补语（1） — 我们休息十分钟。
- Separate improvement field PDF98/P83: 我需要努力的

Keep the coverage label 7～9课. This is self-report, never auto-graded, never reduced to one checkbox per row or an undifferentiated paragraph.

## Vocabulary and appendix provenance

`vocabulary-appendix-inventory.json` binds every baseline lexical/POS row to its correct appendix page and star flag.

- Lesson8: 14 numbered source entries, 16 distinct word forms and 17 baseline sense records. 左 and 右 are source subentries, not extraneous vocabulary. 比's printed prep./v. must retain both separate baseline senses
- Only **爱情片** is starred (appendix PDF156/P141); the star means beyond this level's syllabus. The book's lesson vocabulary panel itself does not print that appendix star
- 有意思 has **no POS printed** in the lesson list; retain its existing editorial Vietnamese phrase label, but do not describe that label as a literal printed-source POS
- Lesson9: all 13 lexical entries match source and none is starred. 离 remains the source's verb classification; do not silently replace it with another editorial grammar classification
- Preserve neutral syllables in 左边/右边/记得/妻子/丈夫/个子/那么, source nánháir, and printed full-tone gè in relevant lesson8 lines and lesson9 半个多小时. Grammar-example pinyin is editorial supplementation

## Figure coverage and visual-authoring constraints

`source-scene-inventory.json` specifies **26 relevant original auxiliary aids**, 13 per lesson:

- Each lesson: 4 warm-up figures + 4 text/context figures + 4 comprehensive-picture figures + 1 culture figure
- Lesson8 source pages: warm-up79, texts80/82/84/85, practice86, culture87
- Lesson9 source pages: warm-up88, texts89/91/93/95, practice96, culture97

Use original auxiliary vector art with explicit labeling and source/owner bindings, not copied textbook scans. Decorative speaker portraits, mascots and section graphics need not become independent exercises. In lesson9 text1, the source scene is a clothing-store display, not a photograph of the characters; retain that distinction. In lesson8 text3 and text4, preserve both contexts as separate source placements even though both show a gift at a restaurant.

Every question figure must be present, readable and bound to its own field(s). Keep answer-bearing baseline image descriptions only as optional post-question closed hints, not an answer revealed before attempting a task. Neutral accessible descriptions may describe the same visual evidence without writing the option label or completing the sentence. The directional arrows must point in their actual respective directions; black/white garments and left-shorter/right-taller relationships must not be reversed. No arbitrary new price, exact distance, clock time or height should be introduced.

## Next acceptance gate

This audit does not approve unbuilt interactivity. After authoring, independently check the exact new draft hashes against the baseline snapshots; verify all 117 original response bindings, all 38 official answer bindings and exact answer-PDF pages, all three lesson9 source tables, all 26 final artwork pixels/manifests, every preserved source question/frame/example and the 60 unchanged homework records. Exercise each official wrong/correct path, each nonunique reference/open path, multi-blank and matrix state persistence, empty self-assessments, stale-feedback clearing and delayed answer disclosure. Real browser/release checks remain the parent task's separate gate.
