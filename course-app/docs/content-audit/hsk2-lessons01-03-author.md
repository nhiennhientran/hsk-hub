# HSK2 lessons 1–3: author evidence and review handoff

Date: 2026-10-02 (UTC)
Author: Codex content-author worker
Status: Author source/Chinese, Vietnamese, pinyin and question-design pass completed. **Independent review pending. This is not release certification.**

## Ownership and deliverables

Only `content/hsk2/lesson-01.json`, `lesson-02.json`, `lesson-03.json` and this report were authored by this worker. No engine, legacy application, deployment or source archive changes. The validator was executed as requested; its generated shared report is not part of this scoped commit.

Canonical course identity: `hsk2-fltrp-2026`, version `2026.1`. Lesson IDs and child object IDs are distinct from HSK1.

## Actual source inventory

| Lesson | Printed pages | One-based PDF pages | Numbered source vocabulary | Source proper nouns | Supplemental vocabulary | Total entries |
| --- | --- | --- | ---: | ---: | ---: | ---: |
| 1 | 1–9 | 16–24 | 14 | 1: 北京烤鸭 | 0 | 15 |
| 2 | 10–18 | 25–33 | 16 | 1: 北京大学 | 0 | 17 |
| 3, including review | 19–28 | 34–43 | 15 | 0 | 0 | 15 |
| Total | 1–28 | 16–43 | 45 | 2 | 0 | 47 |

北京烤鸭 and 北京大学 are printed proper-noun vocabulary entries, not editorial additions. 西安 appears in lesson 3 but is not a separately printed word-list entry there, so it has not been silently added to the source vocabulary count. Source entries such as 名 and 送 retain the printed multiple senses within their printed entry. There is no repeated-word padding.

Each lesson includes four complete texts, their source listening and reading questions, three grammar points, the source warm-ups, integrated exercises, classroom activity, culture column and any printed tip. Lesson 3 also preserves the two vocabulary self-assessment rows, nine grammar self-assessment rows, both “understand/can use” criteria, and improvement field of the lessons 1–3 review.

Totals: 12 texts, 55 speaker turns/narrative blocks, 48 source text questions, nine grammar points, 17 additional sections, 90 original homework questions and 12 separate original independent-listening questions.

## Pixel inspection completed

Actual rendered page pixels were viewed for **every** textbook PDF page 16–43, using the corresponding high-resolution PNGs, not solely OCR. Thus all printed lesson pages 1–28 were inspected, including image prompts, word-list tables, pinyin, footnotes, activity examples and culture panels.

The supplied answer PDF was rendered separately and its PDF pages **1–4** were viewed as actual images. They cover all objective answer-key material relevant to lessons 1–3, including the four-image warm-up mappings. Source multiple-choice and true/false answers were checked against those pages. The key itself is neither published nor embedded as a raw file.

Representative OCR corrections made by consulting pixels:

- Lesson 1 PDF 17: recovered full vocabulary `就、给、让、接`, correct 王一飞 / 王一雪 names and attribution; the OCR had largely lost the word list
- PDF 18: first answer option for the first-visit question is `第一次`, not the OCR’s erroneous second-visit interpretation
- PDF 20: full telephone exchange, `帮忙、不好意思、已经、那`, and the correct `今天早上` arrival option
- PDF 22: source narrative has `是您姐姐来接的我们`; this Chinese wording was preserved. The Vietnamese follows Chinese 姐姐 (“chị gái”), rather than copying the supplied English translation’s “cousin” wording
- PDF 23: restored all picture sentence frames and the printed tip for `多听、多说`
- PDF 25: restored all three preference-table rows omitted from OCR
- PDF 28: recovered seven word-list entries (`啊、万、名、网上、外国、间、教室`) and correct total/foreign student quantities
- PDF 30: preserved source `电影院还不小`, `天啊！有的还不到二十块钱`, and the explicit footnote identifying the pictured building as 北京大学百周年纪念讲堂
- PDF 32: recovered clothing price `219` from the picture; did not invent the pictured teacher’s exact age
- PDF 35: source 刘明 works too late to finish before leaving; original options and 王一雪’s completed cooking question restored
- PDF 36: all affirmative, negative and three interrogative result-complement examples restored, including `你学没学会？`
- PDF 39: recovered word list `洗、自己、拿、手、为什么、不错`; source example is `洗洗手`, not an OCR-reconstructed “wash apples” instruction
- PDF 40: recovered `每` in vocabulary and full narrative `送完孩子回家后，医院就来电话了`
- PDF 42–43: preserved all content of the after-three-lessons review, not just its heading

## Translation, pinyin and provenance decisions

- Every Vietnamese value is an editorial translation. This is explicitly recorded in each lesson’s review notes; it is not claimed to appear in the book
- Textbook Chinese is transcribed from pixels. Image-only prompts are preserved as their printed sentence frames plus clearly labelled editorial descriptions of visible content, without publishing source page images
- Text and vocabulary pinyin were manually entered and checked against source pinyin. Person names, 地名 西安 (`Xī'ān`), direction verbs, tone-sandhi forms and neutral syllables were reviewed. Grammar-example pinyin is editorial and manually supplied because those printed examples do not include pinyin
- Grammar explanations in Vietnamese sometimes provide an explicitly pedagogical clarification. For instance, the `多` explanation warns that the classifier-after-small-number pattern concerns divisible units such as money/age and should not be generalized to arbitrary discrete-object classifiers
- Text source references point to the page carrying the dialogue/narrative. Some introductions and pre-listening questions appear on the preceding page; those questions have their own exact page references. Independent reviewer may add a separate context-page field if desired by the engine, without changing the line-page references
- All homework and independent-listening objects have `supplemental` provenance. Source exercises remain distinguishable from the original graded homework set

## Assessment design

For **each** lesson:

1. 10 original vocabulary/grammar multiple-choice questions
2. Five ordering questions with Vietnamese meaning, explicit starting phrase and punctuation-bound final blocks, giving one intended sensible order
3. Five original-audio listening multiple-choice questions
4. Five Vietnamese-to-Chinese translation multiple-choice questions
5. Five Vietnamese-to-Chinese manual writing questions

The manual questions contain only ID, part, neutral Chinese instruction, Vietnamese prompt, focus and source. They contain no answer, options, tokens, explanation, model solution or grading key. No teacher solutions were placed in public JSON or in this report.

Four additional listening questions per lesson use separate `listenNN` IDs and test additional comprehension points across all four odd-numbered tracks. They are not counted among the 30 homework items. No HSK1 questions were copied or inspected for reuse.

Automatic answer indices and all ordering permutations were self-checked. An independent pedagogical review remains required for ambiguity, distractor strength and translation nuance.

## Audio and culture resource scope

- Text tracks: `1-1,1-3,1-5,1-7`; `2-1,2-3,2-5,2-7`; `3-1,3-3,3-5,3-7`
- Vocabulary tracks: corresponding even tracks `1-2` through `3-8`, matching the source word-list labels
- Verified against the ingestion audio manifest: all 24 lesson 1–3 source files exist in the manifest and their full decode status is `passed`
- The even tracks are full original vocabulary-list recordings. The JSON does **not** claim that playing a word starts an isolated single-word clip
- Author semantic grounding is by the printed source dialogue and source audio labels. **Full human-equivalent listening/transcription certification has not been performed by this author**; it remains an independent audio review requirement
- Culture panels reference **videos** `1-1`, `2-1`, `3-1`. The supplied archives contain lesson MP3 recordings, not these culture videos. Each culture section honestly preserves the printed topic and describes the visible image, while explaining the absent video. It does not relabel a text MP3 as a culture video or invent a video transcript
- Campus quantities and ticket prices are retained as textbook narrative facts and explicitly described as non-live information

## Validation

Executed from `course-app`:

`HSK_PILOT=1 node tools/validate-content.mjs`

Author run after lesson 3: three lessons, 47 vocabulary entries, 12 texts, nine grammar points, 90 homework items, 12 independent listening items, 17 sections; **zero validation issues**.

Additional author assertions passed: all manual writing objects lack every prohibited answer-bearing field; question provenance is supplemental; all 24 audio manifest entries decode successfully; each lesson has the exact 10/5/5/5/5 homework distribution.

Release-mode validation is intentionally blocked by the honest pending independent-review status. No final independent reviewer identity or certification was fabricated.
