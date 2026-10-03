# Independent acceptance: HSK3 lessons 6–7

2026-10-03 UTC. Independent source, candidate data, original artwork, actual renderer/state adapter, shared-code and browser-test-code review. **Accepted for integration**, including the exact paired canonical correction below. Integrated Chromium/WebKit execution, native-device storage/media, audio-perceptual acceptance and publication remain separate gates. No canonical/runtime/shared source or GitHub writes were made by this reviewer.

## Frozen candidates and decision

- Lesson 6 SHA-256: `a857a37d8249987b955368cf3514237fd5a21bf9f7d180d49b14a53fa73c2c7e`
- Lesson 7 SHA-256: `9ee4f0c179c88e19c5d87f63d53f8e0bb6e6aa4247c5b9a12f0b70d1794c2917`
- Both match the submitted freeze. Every author manifest file hash was independently checked, without treating author status labels as acceptance
- Original lesson values are deeply preserved against Git `259f672`. There are 58 source activities, 148 source response fields plus eight optional objective checks: 48 official, 67 nonunique reference and 33 open responses
- Lesson 6 has 29 activities, 85 source plus four optional fields, 24/31/30 source assessment modes, 13 original figures and 31 stable vocabulary sense rows
- Lesson 7 has 29 activities, 63 source plus four optional fields, 24/36/3 source assessment modes, 19 original figures and 30 stable vocabulary sense rows
- All 60 original homework items, including ten manual-writing items, and eight independent-listening records survive unchanged

## Actual source and artwork inspection

All textbook PDF pages 59–78, answer PDF pages 8–10 and appendix PDF pages 186–194 were opened as actual pixels. The two original PDFs were independently byte-hashed. Fresh renders from the originals are pixel-identical to all 32 inspected source rasters. No extracted text or author claim substituted for these visual readings. `independent-source-pixel-review.json` records the page-level observations and evidence identities.

All 32 exact original SVGs were independently rasterized at 640×400 with CairoSVG and opened across eight four-cell contact sheets. The scenes match their source task roles, with legible banana 1KG and original 5 JIAO coin cues; three distinct L7 grammar pictures; two separate L7 group pictures; no invented L6 text3 picture. Content has no material clipping or illegibility at the inspected size. SVGs have no source-photo embeds, scripts, external resources, copied issuer artwork or video controls. `independent-artwork-pixel-review.json` records each observation and original/raster hashes.

The visuals are original auxiliary schematics, not replicas of textbook photographs. Their descriptions provide meaningful accessible equivalents. The renderer's image alt remains accessible immediately, including visible object names. Explicit optional picture-hint paragraphs and zoom-dialog descriptions require opening. We do **not** claim every answer-bearing word is hidden from assistive technology. No alt contained an official letter key or an extra invisible answer mapping.

## Source-specific acceptance

- L6's ten review rows retain the printed labels/examples and 20 independent 理解/会用 checkboxes. Two vocabulary textareas source PDF67 and the separate effort textarea PDF68 remain distinct, for 23 review fields
- All five L6 travel-group topics remain independent, including compound questions, the 怎么办 gloss and full four-person instruction. Travel/security references are framed as textbook language practice rather than present-day procedural advice
- L6's 4+3+3 picture blanks and L7's 4+4+4 picture blanks are independent reference responses. L7 retains two separate slots around 着, watermelon pricing frames, and distinct speech/power-on/极了 slots
- All 40 original text questions are linked exactly once; per-question source pages preserve listening/reading splits. L6 word-choice source boundary 65/66 differs from answer boundary 8/9; L7 text2 official answers split across answer pages 9/10. These were independently checked rather than inferred from activity-level provenance
- L7 warmup remains six typed measure-word fields with official 个/斤/辆/条/毛/条, source number frames and 1KG/5角-equivalent visual cues
- L7 grammar1 pictures bind directly to their three respective fields. Grammar4 retains actual same-subject indices [0,1] and different-subject index [2], every original example once in order
- L7 grammar2 includes the literal printed 不比 explanation, including A和B差不多, with bilingual rendering and PDF73/P61 source. The original editorial summary, supplemental caution and every original example remain unchanged
- All source tips remain: L6 上 in 坐上; L7 还/更, 买二送一 with both variants, and 不甜不要钱. Supplemental unit-conversion and 不比 cautions remain marked supplemental
- Culture video6-1 and video7-1 are explicitly unavailable. Their matching dialogue-track numbers are not substituted as videos. Neither culture page gains a video/audio element
- All 61 vocabulary senses retain original IDs, meanings, pronunciation, source/audio links and POS distinctions. Actual printed ordinals, POS, stars, appendix pages and lesson references were independently checked. 常用 has no printed POS; 北京南站 is proper noun1 rather than new word27. 充电宝 and both 冰 senses are starred. Shared printed entries do not merge stable sense rows

## Exact canonical correction approved

Actual PDF73/P61 prints `天中学中文的时间长`, without 更. Approve only these paired changes in L7 `grammar[1].practice[0]`:

1. Chinese: `时间更长` → `时间长`
2. Vietnamese: first `lâu hơn` → `lâu`; retain the later `cao hơn Gia Nguyệt`

The submitted proposal's old values match the Git baseline, and its replacements perform exactly these deletions. The additive activity already uses the correct source frame. `baseline-correction-review.json` records independent approval. This reviewer did not edit canonical content.

## Found and resolved shared renderer issue

The initial renderer showed L7's unmapped supplemental `连动句练习：图片提示` paragraph expanded in the practice tab because its exercises bind to grammar1, not the hint-only section. Main corrected the shared renderer to identify only practice-tab paragraph blocks with supplemental provenance and 图片描述/图片说明 prefixes, then append the same collapsed hint control after either mapped or unmapped content. Textbook paragraphs, ordinary caution/safety text and instructions remain visible.

The final implementation was re-reviewed and independently tested. L7 now has three correctly scoped, collapsed, complete bilingual hint groups with no duplicate paragraphs. Relevant hints follow their own picture-dialogue/group activities. The permanent regression covers unmapped practice/activity sections and excludes real textbook, safety and instruction blocks from hiding.

## Executed verification

- `check-data.py`: **9,317 checks, zero failures**. Pixel-derived source contracts and Git-preservation comparison, not a rerun of author validation
- `probe-renderer.mjs`: **2,040 checks, zero failures**. Actual `mountLesson`, every156 field, every58 activity and every32 figure exactly once; bilingual content, input types/labels, incomplete submissions, official correct/wrong feedback, nonunique references, open responses, independent edits, completion invalidation, remount, export/import and scoped reset
- Production `createLearningStore` exercised through isolated in-memory StoragePort: all58 activity records and156 values survive exact save/reload. Cross-course sentinels remain unchanged. This is not browser localStorage certification
- `probe-source-explanation.mjs`: **52 checks, 35 adversarial variants, zero failures**. 31 malformed structural/group variants rejected with diagnostics, plus four structurally plausible but source-wrong variants rejected by the exact source contract
- `probe-corruptions.mjs`: **44 source/data corruptions rejected**. Includes row flattening, page shifts, incorrect official keys, lost topic compounds, wrong typed units, omitted/reused pictures, merged 着 blanks, lost tips/cautions, sense/star/POS changes and original homework/listening mutations. Structural validation alone rejects only three of these; semantic source acceptance is a separate requirement
- Existing select-based rapid edit/save race and new L7 typed-answer race: **12 checks each, zero failures**. Earlier/later reversed callbacks, repeated submissions, incomplete newer submissions, disposal, quota failure and external state replacement are covered
- Typecheck and strict browser-fixture typecheck: **passed**
- Shared unit tests: **73 passed, zero failed**
- Browser-spec code review: final `hsk3-lessons67.spec.ts` reviewed and snapshotted. Its culture availability predicate now selects exact source-specific bilingual wording; L7 text2 explicitly verifies both answer pages9/10. Shared readiness first establishes exact source inventories, then controls; saved submissions verify actual storage receipts before reload
- Playwright collection only: **28 new tests,14 per engine**. Full collection is320,160 per engine; two-shard unions are exact and disjoint, and every previously frozen292 test identity remains present. Collection/typecheck are not execution results

357 deployed audio files remain byte-identical to their protected Git/original-manifest authorities: 264 HSK2/3 manifest identities and93 HSK1 Git blobs/public copies. This does **not** mean the93 HSK1 files are byte-identical to the newly recovered RAR; main separately reports container/cover/tag differences and matching compressed audio streams, with decode/timing investigation pending. Protected HSK4/HSK4up tracked content has no diff from437b658.

## Additional six-PDF registration / release gate review

`check-source-registration.py`: **393 checks, zero failures**. The actual six PDF hashes, byte sizes and page counts agree with the inventory: HSK2 162+21, HSK3 212+27, HSK1 144+13 =579 pages. All original422 page identities remain and157 HSK1 records are added, with exact gapless ranges and shard hashes.

HSK1 records do not claim content acceptance. Only textbook PDF1/3 have cover/copyright identity-only status; all other visual/semantic status remains pending, every independent review remains pending, and UI acceptance is explicitly unestablished. The new metadata shards contain no original PDF text, payload or private Library transfer data. No HSK1 body-text review was performed here. Main later added use-instruction metadata from PDF7; the final inventory snapshot includes it, but this auxiliary review does not independently certify those curricular claims.

The entire `package-unified.mjs` change is exactly `gate.pages!==422` → `gate.pages!==579`. Source-commit matching,48 lessons,33 new-edition lessons, all16 passed stages, both required browser flags, dirty-runtime guard and exclusion of source PDFs/archives are unchanged. This strengthens the source-page requirement and does not lower release gates.

## Scope and reproducibility

Review evidence, scripts, logs, pixel inventories, final reviewed source/spec snapshots and SHA-256 identities are under this `candidate-review` directory. Final input identities are in `final-reviewed-input-hashes.json`. The source/candidate acceptance above authorizes integration review; it does not certify unexecuted integrated browser/native-device/media behavior, human listening, tone, sentence timing, full-book coverage or release readiness. No source PDFs/scans should enter public build assets.

## Optional navigation refinement

The preserved L7 hint-only paragraph says to complete “the three sentences above,” while its three fields correctly live in the grammar tab. This is a minor navigation opportunity, not a data or acceptance blocker: retain the literal paragraph and three existing field locations. If refined later, add an explicit validated relationship from section1 to the existing grammar1 ID and render one corresponding grammar-tab link alongside the optional hint. Do not infer relationships from same-page numbers or title text, and do not duplicate or move activity records.
