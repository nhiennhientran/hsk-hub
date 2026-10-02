# HSK2 FLTRP 2026 lessons 05–09 author audit

Date: 2026-10-02 UTC. Status: lessons 05–06 author-reviewed; independent review pending. Lessons 07–09 remain in progress and are not certified by this checkpoint.

## Completed checkpoint: lessons 05–06

| Lesson | Printed pages | Textbook PDF pages actually viewed | Answer PDF pages actually viewed | Texts / turns | Vocabulary records | Grammar | Homework | Separate listening | Sections |
| --- | --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: |
| 05 | 37–45 | 52, 53, 54, 55, 56, 57, 58, 59, 60 | 6, 7 | 4 / 22 | 20 | 3 | 30 | 4 | 4 |
| 06 | 46–55 | 61, 62, 63, 64, 65, 66, 67, 68, 69, 70 | 7, 8, 9 | 4 / 22 | 15 | 3 | 30 | 4 | 6 |

Every listed textbook page and answer-key page was opened as actual local rendered pixels. OCR was a locating aid only. No source scans, answer packages, or archives were placed in the repository. Pinyin over source dialogue/narrative text and vocabulary was checked from pixels. Grammar example pinyin and all Vietnamese translations are editorial additions.

### Coverage and source decisions

- Both lessons retain all four complete texts and speaker identities, all 16 printed text questions per lesson, all three grammar explanations with their source examples and practice dialogue frames, both warm-ups, five integrated gap items, all four picture-task frames, and role-play instructions/examples
- Lesson 5 contains 17 numbered vocabulary entries plus the separately printed headword 下面 within the 面 entry. 快 is split into its printed adverb and adjective senses, and 跟 into printed preposition/conjunction senses, yielding 20 explicit lexical records rather than a syllabus-count estimate
- Lesson 6 contains 14 numbered vocabulary entries. The verb and noun senses of 画 are distinct records, yielding 15. 过 is the full-tone verb guò here, distinguished from aspect-particle guo in lesson 4; 长 is cháng and 地 is de
- Lesson 5 source characters corrected against OCR include 下来/上来/上去/下面/面/一会儿/下去; the image-only warm-up order is retained with editorial descriptions. Source pinyin including 一会儿 yíhuìr, 奶奶 nǎinai, 不上去 bú shàngqù and names is preserved
- Lesson 6 source image prevents OCR losses in the vocabulary sidebar and text 4: birthday preparations include 鱼啊肉啊什么的, children 早早地就上床了, and 舒舒服服地睡一觉. The exact source 一家人去看了个电影 is retained; making a cake is not falsely substituted for buying one
- Printed objective keys were checked with answer pages: lesson 5 text keys CC / CB / CA / FF / AC; gap bank A B E D C. Lesson 6 keys CB / AC / CC / FF / AB; gap bank A E D C B. Source option order remains unchanged
- Chinese role-play example on lesson 6 printed 54 is retained literally as A: 明明，今天是你的生日！ B: 生日快乐！ rather than silently rewriting the printed turn arrangement
- Lesson 6's complete printed-page-55 review contains both vocabulary fields, nine distinct grammar rows and exact Chinese examples, separate 理解 / 会用 checks, and the final improvement field
- Lesson 5 culture panel 中国人打招呼的方式 references video 5-1. Lesson 6 panel 生日特色食物 references video 6-1; its separate birthday-noodle/long-life tip on printed 51 is retained. These videos are not present in supplied assets. No MP3 is relabelled as a culture video
- Picture descriptions are visibly labelled as editorial additions and have supplemental provenance; text contexts have explicit page-level source objects. Lesson 6 text 2/3 contexts correctly map to printed 48/50 while their spoken lines map to 49/51

### Assessment checks

Each lesson has exactly 10 vocabulary/grammar choices, 5 ordering tasks, 5 original-audio listening choices, 5 Vietnamese-to-Chinese choices, and 5 manual Vietnamese-to-Chinese writing tasks. All are original supplemental material.

All ordering tasks have 5–7 meaningful distinct tokens, reconstructed keys, anchored punctuation and supplied Vietnamese context/start expressions. Distinct source-given direction viewpoints are explicit where 来/去 is tested. The 20 homework choice answers have varied, noncyclic positions: lesson 5 A/B/C = 7/6/7; lesson 6 = 6/7/7. Distractors contrast direction, roles, action, place, polarity, or taught grammatical forms. One duplicate distractor caught during lesson 6's initial validator run was replaced before the clean pass.

All 10 manual writing payloads contain only id, part, prompt, focus and source. Chinese prompt is a neutral instruction; focus is the neutral Vietnamese label Dịch viết tổng hợp. No target Chinese chunks, options, answer, model, tokens, explanation or solution are embedded in these items or this audit.

The four independent listening questions in each lesson address points distinct from its five homework listening questions. All 18 audio questions refer to the original odd tracks and are supported by the corresponding printed speech. Numeric-time question lesson 5 listen01 asks the exact time mentioned, avoiding ambiguous threshold semantics.

### Audio evidence and limitations

Tracks 5-1 through 5-8 and 6-1 through 6-8: 16/16 local files independently SHA256-match the ingestion manifest; 16/16 pass complete ffmpeg decode. All odd/even mappings were checked against printed labels. Even tracks remain full original vocabulary lists, including repeated use of a list for separate POS senses; no isolated-word segmentation or synthetic voice is asserted.

All 16 automated faster-whisper-small-int8 transcript outputs were read and compared with the corresponding printed texts/lists. They support the original track identity and task semantics. Expected ASR differences include 佳玥/医学姐/依妃 for source character names, 望 for 忘, 的 for 地, traditional script, missed 儿, and 叔叔夫夫 for 舒舒服服. These were not copied into lesson Chinese or pinyin. Automated recognition, file integrity, and text-grounded semantic checking are not equivalent to a full human/native listening review; no such certification is claimed.

### Validation and scope

- HSK_PILOT=1 node tools/validate-content.mjs: zero issues after lesson 5 and after corrected lesson 6; current validator includes 5-token ordering minimum, no Chinese writing-focus hints and corpus-wide duplicate task-signature checks
- Independent review of Chinese, Vietnamese, pinyin, source fidelity and pedagogy remains pending. A qualified teacher/native-speaker certification is not claimed
- Engine, UI, legacy HSK1, deployment and other lesson files are outside this worker's write ownership
