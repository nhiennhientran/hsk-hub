# HSK3 lessons 14–15 additive author review

Date: 2026-10-04. Base: d5feac8a01ec7095573da8dd9c4205c23bc7ed2b. Worktree: the isolated author checkout. No commit, publication, renderer/schema/test edit, or main-worktree mutation.

## Source and reuse

Personally rendered and pixel-inspected all textbook PDF pages 136–155 (printed 124–143), and answer PDF pages 19–22, from the supplied two PDFs. Source identities and exact SHA256 hashes are in author-validation.json. Source renders remain outside publishable content in a private source-review workspace. Existing lesson JSON and the earlier lesson14/15 independent corpus audits were reused; no OCR or corpus rewrite. Accepted L10–11 and L12–13 patterns were read only.

Lesson14 has three grammar points, six warmup pictures, four text scene aids, three picture dialogues, and an unlucky-day activity with two fixed examples and four blank rows. It has no culture or three-lesson review. Lesson15 has four grammar points, six warmup pictures, four text scene aids, three picture dialogues, four city prompts, an unavailable river-video topic, and a ten-row L13–15 grammar review. Actual page-specific tasks, rather than fixed batch counts, drive the additions.

## Added content

- L14: 26 activities, 63 fields (24 official, 30 editorial reference, nine open), three full grammar explanations, 13 original figures.
- L15: 32 activities, 86 fields (23 official, 33 reference, 30 open), four full grammar explanations, 18 original figures.
- Every original key and value is preserved, including all text, pinyin, translations, IDs, 30 homework and four separate supplemental listening questions per lesson. Validation compares all 16 baseline top-level values recursively, not a sampled subset.
- All 21 grammar completion prompts, 20 official word-bank blanks, six multi-blank picture dialogues, and 24 reading responses are covered. Forty-seven completed bilingual sentence records were generated and read as whole sentences; Vietnamese slots are editorially repositioned where necessary. Original baseline strings remain untouched.
- Editorial references explicitly allow multiple valid answers and never carry answer/answerSource. The official/reference ledgers are separate. No personal information is required; fictional examples are allowed.
- L15 text2 listening Q2: the official key is A on answer PDF21, but the source statement “两千年以上” also satisfies B “一千年以上.” The original source question and key remain untouched. The added field is select/reference, with no automatic key or official scoring provenance, and explains the precise ambiguity after submission. The answer PDF citation is retained in its reference explanation and the audit ledger.
- L15 grammar2 explanation runs from PDF148 to149. It is one continuous source explanation, not two pedagogical groups. The complete text is stored in grammarSourceExplanations and both source pages are recorded in the map. No artificial grammarPresentations split is introduced; the current presentation contract requires genuine nonempty example groups.
- L14 classroom retains the two given examples in the activity note and offers only rows3–6. L15 city activity retains the four city names and one choice/reason response, without a pretend-optional free-text field. The source research/discussion instruction remains visible.
- The unavailable video15-1 remains unavailable; the new river schematic is explicitly not a frame or substitute for the source video. All ten review grammar rows retain independent understand/use checks, vocabulary responses, and an improvement response.

## Artwork QA

31 new original 640×400 SVG schematics, no embedded scans, external links, fonts, scripts, raster source pixels, logos, or video controls. All were rendered using Inkscape and personally pixel-inspected in eight full-resolution sheets. Repaired duplicate arms in the singing/reaching/dancing scenes, lowered a floating newspaper heading, resized the elder-scene bench, and moved flowers to the bank; re-rendered all figures and reopened the four affected sheets. Manifest sources identify the actual pictured page, including L15 text3 river photograph on PDF149 rather than its dialogue page150. Rights approval does not claim independent content acceptance.

## Gates

- Whole baseline preservation, source field/question mapping, source-range/printed-page checks, exact official keys/pages, input/blank counts, unique IDs, safe SVG XML, asset hashes: PASS (validate.py).
- Activity schema and two existing source sentinels: PASS; zero issues (schema-source-guards.json).
- Full content checker: PASS (content-check.log).
- Typecheck using a local audit-only config resolving the already installed main-repo dependencies: PASS (typecheck.log). No dependency changes.
- Existing course unit suite: 81/82 pass. The sole failure is the unchanged aggregate image count in tests/activities.test.mjs: actual351, expected320. All per-file image/hash/safety checks complete before this stale total. No test edits.
- Independent source/Vietnamese/SVG review: PENDING.
- Browser/UI persistence, responsive rendering and final integration/build verification: PENDING; no completion claim.

Frozen paths and SHA256 values are in frozen-hashes.json. Audit output and figures are scoped to this lesson pair. Main repository remains untouched.

## Independent-review repair pass (2026-10-04 04:20 UTC)

All five requested categories were repaired, with six SVG byte changes:
- Beijing city and tourist scenes: every wall and door now reaches y328 ground plane; the former 50px sky gap is eliminated.
- Elder warmup: redraw as three people standing on an explicit ground plane in front of a smaller bench. All feet/shadows/cane meet ground; bench feet end within the canvas. Chinese and Vietnamese descriptions explicitly say standing.
- Nanjing city and text2: a continuous tapered tower body visibly supports all roof/story tiers and reaches ground.
- Chess: rebuilt seated, profile-view opponents on the left/right sides of a central board, each with a visible chair and grounded feet; table has continuous support. Both languages describe the new actual facing relation.
- Added L14 text2-listening option 找李文借书 now says “Mượn sách của Lý Văn”. Original baseline content remains unchanged.

Re-rendered all31 SVGs; personally reopened all six repaired assets individually at native640×400 after rendering completed (text2 was reopened after an in-progress image read). All baseline/source/schema checks, content checker and typecheck pass. Unit suite remains81/82 with only stale351-vs320 count. Independent status remains pending for the repaired bytes. Full source reinspection and browser verification were not repeated or claimed. See repair-changes.json for original/corrected frozen byte hashes and exact scope.
