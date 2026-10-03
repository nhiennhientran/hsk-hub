# Independent candidate review: HSK2 lessons 8–9

2026-10-03 UTC. **Pass for the source/data/artwork and deterministic renderer-function review gate.** No blocking defect was found in the exact candidates below. Real-browser layout/accessibility/storage/audio and release acceptance remain separate.

The prior source audit and its original evidence are unchanged. New review evidence, exact candidate snapshots, independently rendered artwork, scripts and execution records are confined to this `candidate-review/` directory. No lesson content, drafts, shared implementation, public assets or remote state was changed by this reviewer.

## Exact candidates and scope

- Lesson8: `8a5b106a80c141b1196d32d7be379bceb0037851ccf0e476902e469f11513023`
- Lesson9: `4cb74068f7b89b537abfbf3e7ee4b8e010cf42c01cc1d1b054d17462af95e5a3`
- Current `src/lesson-view.ts`: `51c500a899c6f8799e69f0ebb1d4986c9c27f2340d83f164df9ccc57fcdbf9d1`
- Current `src/activity-provenance.ts`: `12721fefeda69d0727b449478c47312c777b3f8e52f0960e6fd1888f50a45563`
- Current `src/style.css`: `2657c35f7378f94a02393027fb26e646daf762ca63abc1e06b09512170d6aa3d`

`reviewed-hashes.json` and the renderer result include the other schema/helper hashes. Copies of the reviewed implementation text are preserved here. Draft bytes were rechecked against the review snapshots during both independent data and renderer runs.

Reviewed **55 activities and 124 fields**: the original 117 source response fields plus seven optional objective self-checks. They comprise 38 official, 48 nonunique-reference and 38 open fields. Lesson8 has 26 activities/50 fields; lesson9 has 29 activities/74 fields.

## Source, language, assessment and preservation

The source audit previously opened every textbook PDF79–98, answer PDF10–13 and appendix PDF156–161 as actual pixels. The candidate mappings were checked against that independently established inventory, not an author-only coverage assertion.

- All32 original text questions map exactly once with original Chinese/Vietnamese and option sequences
- All38 official answer fields match the actual key and exact answer-PDF page. L8 warm-up is answer PDF10, remaining official fields PDF11. L9 warm-up/text fields are PDF12; all five word answers are PDF13, not their PDF12 heading
- All48 free-response reference examples retain their independent audit meaning; every added Vietnamese reference was read against its Chinese and full source dialogue/picture context. References remain explicitly editorial and nonunique, with no official key or exact-string grading
- All19 grammar blanks and12 picture blanks remain separate. Both gaps in L9 comparison dialogue3 and the two-gap picture frames preserve their original order and complete bilingual context
- The original audio track association and listen-twice instruction are retained for all eight listening activities. This verifies bindings and renderer directions, not the audio bytes, playback or pronunciation
- Every pre-existing baseline property, string, list and order is preserved. This includes Chinese, pinyin, Vietnamese, all twelve L9 duration examples, both source tips, classroom instructions/example turns and absent-video disclosures
- Exactly30 homework per lesson remain deeply identical:10 vocabulary/grammar,5 ordering,5 listening,5 translation choice,5 manual writing. Manual writing remains answer/model/hint-free. Four separate supplemental listening questions per lesson remain unchanged
- All30 lexical/POS-sense rows bind to correct appendix pages. L8 keeps 左/右 subentries and both 比 senses; only 爱情片 has `supplementarySyllabus:true`. No L9 word is starred

`field-linkage.json` records all117 source response field IDs, activity IDs, source pages, target references and keys/references. `independent-data-checks.json` contains **765 assertions, all passed**.

## Original artwork

All26 actual SVG files were independently rendered with MuPDF. The reviewer opened all five independently generated contact sheets at readable pixel scale, covering every asset. `illustration-index.json` records actual SVG/raster hashes and visual observations; SVG snapshots and individual rasters are retained.

All assets are self-contained original vectors without scripts, external/embedded images or textbook scan pixels, and all26 manifest hashes match actual bytes. Each has explicit auxiliary-image/draft provenance and correct source page/owner association.

Verified task-relevant visual relationships:

- L8 arrows point right then left in the correct source order; elderly man/woman panels preserve the matching context
- Empty used dishes, solitary classroom study, contrasting white/black garments and offering cooked food support the four L8 picture frames without inventing a unique key
- L9 coffee, entrance, height-measuring and walking panels are distinct; the measuring gesture reaches the child/scale
- L9 classroom/supermarket/garment comparison cues are retained, and the left boy is visibly shorter than the right boy
- Watch, phone, gift/restaurant, clothing shop, coffee, outdoor couple and diary scenes have the correct text placements
- The L9 text3 schematic depicts hand-holding rather than copying the photograph's arm-in-arm pose. Its description explicitly says hand-holding; no task/key depends on the exact pose
- Culture888 and tea topics remain separate from the unavailable videos; no invented recipe, distance, height, price or clock-time answer was introduced

No blocking clipping, reversed relation or broken task-relevant contact was found. This is source-compatible auxiliary artwork, not a claim of exact photographic reproduction.

## Real renderer-function results

The test invokes the actual current `mountLesson` and validator using a deterministic DOM recorder. Draft publication statuses were changed **in memory only** to exercise the approved-image branch; files and manifests were untouched.

**993 assertions passed**, covering16 L8/9 mapped views plus inherited matrix/provenance regressions:

- All55 activity IDs, all124 field IDs and all26 manifest figures are reachable exactly once
- Image URL/alternative text bindings are correct for every figure
- No answer/reference feedback appears initially; incomplete submissions do not reveal references or mark groups complete
- Every official field was tested wrong and correct, with the exact answer-PDF citation shown only after submission
- Every reference activity accepts alternative text and displays bilingual nonunique-reference feedback without correct/incorrect scoring
- Open responses and all-unchecked objective/review states save without correctness marks
- All groups restore values on same-state remount; edits clear stale feedback
- Picture-answer prose stays in closed details after the picture tasks; full classroom instructions/examples remain visible

These are function/state assertions, not an actual browser, CSS-layout, persistent-storage or screen-reader session.

### Lesson9's source tables

1. Personal warm-up:4rows ×2responses, eight independent controls. The four original row topics, today/yesterday℃, coffee/milk-tea per-cup referents, taste choices 非常/很/不 and preference choices 非常/很/没 are intact
2. Vocabulary reflection:2rows ×1free-text response, each with its original purpose
3. Grammar reflection:9exact grammar/example rows ×2independent 理解/会用 checkboxes, plus separate improvement response

The warm-up's `hideColumnHeaders:true` hides its synthetic accessible column headings, preserving the source's headerless visual topology; `horizontalScroll:true` makes its three-column table a focusable named scroll region. All eight row-specific labels carry `matrix-visible-label`. The final CSS was statically checked for that visible-label rule and the opt-in clipped-header rule. Actual mobile layout/overflow and assistive-technology behavior require browser acceptance.

### Earlier matrix regressions

All seven production L1–7 JSON files byte-match frozen commit `a31f672`; evidence is in `earlier-content-regression.json`. The current renderer exercised all nine inherited source matrices:

- L1 travel:3rows, fixed keyword context and one response
- L2 preferences:3rows, two fixed choice-context columns and one choice control
- L3 vocabulary2×1 and grammar9×2
- L4 experience table3×3, preserving source cell-specific labels
- L6 vocabulary2×1 and grammar9×2
- L7 paired verbal phrases3×1 and two-person/four-topic survey2×4

Headers, fixed contexts, response-cell order, control IDs, independent values and remount restoration are retained. Editing one cell preserves all others. All-checkbox matrices accept an all-false state. Existing wide tables retain their scrolling branch; ordinary headers remain visible unless explicitly opted out.

### Provenance display regression

The final helper suppresses only redundant same-page field footers. Every field's source metadata remains intact and every activity keeps a complete group citation.

- L6 review vocabulary/grammar:zero repeated field notes, group page55 retained
- L9 review vocabulary:zero repeated field notes, group page82 retained; grammar/improvement retain page83
- L7 survey:zero repeated field notes, group page63 retained
- L4 cross-page word choice:all five field notes remain, each with its exact source page; group cites35、36

The helper's dedicated unit tests cover empty/absent source, same-page, multi-page and different-group-page inputs. This reviewer ran the entire current course unit suite: **52/52 passed**. `npm run check` also passed. No full release build or browser suite was run by this reviewer.

## Bounded inherited L5 bed repair

**Recommend the single proposed artwork replacement**, with its manifest hash updated consistently during integration.

- Original public SVG hash: `1a035d28bc69f72635558e949dbbf58f65fe7362fed71ab1b4300551eb5cb182`
- Draft repair hash: `f2fc60edf9b5cecf32e34ef7ca79f90f651dfda1bf213c069be0bdc306de7eea`
- Verified exact byte-level operation: replace only the left support's `x="244"` with `x="276"`

The reviewer rendered/opened both actual SVGs and independently opened textbook PDF52/P37. The old left support was visibly detached from the lower frame. The repaired support meets the frame; the bed/window/hotel-room cue, source task number, description and all other artwork are unchanged. `l05-original.*`, `l05-repair.*` and `l05-source-pdf052.png` preserve this bounded comparison. No production asset was modified in this review.

## Acceptance boundary

These exact candidates clear independent source/data/Vietnamese-reference/artwork and deterministic renderer-function review. Parent integration should preserve source/content identities and then test the new headerless/scrolled L9 table, inherited matrices and provenance display in real browsers at desktop/mobile sizes, including keyboard/focus, reload/storage and source/answer visibility. The L5 replacement requires the corresponding production manifest hash change. No fresh audio/native listening, full media, real browser, accessibility certification, release build, CI, remote push or publication approval is claimed here.
