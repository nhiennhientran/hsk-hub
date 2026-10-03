# Independent HSK2 lessons 14–15 and appendix review

2026-10-03 UTC. **Accepted for controlled integration after the two L15 corrections below. This is not browser, audio, deployment, or production acceptance.** No source/public/shared implementation was edited by this reviewer. Evidence writes are confined to this candidate-review directory.

## Bound inputs

The complete immutable file bindings, including all 26 SVG assets and the actual renderer/state code, are in `final-accepted-input-hashes.json`.

- L14 draft SHA256: `f708e8654c61d3efffec0707efd1d09a2325a567482a76f32b6401b5318ca6b6`
- Accepted L15 draft SHA256: `f5691ff5c92f22ff915ee2d55e538523122a6b9cd9d2055a86798fe6d9f5f65c`
- Superseded L15 SHA256: `4099211d71ac80206702add563677e6e87b7ec95f413093f06a9518862a85667`
- Blank-corner validator SHA256: `c5959179fe9641ce5fc52786b1a91ca57d4347cacea8a995eb227ea87e05b1a5`
- Activities unit tests SHA256: `4294e7855e2e3b21b20c6c3bfdfdcff8bec377a48ceca14631191b68be442a70`
- Rapid-save browser test SHA256: `d49b27e355655ee619ae7d8263bfe54ba25281c54b0aa27b41fbc1703a68de2c`
- Reviewed 148-row metadata proposal SHA256: `f4d7866b9a3a1cdedb5f9c2f2cf2d9de706ebe69da883ae2b394c0fe48b10c3c`
- Reviewed author full-appendix inventory SHA256: `df5c2b3bf9c6371610b60f052599744298816162e6a8c6baa175c8c63865f7f9`
- Independent per-row metadata approval SHA256: `f94cee5f963f64e26f92efb15173b828f79a500dae9166c2248bdd9e193fe27a`

## Findings fixed and rechecked

1. L15 picture-dialogue3 originally reversed the Vietnamese visual order of its two blanks without identifying them. Chinese source order is airport, road; natural Vietnamese order is road, airport. The new activity title now marks Vietnamese `[ô 2]` and `[ô 1]`. Its source Chinese, baseline section, field IDs and reference answers remain unchanged.
2. L15 culture illustration had renderer owner `l15:section4`; the actual renderer matches `l15:culture`, so it was absent. The corrected renderer owner is `hsk2-fltrp-2026:l15:culture`, while sourceOwner remains `hsk2-fltrp-2026:l15:section4` with PDF154/P139. No SVG bytes changed. The actual mountLesson rerun now places every image exactly once.

`renderer-before-corrections.json` records the real missing-image failure; `integrator-corrections.json`, final candidate snapshots and `renderer-results.json` bind the repair. No remaining source/data/static-pixel/renderer-semantic blocker was found in these accepted inputs.

## Independent source and content work

Opened all 20 textbook pages PDF136–155, all four relevant answer pages PDF18–21, all six appendix pages PDF156–161, and all 52 earlier vocabulary-box pages as actual pixels. Fresh renders were produced directly from the original PDFs. The first 24 opened page rasters were additionally proved byte-identical to fresh original-PDF renders (`source-page-byte-proof.json`, 24/24). Original PDF hashes and all 82 fresh renders are in `independent-source-renders.json`.

Verified totals:

- L14: 26 activities; 43 source responses and 3 optional objective checks; 19 official answers; 23 bilingual nonunique references; 1 other source-open response; 15 SVGs
- L15: 29 activities; 64 source responses and 3 optional checks; 19 official answers; 20 bilingual nonunique references; 25 other source-open responses; 11 SVGs
- Combined: 55 activities, 107 source responses plus 6 optional checks, 38 official answers, 43 nonunique references, 26 other source-open responses and 26 SVGs

The original nested baseline text, pinyin, Vietnamese, IDs, options, frames, explanations, examples, editorial caveats, sources and audio pointers are preserved exactly. Both author frozen baselines equal repository content at af491bc. All 60 homework questions and 8 independent listening records remain exact; their canonical hashes are in `data-results.json`. This is preservation of the established transcription, not a claim that contextual pinyin should be globally normalized to dictionary forms.

Every official key was read in the answer PDF: L14 CDBA / CA / AB / AB / FF / BB / EBCDA; L15 BADC / BA / AC / CC / FF / AB / DCAEB. L14 word-choice Q5 retains source PDF144 while Q1–4 retain143. L15 word-choice Q1 cites answer20 and Q2–5 cite21. Reference expressions are semantically suitable and bilingual; grammar quantities and football frequency remain nonunique, never official-marked.

L14 grammar3 retains both explanatory groups and all six examples. L15 frequency table keeps the genuinely blank corner, 时间/次数, fixed 一个星期/一个月/一年, the original three activity rows, and only three count inputs with 次/lần. L15 review has exactly 21 fields: two vocabulary fields, 18 independent grammar checks, one effort field. The first four grammar rows retain154, the remaining five retain155. The textbook culture topic and unavailable-video disclosure are unchanged; no current visa advice or reconstructed video was added. Ellipsis-only and ellipsis-prefixed dialogue text is preserved.

## Entire appendix and approved earlier metadata

All 210 printed entries (207 ordinary entries and 3 proper names) reconcile to all 226 stable lesson sense rows. All 10 stars agree. Four multi-lesson entries preserve both bindings: 笔10/13, 还是2/10, 花8/13 and 站12/14. 过 guo/lesson4 and guò/lesson6 remain separate. The appendix does not print per-word POS or vocabulary ordinals; no such information was inferred from it.

Independently transcribed and checked all 214 lexical appearances against the 60 lesson vocabulary boxes, including the 52 earlier pages. Their page-level number/POS transcription is embedded in `check-data.py` and recorded in `data-results.json`. All 148 proposed additions for lessons1–9 are approved as metadata-only additions; `approved-earlier-metadata.json` binds each exact proposal row by canonical hash and identifies both source pages. Existing Chinese, Vietnamese, editorial classification, IDs and audio must remain unchanged.

Important distinctions verified:

- 包 remains three stable sense rows under printed number2 n./v./m.
- 北京烤鸭、北京大学、颐和园 are separate proper-name lists with their own number1 and no printed POS; 颐和园 keeps track15-4
- 不好意思、为什么、有意思、没意思 have no printed POS. Editorial learning classifications remain distinct
- Lesson5 下面/面 share the source number5 grouping with its explanatory numbering note; lesson8 左边/左 share2 and右边/右 share4
- Lesson10 笔 is n. while lesson13 笔 is m.; other multi-lesson classifications also retain their source distinctions

**Approved exact content correction:** `course-app/content/hsk2/lesson-09.json`, vocabulary ID `hsk2-fltrp-2026:l09:word02`, field `py`, `pángbian` → `pángbiān`. Both vocabulary PDF89/P74 and appendix PDF159/P144 visibly print pángbiān. The dialogue on PDF89 prints Pángbian: do not blanket-replace contextual dialogue pinyin. No other vocabulary/appendix pinyin discrepancy was found after normalization of case, spacing and apostrophes.

## SVG pixels

All 26 exact SVGs were independently rendered and opened at 640×400 in seven contact sheets, then compared with the source scenes. `independent-pixel-review.json` records each asset hash, raster hash and observation. The scenes are recognizable source-related original schematics. No embedded source images, scripts, external links, official logos, answer-key text or unsupported frequency facts were found. This verifies static artwork pixels and semantics, not browser scaling, loading, modal focus, or CSS.

## Actual renderer/state and shared validator

`probe-renderer.mjs` executes actual mountLesson and actual createLearningStore with a deterministic recording DOM and an isolated StoragePort/lock adapter. The corrected rerun passes **1,972 checks**, including:

- All 55 activities and 113 fields render exactly once with associated labels; all 26 illustrations are placed exactly once
- A real table/caption, column/row scopes, blank corner, fixed cells, units and exactly three frequency inputs
- The 18 review checkboxes remain independent; row1–4 notes visibly cite P139 and row5–9 cite P140
- Official correct/incorrect feedback; complete bilingual nonunique feedback; no grading for references/open tasks; incomplete submissions blocked
- Delayed picture hints, clear stale completion/feedback on every field edit, all-unchecked self-review allowed
- Exact field values persist through actual store save, fresh-store reload, export/import and confirmed scoped reset; unrelated course storage remains unchanged
- All 15 earlier HSK2 matrices retain semantic structure and independent values under the unchanged renderer

The validator’s narrow change accepts only omitted/default headings, normal valid bilingual headings or the explicit `{zh:'',vi:''}` pair. One-sided emptiness, missing languages, invalid types, null and whitespace-only values are rejected. Other matrix labels/columns/rows remain nonempty. No renderer implementation change is required for the blank corner. Independent current unit run: **60/60 passed**. Typecheck: **passed**. `check-data.py`: **8,152 checks, zero failures**.

Source-note repetition is safe but verbose. Optional later improvement: where a matrix row’s effective field sources are identical, put one sourceNote in its row th; retain cell notes for differing/missing source combinations. Preserve all stored field.source values and both checkbox bindings. No provenance was removed in this review.

## Rapid-save refinement against af491bc

Reviewed local40e4858’s test-only diff. The root click handler synchronously invokes flush/store.save, which publishes saving and clears the old quota issue before awaiting the Web Lock. Therefore the post-click wait for unsaved + data-problem + the explicit quota message observes failure of the attempted navigation save rather than relying on an old error. The additional active-HSK2, retained input, old durable value and beforeunload guard checks strengthen the intended failure contract. The storage fault is removed only after those conditions, followed by an explicit retry and a durable-read assertion before reload. No sleep, artificial success, relaxed value assertion, removed path or application-state workaround was added.

All 14 declarations in the changed file are identical to af491bc, and the full diff changes only the helper’s four scenario lines. Current native Playwright collection contains exactly220 identities,110 per engine. `rapid-save-identity-review.json`, `rapid-save-af491bc-diff.patch` and `browser-identities.json` record this. **Collection and code reasoning are not a browser pass.** The prior Chromium stage outcomes were supplied by main; this reviewer did not monitor CI or rerun the browser suite.

## Remaining gates

Main must obtain actual full Chromium/WebKit execution for the final integrated checkpoint, including blank-corner responsive CSS, keyboard/focus/modal behavior, reload/reset/localStorage, cross-page source display and rapid-save quota recovery. Deterministic DOM checks cannot establish those behaviors. Audio alignment, actual listening and media timing, release integration and production deployment are separate gates. No browser/audio/production acceptance is granted here.
