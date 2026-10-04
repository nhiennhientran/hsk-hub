# HSK3 lessons 10–11: source-faithful author candidate

Date: 2026-10-04. Baseline: `9b7c76702e9724b4c647750138d800605254a116`.

Status: author candidate, ready for independent source/content/figure review. This document is not independent acceptance. Historical `reviewStatus` records remain unchanged and do not certify the new interaction/figure layer.

## Verified source identity

- 新HSK教程3: 212 PDF pages, 75,121,060 bytes. SHA256 `33a9c743f73f634f97a9864aa0423ac4e3568b3febbf57b63e983b5dcc0932f2`.
- 《新HSK教程3》客观题答案: 27 PDF pages, 7,228,714 bytes. SHA256 `7cc42aa78c6b1c32f03f6deccac606c31bd787fd1f72717d45afafa29155e473`.
- Actual source pixels inspected: textbook PDF98–115, printed86–103; objective-answer PDF14–16. Page locations were located from existing source mappings and verified in the rendered pages, rather than assumed from an offset alone.
- Neither full source PDFs nor scanned source/answer pages are included in the candidate or evidence.

## Corpus preservation

No old key/value is changed or deleted. Each lesson only adds `activities`, `illustrationManifest`, `grammarSourceExplanations`, and `grammarPresentations`. Existing context/body page distinctions remain intact.

Preserved in full: eight texts and their 50 lines/paragraphs/stage directions; 62 vocabulary/POS records; seven grammar units, their 25 examples and 21 practices; all 39 original text-question/directive IDs; all 60 original homework items, including the 25 automatic/five manual boundary per lesson; all eight supplemental listening tasks; source sections, cultural availability notes and historical review records. No old answer receipt or persistence data was edited.

`preservation-diff.json` records the recursive comparison. The author validator recreates it directly from the baseline commit. Preservation of content is not proof of persistence/migration safety; that remains an integration gate.

## New interaction coverage

- L10: 26 activities, 68 saved fields, 14 original figures. Fields: 24 official, 28 editorial-reference, 16 open.
- L11: 29 activities, 72 saved fields, 13 original figures. Fields: 24 official, 35 editorial-reference, 13 open.
- Combined: 55 activities, 140 fields and 27 figures. Every source text question/directive is bound to its original ID.

### Introductory tasks and listening

- Four optional objective checks for L10 and three for L11; six-picture matching and two open pair-discussion fields per lesson.
- L10 matching keys: B E D / A F C, answer PDF14. L11: A C E / D B F, answer PDF15. Original source picture order is retained.
- Four separate listen-twice activities per lesson, bound to original odd-numbered tracks 1, 3, 5, 7. Each has two choices and the actual question-page attribution, not the later text-body page when these differ.
- L10 listening keys: C B / B B / A B / B A, all answer PDF14.
- L11 listening keys: A C / C C on answer PDF15; C C / C B on answer PDF16. PDF15 ends with the text3 heading; its answers are on PDF16.
- All new listening options include Vietnamese meanings. The printed 关于 gloss in L10 text2 remains in the original question and its new prompt.

### Reading and discussion

- Three role-reading tasks and one read-aloud task per lesson, following each source directive.
- L10 texts1–3 have nine reading questions with bilingual, non-unique editorial reference answers. L11 has 12 such questions.
- L10 text4 does **not** have three reading questions. PDF105 prints “朗读课文。” followed by a comparison of China’s and the learner’s country’s school advancement systems. The activity therefore keeps one read-aloud completion check, one non-unique China retelling reference, and one open country-comparison response. The original complete directive remains visible, and the two response boxes are labeled as editorial organization of that directive.
- The China reference is explicitly a retelling of the textbook. It does not assert a universal/current education-system rule. It retains the source’s 初中二年级 / 后年 wording without silently “correcting” the source chronology.
- L11 text4’s final answer distinguishes the source’s literal “生活也很重要” from the reasonable inference drawn from Wang Yixue’s decision to stay near family.
- Personal discussion, the own-country response, objectives, classroom exchanges and guesses remain open. No unique answer is assigned to them. References are supplied as editorial self-check material, never official exact-string answers.

### Grammar

- All original explanations, examples and practices remain.
- Complete source-Chinese explanatory paragraphs are added with Vietnamese translations. L10’s “在……上/中/下” introduction is on PDF101; its three detailed explanations and six examples are correctly grouped on PDF102. L11’s 还是/或者 explanations are separately grouped on PDF109, retaining all four original examples in order.
- Other full source explanations: L10 把(1) PDF100 and 把(2) PDF103; L11 看来 PDF110, 把(3) PDF112, 对……来说 PDF113.
- All 21 practice blanks are independently saved (L10 nine, L11 twelve), with bilingual editorial examples appropriate to their complete sentence/dialogue context. No practice is treated as having one uniquely correct string.

### Comprehensive practice and classroom work

- Two independent five-word banks and ten official blanks per lesson. L10 keys A C E D B / D C B E A: Q1–4 answer PDF14; Q5–10 PDF15. L11 keys C A D B E / D B A E C, all answer PDF16.
- L10 picture dialogues have 3+3+3 independent blanks, on PDF105,106,106. L11 has 3+4+4 on PDF115. Full original dialogue prompts remain alongside separate fields. Each blank has a bilingual, non-unique editorial reference.
- L10 classroom work retains the four-person foreign-language-method exchange, whole-class sharing and vote for three methods. Eight open recording fields follow those source steps; no ranking or “best method” is pre-filled.
- L11 retains the four-person profession-guessing task, the prohibition on directly stating the profession, and the printed example. Four rounds each have an open description and an open guess/reason field. There is no fabricated official profession key.
- L10 retains the 中国的义务教育 culture theme and video10-1 identifier. The original video remains unavailable. L11 retains the 接 tip and has no invented culture or review panel. Neither lesson has an invented periodic-review page.

## Original illustrations and pixel inspection

The figures are original instructional vectors, not source crops or photographic replicas. All 27 SVGs were rasterized at 640×400 and inspected across the seven included author contact sheets. Repairs clarified seated legs/chairs and furniture geometry, added laptop keyboard details and the writing pencil, removed an extra arm, and fixed a cropped visitor and desk. Final changed assets were reopened individually.

- L10: six warmups; four textbook scenes (students sharing notes, discussing an exam, asking a teacher, photography); three practice scenes; one teacher/three-student culture scene.
- L11: six warmups; four scenes (office scheduling, computer preparation, office conversation, Beijing/Shanghai directions); three practice scenes.
- Warmup SVGs contain no answer letters or vocabulary answer labels. The 100 mark and arithmetic numerals are source-relevant visual cues, not labels identifying the matching option. Bilingual alt/zoom descriptions describe visible features rather than naming the matching solution.
- Every figure retains exact page, owner, order, field/activity bindings and SHA256. The culture figure binds to the existing culture renderer while retaining its source-section owner separately.
- `publicationStatus: approved` permits rendering the author’s original asset; all `independentReview` statuses remain pending.

## Evidence and checks

### Vietnamese completion revision

The current candidate incorporates all seven required prompt/reference composition repairs and six optional natural-Vietnamese grammar improvements. Changes from the first author freeze are confined to 25 Vietnamese string values inside `activities`; all Chinese values, all old baseline values, IDs, counts, sources, assessment types and SVG bytes remain unchanged. The six naturally translated grammar prompts explicitly explain that the Vietnamese blank may cover a different phrase boundary from the Chinese blank.

`vietnamese-completion-repairs.json` contains every exact before/after value, stable activity ID, old/new JSON hash, and all 11 affected complete Vietnamese sentences/dialogues with their references inserted. Each assembled sentence/dialogue was read in context. Baseline preservation, counts, source bindings and `verifyActivities` were rerun successfully. Independent bounded recheck of this revision is pending.

- `lesson-10-source-map.json` and `lesson-11-source-map.json`: page-by-page author coverage; preserved source nodes; grammar explanation/group locations; every new activity/field and figure binding.
- `author-figure-ledger.json` and `author-figures-sheet-1.png` through `author-figures-sheet-7.png`: author figure review only.
- `frozen-candidate-hashes.json`: exact two-JSON/27-SVG candidate identity.
- `validate-author-candidate.mjs` and `author-validation.json`: deterministic original-key preservation, counts, official keys and answer-page splits, original task-ID binding, non-unique grading separation, figure hashes, no embedded scans/scripts, and existing `verifyActivities` compatibility. Passed for both lessons.

Not claimed: independent acceptance; integrated browser/viewport/accessibility/persistence testing; full end-to-end audio listening; human/native-speaker certification; Git publication or deployment. These are author content/asset deliverables for the next independent and integration gates. No later lessons were edited.
