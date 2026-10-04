# HSK3 lessons 16–18 additive author review

Date: 2026-10-04. Base commit: d5feac8a01ec7095573da8dd9c4205c23bc7ed2b. Isolated detached worktree: `[private review workspace]`.

## Evidence and source coverage

Personally rendered and read all 30 textbook pages, PDF156–185 / printed144–173, plus answer PDF22–27. The exact source-file sizes and SHA256 identities are in author-validation.json. Source page renders are outside the publication tree under `[private review workspace]`. Reused the preserved source corpus and read earlier independent lesson16/17/18 audits; independently checked the page pixels rather than treating earlier audit conclusions as new evidence. Read the content contract, existing schema and renderer, and accepted lesson14/15 authoring patterns. No OCR replacement of reviewed baseline content.

- L16: PDF156–165. One composite two-panda warmup, with five anatomical targets; four grammar points; three actual text photographs (text2 has no photograph); three picture dialogues; three concrete animal-discussion questions and a fourth ellipsis inviting an optional added question; a culture-video topic16-1 whose media remain unavailable.
- L17: PDF166–174. Six warmup pictures; four grammar points; four text photographs; three picture dialogues; one seven-expression classroom composite and three discussion questions. No culture-video panel or three-lesson review.
- L18: PDF175–185. Six warmup pictures; four grammar points; four text photographs; three picture dialogues; a traditional-festival group presentation; vocabulary review; twelve grammar rows with separate understanding/use checks; one improvement response. No culture-video panel.

The page-by-page maps include every page and each new activity's exact source and source-question binding. The two L18 刚才/刚刚 explanation groups genuinely occur in the source and retain the original example-index groups [0,1] and [2,3]. The first explanation is on PDF178; its examples and the second explanation are on179. L17 只有 explanation is on172 and its examples/practice continue on173; L18 只要 explanation is on180 with examples/practice on181.

## Candidate contents

| Lesson | Activities | Fields | Official | Reference | Open | Grammar explanations | Original SVGs |
|---|---:|---:|---:|---:|---:|---:|---:|
| 16 | 29 | 65 | 23 | 33 | 9 | 4 | 8 |
| 17 | 29 | 68 | 24 | 36 | 8 | 4 | 14 |
| 18 | 32 | 94 | 24 | 36 | 34 | 4 | 13 |
| Total | 90 | 227 | 71 | 105 | 51 | 12 | 35 |

All sixteen existing top-level values per lesson remain recursively identical to the specified base, including every existing ID, Chinese/Vietnamese/pinyin string, 30 homework questions and four independent supplemental listening questions. Only activities, complete grammarSourceExplanations and illustrationManifest are added; lesson18 additionally has the genuine two-group grammarPresentations entry. No vocabulary/lexicon identity changes.

The additions cover all24 printed listening questions,36 reading questions,36 grammar tasks (33 completions and three free responses),30 word-bank questions and nine picture dialogues with33 total blanks. There are72 completed bilingual sentence/dialogue ledger entries spanning96 filled slots, checked as complete Chinese and Vietnamese utterances. The36 reading references and three approximation responses are also independently readable in the reference ledger. Vietnamese slots are repositioned where Chinese word order would otherwise produce unnatural Vietnamese. Existing translations are preserved unchanged.

Every reference is expressly editorial and ungraded, without `answer` or `answerSource`. All source-open exercises allow fictional situations and avoid requiring true personal disclosures. The L18 approximation task's sample holiday answer is explicitly fictional/illustrative rather than a current national holiday claim.

## Answer evidence and ambiguity

All71 scored fields are keyed from personally read answer pixels, with source question/field/page bindings in the official-answer ledger:
- L16 warmup: E,D,A,B,C in the newly numbered positions, equivalent to the answer image's upper-left foot, upper-right ear, right face, lower mouth and lower-left eye. Answer PDF23. Listening BB/AC/CA/CC, PDF23; word banks B,A,C,E,D / E,B,A,D,C, PDF24.
- L17 warmup E,D,C,F,B,A on answer PDF24. Listening CB on24, BB/AC/CC on25; words A,B,E,C,D / C,A,E,D,B on25.
- L18 warmup C,B,D,A,F,E on26. Listening CC/CA/CB/CC on26. Words A,D,B on26 and C,E,D,C,E,B,A on27.

Answer PDF23 incorrectly labels the printed145 text1 questions as “课文4”; the source book page, track16-1 and the existing preserved correction note identify them correctly. This does not change their official BB key.

The three L18 刚才/刚刚 grammar fill-ins are not given official keys in the supplied answer PDF. They remain reference-only. In particular, the third sentence can allow 刚才 in a suitable context; its new activity note explicitly explains why there is no unique automatic key. No uncertain grammar answer was promoted to official scoring.

Zoo opening/closing times and Spring Festival holiday length are attributed to the textbook situation rather than presented as current visitor or legal guidance. The culture video16-1 remains unavailable; its original topic illustration is not represented as a video frame or playable substitute.

## Artwork and reachability

35 original640×400 SVG schematics. No scanned pixels, external URLs, embedded images, scripts, foreignObject, logos or video controls. Each has bilingual alt/description, explicit original-artwork labeling, source-page relationship and byte hash. Publication approval denotes rights for this original artwork; independent content/browser review remains pending.

Every figure is reachable through the current unmodified renderer: activity `illustrationIds` or field `illustrationId`, exact text owner, or the existing culture-owner convention. Each source map records the route. No section-owned-only orphan figures remain. The single L16 composite is displayed once above its five fields. The L17 emotion panel uses activity-level illustrationIds. Text illustrations use the actual image page, notably L17 text2 PDF168 and L18 text3 PDF179, rather than the dialogue's following page.

Rendered all35 figures in Inkscape and personally inspected all nine full-resolution sheets. Repaired disconnected panda bodies, body contrast/outlines, floating podium/TV support, hand-to-envelope contact, missing human necks, arm geometry, sofa and rear-facing TV viewers, lantern support strings and broom grip. Re-rendered and re-opened the final nine sheets, then the last two changed L18 warmup images individually. Buildings and doors meet their ground/shore line; all numbered anatomical labels and bilingual scene descriptions were checked against the final pixels. These are simplified original support drawings, not replacements purporting to reproduce every photographic detail.

## Verification and boundaries

- Whole-baseline preservation, official keys/pages, source-question mapping, source ranges and printed-page offsets, blank/field counts, complete review rows, unique IDs, safe SVG XML, renderer reachability and asset hashes: PASS (`validate.py`, `author-validation.json`, source maps).
- Unchanged full content/schema/source-sentinel/lexicon checker: PASS. A scoped runner uses the repository checker verbatim except for absolute import/root resolution and writing its report into this audit directory; the original checker and default report are untouched. See content-check-runner.mjs / content-check-report.json / content-check.log.
- TypeScript no-emit check: PASS with an audit-only config resolving the main worktree's existing dependencies; no dependency changes.
- Existing course unit suite:81/82 pass. Sole failure is unchanged aggregate illustration count355 versus expected320, after every figure's byte/safety checks succeed. No test edits.
- Independent content/Vietnamese/artwork review: PENDING for this candidate.
- Browser/UI persistence, responsive visual verification and final integration/build: PENDING; not claimed complete.
- No full human audio listening in this additive pass. Existing independently audited audio and all original supplemental question sets are preserved, with no audio-file changes.

Only lesson16/17/18 JSON, their35 original SVGs and this dedicated audit directory changed. No edits to the main worktree, shared renderer, schema or tests. No commit, upload, publication or deployment was attempted. Remote work remains paused.

## Integration need: optional fourth animal question

L16 PDF165 / printed153 prints “（4）……” after the three concrete animal questions. The present shared field contract has no optional-field flag and the renderer treats text responses as required for completion. This candidate preserves the baseline ellipsis instruction and explicitly says the extra question may be discussed offline, while adding only the three concrete fields. Do not add a mandatory fourth text field. A future shared-contract change would need optional-field persistence/completion semantics plus browser/history regression coverage before optionally rendering a fourth question. Exact proposed target and source are in integration-needs.json; no contract change is included here.

Frozen candidate hashes are in frozen-hashes.json. Audit documents and figure sheets are included separately in audit-hashes.json.

## Independent-review bounded repair, 2026-10-04 04:54 UTC

Applied the two mandatory SVG fixes from `[private review workspace]` and the requested Vietnamese consistency correction:
- L16 warmup label2: moved the connecting-line endpoint and its dot from(489,158), which touched the cream forehead, to(498,146), visibly inside the exposed black ear. Other four anatomical targets are unchanged.
- L17 picture3: added a continuous visible strap from the character's shoulder across the chest into the bag body. The bag no longer floats. Original one-person campus-walk scene and bilingual descriptions remain valid.
- New L17 `field:text1-question3` reference: changed only “thầy Lý” to “cô Lý”, matching its preserved prompt. The Chinese source says 李老师 and does not itself specify gender; this correction is translation consistency, not a new source claim. All existing baseline text remains unchanged.

Re-rendered all35 SVGs and personally opened both repaired SVG renders individually at640×400 after completion. Baseline/source/key/field/schema/lexicon validation and typecheck passed again. Unit suite remains81/82 with only the unchanged355-versus320 aggregate count failure. Independent delta acceptance remains pending. No main-tree/shared-code edits or remote actions.

`pre-repair-frozen-hashes.json` preserves the preceding candidate; `repair-changes.json` lists exact before/after hashes. Only four of the38 candidate files changed: the two SVGs and their two lesson JSON manifests/content. Lesson18 and all33 other SVGs are byte-identical.
