# Independent acceptance: HSK3 lessons 4–5 and readiness protocol

Date: 2026-10-03. Decision: accepted for the reviewed source/data, original artwork, deterministic renderer/state and test-protocol scope. Not a production-release, native-browser, human-listening or tone-accuracy certificate. The final additional L4–5 browser candidate has a separate source/readiness code-review record.

## Exact candidate scope

- Lesson4: `b5be60bfdbbc74e263c1a83e82948939e10960abdf8c360edbe8af5c590b2047`
- Lesson5: `570c9045311fc9ca323f0ee6f307fbbeb148d95810a244b5a6326026cb16071d`
- Author manifest: `e10134cd9dc56d5a44293f8ed9883332f6055c8eea710f1c4b4a1dba51d560f4`
- Final renderer: `efb15e86c16eb2374656f42ec0ae0a48936c6341666f3b414ebe4b134d9d53b1`
- Readiness helper: `9613d8476d44d306cd55c3928f7233f45d1165c35b7671aea77847e391f03821`
- Existing HSK3 browser specification: `01f673ddd0a3ae4473b56a5c415a9b1f1e71ba495bd6de2361fcccb15da6db3a`

`final-reviewed-hashes.json` binds all candidate/shared code, tests and28 original SVGs. Evidence writes are confined to this candidate-review folder; this reviewer did not write runtime content, shared implementation, original SVGs, student data, remote state or publication settings.

## Fresh source and artwork inspection

Opened actual pixels of textbook PDF41–58, answer PDF5–7 and appendix PDF186–194:30 pages. Independently re-rendered the exact original PDFs and established pixel-for-pixel equality with all30 viewed source rasters. Both complete original PDFs were hash checked. This establishes the inspected pages came from the originals, rather than merely trusting a transcription or previous review. Source PDFs, answer books and rasters are private evidence and must not enter runtime/public assets.

Independently rendered all28 original SVGs at640×400 and opened every cell in seven1280×860 sheets. No missing source scene, clipped essential object, copied raster, script, external image embed or invented L4 text3 picture was found. Source relationships and each individual pixel observation are recorded in `independent-source-pixel-review.json` and `independent-artwork-pixel-review.json`.

## Source/content findings

- L4:26 activities,59 source fields plus3 optional objective checks;24 official,32 reference,3 open;12 figures. Three picture dialogues retain3+4+4 independent blanks. Text2 question/dialogue pages and text3 answerPDF5/6 split remain exact. Full travel-plan/reasons/representative/two-vote instructions remain, with one open response and no forced private information
- L5:29 activities,69 source fields plus3 optional checks;24 official,35 reference,10 open;16 figures. Four grammar groups retain13 fields, including two independent fields around 飞过来. Three picture dialogues retain3+3+4 blanks. Three separate text2 portraits bind PDF52 and original source order. The pair table retains4×2 editable response cells, first-row positive and negative printed templates, ellipses and 最近 gloss. The 又 recurring-situation tip and unavailable culture-video5-1 state remain; dialogue5-1 is not substituted
- All48 official keys,134 field IDs/types/source-page links,40 text-question bindings and67 bilingual nonunique references were checked. Reference answers are plausible contextual examples and do not acquire official answers/automatic correctness grading. L5 text4's invitation-based inference is explicitly identified as an inference
- All eight vocabulary boxes and nine appendix pages were visually read. Each lesson preserves27 numbered source entries as28 stable sense rows. 特别/比较 keep shared printed entry13 with distinct original sense IDs. 草原/主意/哈哈 retain literal appendix stars. 感兴趣/哈哈 retain no printed POS, while 会 remains the noun gathering/party. Every target appendix lesson-number list is exactly[4] or[5]; no claim is made about the whole course lacking multi-lesson entries
- Every original nested baseline field is preserved against protected Git437b658 and the author baseline: all original Chinese, pinyin, Vietnamese, IDs, text, grammar, explanations, examples, options, questions, audio pointers, provenance,60 homework records and8 independent-listening records. Each lesson still has25 automatic homework items and5 manual writing items. All357 original audio byte identities and protected HSK4/HSK4up trees match their protected sources

## Actual renderer/state checks

Executed actual `mountLesson` with a deterministic DOM adapter and actual production `createLearningStore` with isolated in-memory storage. This is semantic/state execution, not CSS layout or native-browser execution.

All134 fields and28 approved-in-memory figures mount exactly once in their source view; unapproved original assets remain gated. Every field retains a label, original input semantics, independent state, incomplete-submit protection, official-versus-reference behavior, edit-invalidated feedback, remount/reload restoration and reset/import/export behavior.55 complete activity records round-trip through production storage. Other-course sentinels remain unchanged.

Full original grammar summaries remain before additive source groups. L4 grammar1 has three explanation groups with6 original examples; grammar3 has two groups with4 examples. Chinese/pinyin/Vietnamese examples remain exactly once in original order. Practice follows its exact owning grammar section. Group explanations/titles and source notes are bilingual.

The review found L4 grammar2's originally invisible example-page distinction: explanation PDF44/P32 versus examples PDF45/P33. The final bounded renderer repair now retains the P32 explanation note and gives all3 differing-page examples their own bilingual P33 notes. Same-page examples avoid redundant notes; grouped examples compare against their adjacent group source. The reproduced initial failure is retained as `renderer-source-provenance-failure.json`; final tests pass.

Both 图片描述 and 图片说明 supplemental variants now retain full bilingual paragraphs after their related picture activities, collapsed by default; textbook-provenance paragraphs remain ordinary source text. L4/L5 each have one group of exactly two such paragraphs. The short `选 · Chọn` placeholder is bounded to source-menu selects; full labels/options remain unchanged. Existing menus, group galleries, row-source provenance and delayed-submit repair were independently regression tested.

## Systematic browser-readiness audit

The initial helper omitted requested scene identity and input type, and the width suite could enumerate activity/image lists before an exact per-view inventory gate. All were reported and repaired.

The final protocol verifies source title, selected level, section, active text-scene label plus exact scene href parameter, exact source-bound activity/figure identities/counts, image count and settled save state before caller enumeration. `activityReady` verifies the complete inventory, each exact ID, tag and input type, and the source-kind-specific submit button. Every current normal navigation, `.all()`/`evaluateAll()` use, normal submit, reload and incomplete-error path was audited.

Normal `submitSaved` rejects blank required values before click, then requires durable stored values and positive checkedAt plus feedback. Incomplete submission requires explicit Chinese and Vietnamese error text and zero correctness feedback.38 isolated protocol probes reject wrong/stale scenes, missing/extra/wrong activity and image identities, swapped input types/tags, wrong buttons, missing durable values, unchecked records, unsaved state, missing feedback and incomplete-feedback leakage. These dependency-injected probes exercise the exact helper logic; they do not certify Playwright's native wait/timing behavior.

The helper's source-view expectations independently match180 actually mounted views across all15 HSK2 lessons, HSK3 lessons1–3 and both accepted candidate drafts. Hanzi's lazy readiness is additionally handled by its explicit browser mode assertion; actual native hanzi rendering remains CI scope.

Collected all268 current native Playwright identities:134 per engine, each split86+48 with exact union and no overlap. They exactly match the pre-refactor268 list and retain all196/220/244 historical identities. No fixed waits, skips, fixmes or weakened meaningful assertions were introduced. Existing test-file assertion expressions changed from120 to116 because six occurrences moved into stronger helpers and two were added; every removed occurrence is mapped to its replacement in `assertion-preservation.json`. Normalized native held-Web-Lock protocol is identical except for readiness after its completed reload. No `submitSaved` or pre-save wait was inserted while the lock is held. HSK2 rapid refresh/switch/Back/Forward/beforeunload/quota/retry test files are unchanged.

## Executed evidence

- Independent source/data/preservation:8,548 checks,0 failures
- Current L4–5 renderer/state plus source-view inventory:1,886 checks,0 failures
- Prior L2–3 renderer/state/menu/gallery and full HSK2 placement regression:1,723 checks,0 failures
- Row-source provenance regression:156 checks,0 failures
- Deferred-save/state races:12 assertions across9 scenarios,0 failures
- Readiness adversarial protocol:38 checks,0 failures
- Negative corruption cases:40 rejected,24 by shared grammar schema and16 by reviewed exact source commitments
- Final shared unit suite:71 passed,0 failed/skipped
- App typecheck and focused strict helper/browser typecheck:passed
- Browser collection only:268 identities retained exactly; no browser launched

The first adapted harness wrongly assumed L4/L5 used the earlier 图片描述 wording. That probe assumption was corrected to the actual source-specific variants; it was not treated as a content loss. Its initial log is retained separately. No failures have been relabeled as native-browser passes.

## Remaining gates

1. Integrator must revalidate exact reviewed inputs after any integration, publication-status changes or later shared edits
2. Authorized GitHub CI must execute the final candidate commit in Chromium and WebKit, all existing cases plus the new L4–5 cases. Native320/390/768/1440 layout, horizontal scrolling/focus, image loading/zoom, hint visibility, reload/reset/quota/race behavior and screenshots remain required. An earlier green commit cannot certify these new bytes
3. Original-audio bytes/pointers were verified; human listening, tones, timestamps, segment alignment, native decoding and playback certification remain separate pending gates
4. Final private/public packaging and release authorization remain with the main integrator. No complete source PDF, full answer book, source raster or student record may be published
