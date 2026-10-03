# Independent HSK2 lessons 12–13 candidate and shared-feature review

2026-10-03 UTC. Independent completed-candidate review, after two reported defects were corrected by the integrator. Review writes are confined to this directory. No source lesson, public asset, shared implementation, workflow, commit, push, deployment or CI run was changed or started by this reviewer.

## Decision

**Accept the exact final drafts, original SVG pixels, source/data topology, deterministic renderer/storage behavior, and current native two-shard collection equivalence described below.** There are no remaining source/data/renderer/pixel blockers found in this scope.

**This is not browser or release acceptance.** Actual Chromium/WebKit CSS, viewport layout, focus, keyboard navigation, image-load/zoom behavior and media playback remain pending. Independent audio alignment and perceptual verification remain pending. No browser test was executed in this review; `--list` collection is explicitly not a browser pass. Earlier unsplit CI run 37112494707 was not rerun or changed.

### Bound candidate identities

- L12 SHA-256: `0f4263a7d3723cf4ed7167dbfc2d84fab122b6401788ccfcf5ee67576ddab9d2`
- L13 final SHA-256: `c804f2539059572ff6b73c44c5d7d43a1d6e718720d7bd9663df8ab1fcd71156`
- L13 initial `abbaff3f1380f753c951520949953e4cdf7b1faec848aeb1c4604e659db06fc1` was superseded only for the neutral new reference response described below; it is not the accepted final candidate
- Complete per-file hashes of all23 SVGs, shared code, tests, browser config and workflow: `reviewed-hashes.json`
- Final renderer `src/lesson-view.ts`: `46e3e0796a9c25fbb56c52bf3ad193f60a8a262cf035a3ec33c595516bb6c874`
- Types `src/types.ts`: `d3cd30acf2b5c7808ae916fb545142bc3a8ef10d1b979ea0025ba817981ef2fd`
- CSS: `8313927e74a9f8c651540e3d25396a42023213ccfdb416fc27e90c68051594b6`
- Activity validator: `0eeef7a6d8e3f00ed3a39b240de57eade51bbe6a3a1c841f1a73665285fe49d8`
- Workflow: `e0ed44ddbb30c5e2a5e01e2bdd175bee931dc5247d1563175e29c573b2d4478a`
- Shard guard: `251d50b1be8f548c728c0b8ca657bdd91baa0abafbcf07ff67aca8890ce1130e`

Acceptance does not silently transfer to subsequently changed bytes. The candidates remain draft-not-in-release; this review did not alter publication metadata or copy them to public assets.

## Independent source and bilingual-content work

Read the author report, validation, field/scene/appendix inventories, source evidence index and preauthor observations as context. Established the review oracle independently from the actual page pixels, original Git baseline and executed renderer rather than treating author checkmarks as acceptance.

Opened all19 textbook pages117–135, answer PDF pages15–18, and all6 appendix/POS/star pages156–161, individually as actual pixels. Independently verified the source PDF and raster hashes. `source-pixel-audit.json` records all29 pages and page-specific observations. Also opened textbook PDF100/P85 to check the separate L10 test correction.

Compared every original baseline nested key/value against `git show be88612:course-app/content/hsk2/lesson-12.json` and lesson13. Original arrays, IDs, Chinese, pinyin, Vietnamese, source metadata, dialogue lines, ellipsis, vocabulary, grammar explanations/examples/practice frames, questions/options/order, tips, source sections, classroom examples, homework and independent listening are unchanged. The author's frozen baselines independently match Git. All source dialogue Chinese/pinyin/Vietnamese, lexical quartets, grammar title/structure/explanation/examples and relevant section headings/blocks were also checked in actual `mountLesson` output.

Final counts, established against the page-by-page topology:

| Candidate | Activity groups | Original source responses | Optional objectives | Official | Reference | Open | Images |
|---|---:|---:|---:|---:|---:|---:|---:|
| L12 |29|78|3|19|22|37|12|
| L13 |27|48|3|21|26|1|11|
| Total |56|126|6|40|48|38|23|

The assessment columns count original source responses; the6 optional objective checkboxes are additional open fields. Every field is represented once in the rendered activity inventory. All48 reference answers have Chinese and Vietnamese and are explicitly nonunique, with no exact-string official answer or official provenance. The40 official values, original option positions and exact PDF key pages match the independently viewed answers.

### Important source-specific distinctions verified

- L12 survey has4 response columns 我/A/B/C,3 editable names inside A/B/C headers,3 question rows×4 answers and exactly15 controls. No invented name question row
- L12 review retains2 vocabulary reflections,9 original grammar/example rows×2 independent 理解/会用 checkboxes and1 effort response; no forced rating or correctness score
- L12 official matching CADB; listening BC/CC/AC/TT; text4 reading CA; word choices EDACB with Q1 answerPDF16 and Q2–5 answerPDF17
- L12 grammar has9 complete single-blank dialogue frames; pictures have1+2+2+2 blanks
- L12 weather is explicitly fixed textbook data: today19°C/thunderstorm and tomorrow26°C/sun. It is not a live forecast
- L13 matching EDBFCA; listening AB/CC/CC/TF; text4 reading CC; word choices CAEBD
- L13 warmup2 keeps3 open 上楼/楼上, 下楼/楼下, 上网/网上 explanations without inventing a source matrix
- L13 grammar has3+3+5 fields; final group preserves2+2+1 blanks. Picture tasks preserve1+1+2+1
- L13 coffee-cup guessing tip is an actual source question and has its own reference-only response
- L13 brother age difference 三岁 and other unquantified/person-specific examples are explicitly nonunique editorial examples
- L13 source text2 standalone `……` is unchanged. No spoken segment is invented here
- L13 text4 official 错误 remains intact despite the collective-classmates ambiguity; the complete existing bilingual warning is now available after feedback, as described below
- Original listening activities retain the correct odd-numbered tracks and listen-twice directions. No claim of acoustic accuracy or alignment is made
- All24 vocabulary rows retain their original learning-list Chinese, pinyin, POS and Vietnamese. Added metadata matches the printed source numbering/POS, appendix pages and lesson lists. 新年 alone is starred in this pair, on appendixPDF160/P145; star legendPDF156/P141. 花 retains8,13; 笔 retains10,13 and lesson POS `m.`; 站 retains12,14
- Neither lesson has a culture video. L12 has the review page; L13 has no review page

60 original homework records and8 independent listening records are deeply unchanged. Canonical hashes are in `data-checks.json` and equal the author validation hashes.

## Actual artwork pixel review

Independently rasterized all23 current SVGs with Inkscape at640×400, then opened all6 contact sheets at1280×852 with full cells. This was inspection of the actual rendered bytes, not acceptance from filenames or source code. Frozen SVGs, individual PNGs, contact sheets, asset hashes and individual observations are in `svg/`, `pixels/`, `independent-asset-inventory.json` and `independent-pixel-audit.json`.

Accepted as original auxiliary schematics, explicitly not textbook photos:

- L12:4 warmups, sofa-phone scene, two winter-capped/scarfed snow figures, outdoor jogging pair, separate closer text4 jogging frame fromPDF124, unequal-height boys, weather chart, boy ahead of girl running, raised-arm singer with microphone contact
- L13:6 warmups, solely the green/white checked panda notebook text3 photo interpretation, teacher writing on board, two boys holding toy airplanes, woman ahead of man swimming in the same indicated direction, family decorating for New Year
- No fabricated L13 text1/text2/text4 photographs
- Hand/object contacts, seats, decoration grip and swim direction are understandable at inspected pixel size. No numeric age difference or answer word is invented on the picture tasks
- SVG structure contains no embedded raster, script or foreignObject; source-scene ownership/manifest hashes and explicitly auxiliary draft status are checked

Actual loaded browser pixels, responsive cropping, zoom modal/focus and CSS are not certified by this vector raster review.

## Defects independently found and closed

### 1. New L13 reference introduced an inconsistent gender

The preserved question says Cô Vương, while the first added reference used 他 and Thầy. The source context names 王一飞 but its English translation also says Ms. Wang, so inferring a gender here is not justified. Reported promptly; the integrator changed only the new reference to:

- 王老师让同学们在本子上面写字。
- Giáo viên Vương bảo các bạn viết chữ vào vở.

The new L13 hash above was independently rerun through all data/renderer checks. No protected baseline string was rewritten. The source/baseline's pre-existing naming/gender context remains as printed rather than silently corrected.

### 2. Mapped activities swallowed the original flowers ambiguity warning

Independent execution of actual `mountLesson` found that `questions()` returned early for exact activities and omitted the original `question.editorialNote` entirely. Initial failure evidence is retained in `renderer-before-editorial-fix.json`.

The integrator's final fix resolves a field's `targetRef` (or the old fallback activity's target) to the original question and places its unchanged Chinese/Vietnamese editorial note and source page inside feedback after submission. Removed the old fallback's premature note to avoid answer leakage/duplication. The optional field-level targetRef is typed and the validator rejects references outside actual source questions.

Independently checked the actual L13 mapped and fallback flows and all4 existing HSK3 source editorial notes: none before submission or after empty submission; complete note once after wrong/correct or open response; correct source page; edit clears it; JSON restore/remount restores it; clearing/reset suppresses it. All196 existing integrated declared field question references remain valid. Negative tests reject foreign, missing, null, numeric, object, array and empty references.

## Renderer, state and regression evidence

`probe-renderer.mjs` is an independently authored executable probe. It imports the current real `mountLesson`, validator and storage implementation; it does not call or reuse the author's matrix-header test. Its recording DOM is intentionally not a browser.

**1956 checks,0 failures**, including:

- All56 activities,132 controls and23 image placements reachable exactly once
- Header/body separation and exact source ordering; null first header slot; names inside their own `<th scope=col>`; real table caption, row scopes, labels and named/focusable scroll region
- Exact3 header names and12 body responses; all names editable and independent; every candidate field independent under an individual change; missing names block a filled body-only submission
- Empty and one-blank/whitespace incomplete groups block; no premature official/reference answer disclosure
- All wrong official selections get retry, all official keys get correct feedback and exact answer-page provenance; references/open responses never receive correctness grades
- All-unchecked optional/self-review controls may save, without forced ratings
- Editing clears stale feedback/checked state; save/remount/JSON-state validation/reset preserve and clear all independent fields correctly
- Header validation rejects hidden headers, wrong length, duplicate IDs, body/header duplication, missing IDs, nontext/nonopen fields, nonsurvey use, undefined entries and nonarray values
- All12 earlier source matrices, including headerless/visible-label and context-column variants, retain their row/column semantics and JSON/remount behavior
- Actual `createLearningStore` with isolated in-memory StoragePort and lock adapter: all56 groups/132 values confirm saved, a fresh store reloads them, native backup roundtrip restores them, confirmed scoped reset clears them, unrelated HSK1/HSK3 sentinels remain unchanged

This last probe uses the production store implementation and a simulated StoragePort, not actual browser localStorage or Web Locks. Browser persistence/focus behavior is still a separate gate.

Final `npm run check` passes. Final `npm test` reports58 passed,0 failed,0 skipped. These unit passes do not count as real-browser acceptance.

## Two-shard workflow and L10 browser-assertion repair

Independently reviewed the additive workflow/guard changes against be88612. Independently collected native JSON lists for both engines/full/shard1/shard2/preflight, rather than using the author's list-regex parser as the oracle.

`check-shards.mjs`: **433 checks,0 failures**.

- Current collection is196 cases,98 per engine; both engines split50+48
- Exact native spec IDs and descriptive identities, timeouts, annotations and expected status retain the full union, with no duplicates/intersection
- Independent complete JSON identities equal the author's parser output; no dropped/unparsed current tests
- Browser config is unchanged: workers, retries, per-test timeout, projects and server policy
-4 preflight cases run once per engine on shard1; the collection guard runs once and itself checks both engines
- The full execution step adds only native `--shard=N/2`; no grep exclusions, removed tests, increased retry, continue-on-error or reduced assertion requirement
- All7 artifact categories have engine+shard-unique names; separate runner jobs isolate report paths. Both shards for each engine must be aggregated
- The workflow job timeout is unchanged

Current collection identity hashes:

- Chromium: `0f94aabab6c8ddfa9b9fcc4f44a54e35a8f722b0e5feaecc951d3216b58577fe`
- WebKit: `2dcf0a58a88913744e7c542fd6da1088123b0dbb678831dac5a12950160d9235`

Reviewed commit7e2b2fb's L10 assertion repair separately. It changes only one incorrect “empty culture/extension” assertion block into checks of the real 呢 tip's exact bilingual content, visible heading, page85 source and sourcePDF100 binding, while strengthening no-image to no-image/video. The actual sourcePDF100/P85 image confirms that tip. All196 current test identities are retained. This repairs an invalid test assumption without reducing coverage.

**The final expanded220-case batch has not been integrated or collected by this reviewer.** It supersedes the earlier plan for218 because of the added editorial-note browser scenario. Before release, prove all196 old identities are retained plus the expected24 new identities, then establish exact full220 union/disjointness and execute every case in both engines. The initial guard only established the current union. The integrator added the frozen196 identity baseline after this review raised historical retention. The updated exact guard now rejects a removed or renamed historical test, even if current shards otherwise retain a perfect union. Independently matched the frozen file to the complete native JSON collections and ran13 controlled-VM mutation probes against the actual guard body:0 failures. Corrupt baseline count/digest/missing engine are rejected; synthetic196+24 additions are reported correctly. This synthetic fixture does not claim actual future220 collection. Baseline SHA-256: `1f92b77a10d3936b70fc492a00ce4aca7fb101c0b14da3150e94cc80845ded8d`. Collection results have empty execution results and are not reported as passes.

## Evidence and reproduction

From repository root:

1. `python course-app/docs/independent-hsk2-lessons-12-13-review/candidate-review/check-data.py`
2. `node --experimental-strip-types course-app/docs/independent-hsk2-lessons-12-13-review/candidate-review/probe-renderer.mjs`
3. `node course-app/docs/independent-hsk2-lessons-12-13-review/candidate-review/check-shards.mjs`
4. `node course-app/docs/independent-hsk2-lessons-12-13-review/candidate-review/probe-historical-guard.mjs`
5. From `course-app`: `npm run check` and `npm test`

Primary evidence: `data-checks.json` (6674 checks), `renderer-results.json` (1956 checks), `independent-shard-equivalence.json` (433 checks), `historical-guard-probes.json` (13 checks), source/pixel audit files, exact snapshots and `reviewed-hashes.json`. Logs: `data.log`, `renderer.log`, `shards.log`, `typecheck.log`, `unit-tests.log`.

Remaining gates: final-copy/integration byte verification and publication contract; actual all-engine/all-shard expanded browser results and responsive/focus/media evidence; independently verified original audio. No release/deployment approval is inferred from this review.
