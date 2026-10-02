# HSK3 lesson 18: independent content review

Reviewed 2026-10-02. Scope: `content/hsk3/lesson-18.json`, author baseline `2f29abe`; independent reviewer `review_hsk3_lesson_eighteen`. This review did not reuse the author's visual or audio pass as evidence. No AGENTS.md was found in the accessible workspace/checkout. The reviewer read `docs/content-contract.md` and the local verified source manifest before reviewing.

## Source and visual coverage

The local source manifest identifies the supplied HSK3 textbook (SHA-256 `33a9c743f73f634f97a9864aa0423ac4e3568b3febbf57b63e983b5dcc0932f2`), answer PDF (`7cc42aa78c6b1c32f03f6deccac606c31bd787fd1f72717d45afafa29155e473`), and audio archive (`be9cf2cf78635e9996d43cbcc7ece6268e0b90700d3b7a6fec10dbea51737cdd`). This pass used their existing local rendered images and extracted MP3s; it did not re-hash the full textbook/archive or publish source files.

All eleven page images were freshly viewed, at approximately 1400 pixels high in batches of one or two, rather than relying on OCR:

| PDF / printed page | Independently checked content |
|---|---|
| 175 / 163 | Lesson title, all 4 objectives, 2 warm-ups, all 6 photographs and phrase choices |
| 176 / 164 | Text 1: 8 turns and speakers, 2 MC questions/options, numbered words 1–6 and 春节, tracks 18-1/18-2 |
| 177 / 165 | Text 1's 3 reading questions; approximate-number explanation, 3 examples and 3 tasks; Text 2 context and 2 MC questions/options |
| 178 / 166 | Text 2: 7 turns and speakers, words 7–14, tracks 18-3/18-4, 3 reading questions; first part of 刚才/刚刚 explanation |
| 179 / 167 | Remaining 刚才/刚刚 explanation, all 4 examples and 3 fill-ins; Text 3 context and 2 MC questions/options |
| 180 / 168 | Text 3: 7 turns and speakers, words 15–21, tracks 18-5/18-6, 3 reading questions; sufficient-condition explanation |
| 181 / 169 | All 3 只要 examples and 3 dialogue tasks; Text 4 context, 2 MC questions/options and complete narrative, track 18-7 |
| 182 / 170 | Words 22–28, track 18-8; Text 4's 3 reading questions; 从……起 explanation, 3 examples and 3 tasks; first fill-in word bank and item 1 |
| 183 / 171 | Fill-ins 2–10 and second word bank; all 3 image dialogues, blanks, speaker labels and actual photographs |
| 184 / 172 | Four-person classroom task; vocabulary self-review and first 5 grammar-review rows |
| 185 / 173 | Remaining 7 grammar-review rows and improvement self-reflection |

Answer-key pages 26 and 27 were separately visually inspected. Warm-up picture sequence is C, B, D, A, F, E. The eight published source MC answer indices are `[2,2]`, `[2,0]`, `[2,1]`, `[2,2]`, matching C/C, C/A, C/B, C/C. The printed integrated fill-in key is A, D, B, C, E, D, C, E, B, A. The source-only fill-ins remain open practice; no answer payload was added.

Every nested source/contextSource page is within PDF 175–185, with the +12 printed-page offset verified programmatically. Text 2 and 3 contexts correctly retain their preceding-page provenance. Vocabulary track provenance is the entire original list, not an invented per-word recording. Supplemental picture descriptions describe the actual six warm-up photos and three exercise photos and remain explicitly supplemental. There is no printed culture panel, so none was invented.

## Complete inventory

- 4 objectives and 2 warm-ups
- 4 texts, 25 source lines, 20 source questions (8 multiple-choice and 12 open reading questions)
- 28 numbered headwords plus proper noun 春节; 大概 has separate adverb/adjective records, giving 30 vocabulary records
- 4 grammar points, 13 printed examples and 12 printed practice tasks
- 10 integrated word-bank fill-ins and 3 complete picture dialogues
- 1 classroom activity and all 12 grammar rows in the lesson 16–18 review, with vocabulary and improvement self-review
- 30 original homework questions: 10 vocabulary/grammar MC, 5 ordering, 5 original-audio MC, 5 Vietnamese-to-Chinese MC, 5 manual Vietnamese-to-Chinese writing
- 4 distinct independent original-audio listening questions

## Repairs made during this independent review

1. Restored grammar 2 practice 3's printed subject and negation: `我不是……开始学习中文的，我已经学了一年了。` The author version incorrectly said `他是……`. Updated the Vietnamese accordingly.
2. Restored grammar 3 practice 3's `不累` in place of the unprinted `没事`, with matching Vietnamese.
3. Restored integrated fill-in 7's `这一年` rather than `今年`; restored fill-in 8's blank position to `我回家住______三四天` rather than putting it before `回家住`.
4. Restored the first review example's `一会儿在你身上爬` in place of `撒娇`, with matching Vietnamese.
5. Restored the exact printed wording of Text 4 MC question 1 and Text 2 opening-address punctuation; aligned the latter's editorial pinyin punctuation.
6. Restored full printed Chinese grammar explanations for grammar points 2–4 in place of compressed paraphrases. Vietnamese explanations remain explicitly editorial and can explain the examples.
7. Repaired grammar practice task metadata: approximate-number answers, 刚才/刚刚 fill-ins, 只要 completed dialogues, and 从……起 completed sentences are now correctly distinguished. Preserved the printed “概数表达法” instruction wording.
8. Replaced homework 03, which closely repeated the book's 刚才的问题 fill-in, with an original recent-time comprehension question. Reframed homework 16 around simultaneous versus sequential activities rather than copying the source activity-recall question. Replaced independent listening 04's broad source-question paraphrase with narrative-order comprehension. Replaced translation-choice 22's close adaptation of the printed 刚才的电话 example with an original question about remembering a recent guest's name.
9. Improved distractors in several original MC/listening items, simplified the condition-comparison answer wording, and removed the awkward extra `住了` in ordering item 15. Refined ordering item 12's Vietnamese and the time/inference phrasing in independent listening 01 and 03.
10. Improved Vietnamese lexical phrasing for 联欢 and 起 and corrected Vietnamese numeral spacing throughout. Replaced pending-review metadata with this completed, explicitly bounded independent review.

## Language and assessment checks

All Chinese source text, speakers, options, vocabulary, grammar, section blocks, prompts, answer keys, Vietnamese fields and existing pinyin fields were read. All 30 vocabulary pronunciations/POS were compared to the original word-list pixels. This includes 大概's two POS, 不久 as adjective, 起 as the post-verbal sense, and neutral-tone 叔叔/懂得. Existing editorial sentence pinyin was reviewed for context, neutral-tone particles, and 一/不 sandhi (including 第一次, 一边, 一般, 一起, 一定, 一个, 一遍, 放假 jià, 得 de versus 得到 dédào, and 着 zhe); no unsupported ASR spelling replaced printed names or characters. Sentence pinyin remains an optional editorial layer; this content review does not independently test its default-off UI setting.

Original assessments were checked manually for a single correct choice, answerable linked-track evidence, reasonable HSK3-level language, plausible incorrect alternatives and independence from the printed exercises. Source-derived comprehension facts naturally recur, but the revised supplemental tasks test a distinct detail, meaning, intent or sequence rather than republishing source questions. The five homework listening items address activity simultaneity, who had mentioned 家月, who appears in the family photo, the motivation behind study, and confidence in future development. The four independent items address the sleep-time boundary, how 家月 learned to make dumplings, reassurance intent, and narrative sequence.

Ordering answers were assembled and checked under their explicit starting-token/punctuation constraints:

- 11: 我们班大概有十七八个人想参加联欢活动。 Quantity must immediately follow 大概有.
- 12: 刚才的话让我想起了那件事。 Starts with 刚才的; terminal 那件事。 is anchored.
- 13: 只要你坚持努力，我们就会帮你完成目标。 Starts with 只要你; comma and terminal phrase constrain both clauses.
- 14: 从那次见面起，我就开始喜欢这座城市了。 Starts with 从; 起， closes the time phrase.
- 15: 姐姐刚刚来这里三四天。 Starts with 姐姐; 刚刚 must immediately follow the subject.

Each has one sensible expected order under those instructions. This is a linguistic review, not a claim that a grammar parser mechanically proved uniqueness.

Manual items 26–30 have only id, part, prompt, neutral Vietnamese focus and source fields. No options, tokens, explanation, answer, model answer or Chinese target chunk is present; their Vietnamese prompts are distinct from auto-graded prompts. All original exercise source records are supplemental.

## Fresh audio verification

All eight original extracted MP3s were freshly hashed against entries selected by numeric `(level=3, lesson=18, track=1…8)` in `content/audio-manifest.json`. All eight were fully decoded using `ffmpeg -v error -i <file> -f null -`; every run exited 0 with empty stderr. Fresh ffprobe durations are listed below.

| Track | Bytes | Duration (s) | SHA-256 |
|---|---:|---:|---|
| 18-1 | 645802 | 37.824689 | 2654f447847618211a2c3b21f07c4a07c277e0be3f53758b74acc41219b4289f |
| 18-2 | 375586 | 20.936189 | fc2d5b952adc888bc29fa1e688a1605757f958a106e12ba1b0511172cd99ff22 |
| 18-3 | 689587 | 40.561256 | f5a36300acf93f9580d7bfcd10fc36e37f8e189a9461df4ef35386cf5d3bba04 |
| 18-4 | 348898 | 19.268189 | a407820bb445860c35a1555b2d00a53ead3d11bef9508bf4ed23acaae7aded96 |
| 18-5 | 606604 | 35.374813 | d44016f7973137a66919e59828a38b70f0f888112dc640617f0756df35184fcf |
| 18-6 | 300943 | 16.271000 | 0cb746a45b915648931463682f95ec44ead39466c61542c266d9d76f7dcb0945 |
| 18-7 | 612442 | 35.739689 | f8dde299de5fecc00c0d5bac2b0a5ac7700b3735237fbaa5cba9ec14bb719d3a |
| 18-8 | 312619 | 17.000756 | 7add5c32ca33903d81d06484abb6f1ca9d239b06fb676234e3b526da55e7d6e0 |

All eight full existing ASR JSON files, including every segment and the complete text, were independently read and semantically compared to the complete Chinese texts/word lists, not sampled. Odd tracks match the four source texts in order; even tracks match their complete word lists. Known ASR limitations were preserved as such: 18-2 writes 连欢 for printed 联欢; 18-3 writes 佳愿 for 家月; 18-5 uses 她 for printed 他; 18-6 writes 发声 for printed 发生; 18-7 uses 它 for printed 他. Traditional-character output and Arabic `12` do not indicate source mismatch. The page pixels, not ASR, determine the published characters and names. ASR was not regenerated in this review, and this is not full human-listening or pronunciation certification.

## Validation and remaining limits

`HSK_PILOT=1 node course-app/tools/validate-content.mjs` passes with zero issues after the final lesson edits. An additional focused check confirmed inventory, all page offsets, source MC indices, assembled ordering answers and the manual-question field whitelist. No raw PDF, page image or answer package was published or uploaded. This review modifies only the lesson JSON and this audit; generated aggregate validation reports are not committed.

No lesson-18 source or content blocker remains within this review's scope. This is not a whole-course release certification, a UI/accessibility review, lexical catalogue closure, or full human-listening certification.
