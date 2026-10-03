# HSK2 lessons 4–5: independent review

Date: 2026-10-03 (UTC). Reviewer is separate from the draft author. Initial assessment: **do not merge the current drafts yet**. Four narrow findings need correction/recheck; source transcription, official keys, separate blanks, and renderer reachability otherwise pass within the scope below. No P0/P1 defect was found.

## Findings

### R1 — P2: clock activity discloses the answer construction before an attempt

- Source: textbook PDF59 / printed44, picture task 1
- ID: `hsk2-fltrp-2026:l05:activity:picture-dialogue1`
- The always-visible `note` supplies both `十点多` and `都……了` before the blank. In combination these effectively provide the target reference `都十点多了`. The current real `mountLesson` inserts this note above the field; closing the older section-level picture hints does not hide it.
- Fix: keep a neutral note before the attempt; move clock interpretation, grammar construction and tolerance explanation into post-submit reference feedback or clearly labelled closed hints. Retain an accessible, neutral depiction of the clock.
- The reference itself is sound. A separate 8x source crop shows the broad hour hand near 10 and long broad hand near 1. The fine auxiliary hand near 11 is not the hour hand. `十点多` is defensible, and this open picture item must not demand a unique minute or be promoted to an official key.

### R2 — P2: three L4 word-choice fields display the preceding source page

- Source: textbook PDF50–51 / printed35–36; answer PDF5–6
- IDs: `hsk2-fltrp-2026:l04:field:comprehensive-word-3`, `-4`, `-5`; parent activity `:activity:comprehensive-words`
- The source question blocks correctly preserve PDF51/P36 for items 3–5, but all five interactive fields share the activity source PDF50/P35. The current renderer only emits that single page attribution for the group. Thus the new inputs lose the original second-page association. All five answers and answer-PDF references are correct.
- Fix: preserve per-field source pages and display the two-page span, or split the cross-page group while retaining stable field IDs and answers. Items 1–2 belong to PDF50/P35; 3–5 belong to PDF51/P36.

### R3 — P2: L4's source experience table is flattened

- Source: textbook PDF44 / printed29
- ID: `hsk2-fltrp-2026:l04:activity:warmup-experiences`
- All nine correct verb/item pairs exist and remain independent open checkboxes. Multiple selections and zero selections work. However the source's verb rows (`吃/喝/去`) and three situation columns (`情况1/2/3`) are not represented as a table. Actual renderer invocation produces nine flat labels and zero table elements.
- Fix: retain a semantic three-row, three-option table (plus row-heading column), with each cell's word visible and independently selectable. Do not turn it into single-choice preferences, mutually exclusive columns, or hidden labels. Maintain nine IDs and stored values.

### R4 — P2: two L4 hanging-object schematics still float below the rail

- Sources: textbook PDF44/P29 warm-up 1 and PDF48/P33 text 3
- IDs: `hsk2-fltrp-2026:l04:illustration:warmup-1`, `hsk2-fltrp-2026:l04:illustration:text3`
- Independently rasterized images visibly separate the supports from the rail. In `hsk2-l04-warmup-1.svg`, hanger apexes are at y87 and y88 while the rail is at y80, leaving a real gap after stroke widths. In `hsk2-l04-text3.svg`, transformed curved bag handles end visually several pixels below the rail (rail y100; curve actual peak about y108.8, before stroke width). The author report's earlier repair does not fully close these contacts.
- Fix: draw real connecting hooks/straps, or change support positions so the load-bearing shapes contact the rail; rerasterize both. Preserve colors, field IDs and associations. This is a perceptual drawing defect, not an incorrect answer key.

### R5 — P3: one author-report word-numbering statement is imprecise

- Source: textbook PDF53 / printed38, vocabulary panel
- The source labels `上去` with number 4; `下面` is the unnumbered grouped entry preceding numbered `面` (5). The author report describes both 上去/下面 as unnumbered.
- The actual twenty vocabulary/sense rows are correct: final source number 17, plus unnumbered 下面, plus the separate 快 and 跟 senses. Clarify the report wording; no vocabulary row should be removed.

## Independent source work performed

I first read the author's report to understand scope, then independently rasterized and inspected all 26 requested full pages: textbook PDF44–60, answers PDF5–7, appendix PDF156–161. This included the original photographs, not only extracted text. I additionally rasterized and inspected an 8x clock detail from textbook PDF59. Hashes and page inventory are in `source-render-index.json`. Reviewer-created source raster intermediates were deleted after inspection so the report does not introduce source scan pixels into the repository. The original PDFs were not modified.

The 29 actual SVG files were freshly rasterized with MuPDF, inspected in five readable 2-column contact sheets and checked against the source situation and corresponding field. Their original SVG and raster hashes are in `illustration-render-index.json`; fresh original-artwork raster evidence remains in `illustration-renders/`. The clock, six direction diagrams, clothing hands, stair contacts and rail contacts were explicitly examined.

Initial draft SHA-256:

- L4: `57409030b94d0d496df7a2e9322025429e6fa34d4dbf2cfbc858ef8844efeade`
- L5: `70c9052d94ac43d49e527be76305d2a04b7f2bd06ab84197703bc725793575e7`

## Verified content and behavior

- L4 has 26 activities / 52 fields / 19 official-key fields / 11 illustrations; L5 has 26 / 50 / 25 / 18. These are new textbook interactions, not replacements for supplemental homework.
- All 44 official fields agree with fresh answer-page observation and the corresponding original questions and options. No official picture-completion key was invented.
- L4 official sequences: warm-up ACDB; text1 AA; text2 CC; text3 BB; text4 listen FT and read AB; word-choice ADEBC. Word item1 key is on answer PDF5; items2–5 are on PDF6.
- L5 official sequences: warm-up1 CBDA; direction task CADEBF; text1 CC; text2 CB; text3 CA; text4 listen FF and read AC; word-choice ABEDC.
- The answer packet's L5 text4 reading header says P43. The actual two questions are at textbook PDF59/P44. The draft correctly maps the questions to PDF59/P44 and official keys to answer PDF7. This source discrepancy is real and is not a draft key error.
- All 32 original text questions have distinct target bindings. Full listen-twice directions, role-reading instructions and narrative read-aloud instructions are represented.
- Each lesson has nine source grammar dialogues. L4 has 4+3+3 = ten separate blanks; L5 has 4+4+3 = eleven. Multiple blanks stay independent, including the 来/去 response pair and `回 公司 去` pair.
- Grammar and open reading references are explicitly nonunique. The new renderer accepts a different response and presents reference feedback without an automatic incorrect marker. Picture completions, role-play notes and surveys are not official-key graded.
- All four picture completions per lesson preserve the original sentence frames. The existing section-level editorial picture descriptions are now inside a closed `details` element after the four tasks; the R1 activity-specific note is the remaining exception.
- L4's nine experiences preserve foods 包子/饺子/面条儿, teas 绿茶/红茶/花茶, countries 中国/法国/泰国. Zero and multiple selections are accepted; the independently stored values survive a same-state remount.
- L5's six arrows consistently give 进来/过来/进去/下来/过去/下去 from the speech-bubble speaker's location. Direction3 is outside-to-inside away from the speaker; direction4 has a speaker below the moving child; direction6 has a speaker above the descending mover. No correct direction word is drawn into the scene. Stair feet meet the intended treads/platform.
- The red and white trousers in L4 text2 meet the hands through their hangers. L4's adult/child crossing illustration is rear-facing. L5 apple is held at the hand, phone at the ear, and meal/doorway/greeting schematics preserve the broad original teaching situations.
- All 36 vocabulary rows have correct exact appendix-page bindings. Only 试 (PDF159), 更 (PDF157), 礼物 (PDF158) are starred. L4 过 remains neutral `guo`, distinct from the lesson6 `guò` verb. L5's 快 adjective/adverb and 跟 preposition/conjunction remain separate stable rows.
- All original baseline lesson keys except additive vocabulary flags/page bindings are deeply unchanged. In particular each lesson retains all thirty homework records, order, content and IDs: 25 automatic + five manual. New textbook activities are separate.
- L4 does not invent a culture panel. L5 keeps missing culture video5-1 explicit and states that text audio5-1 is not that video.
- All 29 SVGs are original auxiliary schematics, labeled not textbook images, with no embedded raster, script, external image reference or logo. They remain draft-not-in-release. This review did not approve publication or copy anything into public assets.

## Reproducible checks

- `python3 check-data-independently.py`: 379 independent assertions passed. The official sequences and appendix mappings were transcribed from this review's source observation, not imported from author tests.
- `node --experimental-strip-types check-render-function.mjs`: 34 checks passed across sixteen renderer views. Every one of the 52 activity IDs, 102 field IDs and 29 illustration IDs is reachable exactly once in its mapped view. The actual current `mountLesson` function was invoked with a deterministic DOM recorder; draft image statuses were promoted only in memory to exercise the intended approved-image branch. No file was promoted.
- The render checks also cover empty pre-submit feedback, closed old picture hints, retained role-play instructions/examples, separate grammar inputs, nonunique reference feedback and zero/multiple survey state.
- Initial evidence is retained under `initial-evidence/`; revised checks must not overwrite that initial observation.

## Acceptance boundary

This is an independent AI source/content, original-artwork pixel, data-invariant and renderer-structure review. It is not a native-speaker/qualified-teacher certification. No fresh perceptual audio review, word/sentence alignment review, real browser layout, keyboard/screen-reader behavior, local storage/import/export persistence, complete release build or remote CI acceptance is claimed. The existing local socket restriction was respected; no browser launch was retried. The parent will cover actual Chromium/WebKit browser and release acceptance after fixes.

Merge recommendation for the reviewed initial hashes: **hold** pending R1–R4 corrections and independent recheck. R5 is a low-priority report correction. Once corrected, source/editorial review may pass without implying the untested stages above passed.
