# Independent candidate review HSK2 lessons 10 and 11

2026-10-03 UTC. **Pass for the independent source/data/language/artwork and deterministic renderer-function review gate.** No blocking defect was found in these exact candidates. Real-browser layout, accessibility, disk persistence, audio playback and release acceptance remain separate.

Reviewer evidence is confined to this `candidate-review/` directory. The earlier source audit is unchanged. No shared source, lesson content, drafts, public assets or remote state was changed by this reviewer.

## Exact reviewed candidates

- Lesson10 SHA256: `5483522f9ffdc4890b72b9987ef67e4e9dbda0c9f6c857083553328e3ed09fb5`
- Lesson11 SHA256: `312302260a98348355a201bdf9a000d9f9ebc46b77f30ca37d61eed3e28022b3`
- Current renderer `src/lesson-view.ts`: `51c500a899c6f8799e69f0ebb1d4986c9c27f2340d83f164df9ccc57fcdbf9d1`
- Current stylesheet `src/style.css`: `2657c35f7378f94a02393027fb26e646daf762ca63abc1e06b09512170d6aa3d`

`reviewed-hashes.json` includes other current schema/helper hashes. Exact candidate JSON snapshots, renderer/helper source copies, actual SVG snapshots and independent rasters are retained here. The current draft bytes were rechecked against the requested hashes and snapshots, not inferred from the author's report.

Reviewed **52 activities and96 total inputs**:

- L10:26 activities,47 source responses plus3 optional objective checks,21 official keys,22 reference responses,4 source-open responses,13 scenes
- L11:26 activities,43 source responses plus3 optional objective checks,19 official keys,23 reference responses,1 source-open response,16 scenes
- Combined:90 source fields,40 official keys,45 bilingual nonunique references,5 source-open fields,6 optional checks and29 original auxiliary illustrations

## Source and content acceptance

The independent source audit rendered and opened textbook PDF99–116, answer PDF13–15 and appendix PDF156–161, totaling27 applicable pages. This review checks the author drafts against that independently established inventory, its actual source-scene evidence and frozen baselines. The author report, summary, bindings and source files were read before candidate checks.

All **957 independent data assertions pass** in `independent-data-checks.json`:

- All90 source response fields appear exactly once with the correct assessment type and source page
- All32 original text questions retain exact bilingual prompts, baseline question IDs and original option sequence
- All40 official answers have the right value and exact answer-document PDF page; no reference/open field receives an invented official key
- **L10 text3 Q1 cites answer PDF13 and Q2 cites answer PDF14**, preserving the actual split-page boundary
- L10 retains six warm-up1 matches, three independent personal warm-up2 responses, nine grammar completions, five word choices and seven picture blanks in **1+2+2+2** order
- L10 fruit completion keeps 我都 and terminal 了 outside the fields; the reference for its second blank remains 洗完
- L11 retains both four-picture warm-ups; warm-up2 asks for verbs/verbal phrases without adding a requirement to use 着
- Both explanatory groups and all six 着(2) examples remain intact
- All eight source listening activities use their exact odd-numbered text tracks and listen-twice directions; no even-numbered vocabulary track is substituted
- There is no response matrix or source review table in either lesson, no text4 photo in either, and no invented L10 culture panel
- L11 keeps the unavailable culture video11-1 disclosure and explicitly rejects substituting same-number text audio

Every original baseline key, nested string/value, list item and ordering is preserved. That includes all Chinese, source pinyin, Vietnamese, source frames, grammar explanations/examples, tips, classroom directions/examples and culture information. The two production baseline files remain byte-identical to the earlier source snapshots.

Exactly **30 homework items per lesson** remain deeply unchanged, as do each lesson's four separate supplemental listening items. Manual-writing homework remains free of answers, models and hints. The new source activities do not replace or count toward the60 original homework items.

## Added language and appendix metadata

Every one of the45 added Chinese/Vietnamese reference pairs was read against the complete source context. They preserve the independently established meaning and remain explicitly editorial and nonunique. In particular:

- Xiaoming is ready after his father's help; the younger brother has washed his hands and the older sister has not
- The3天 hint is retained with a future birthday expression
- L11's reason for driving slowly contains both traffic and snow
- The medication passage remains a fictional narrative, without diagnosis or prescription guidance
- Destination/color examples under 最 remain examples rather than compulsory personal preferences
- Picture-task function-word examples such as 最 and 药店 remain reference-only even when strongly constrained

All added Vietnamese option translations and neutral Chinese/Vietnamese image descriptions were also read. No blocking mistranslation was found. Vietnamese and grammar-example pinyin remain editorial supplements; this is independent AI review, not teacher/native-speaker certification.

All28 vocabulary sense records have exact appendix PDF/printed-page, source-number, source-POS, lesson-number and star-legend metadata. None is starred. L10's two 考试 senses preserve one printed v./n. headword; 笔 retains appendix lessons10/13 and 还是 retains2/10. Original pinyin and POS text are not rewritten.

## Original artwork acceptance

All29 **actual SVG files** were independently rendered with MuPDF. All eight resulting contact sheets were opened at a readable640×400 cell size, covering every individual asset. `illustration-index.json` records each actual SVG/raster hash, source raster association, explicit visual-inspection status and scene-specific observation. SVG snapshots and individual rasters are preserved here.

Every asset is a self-contained vector without embedded source scans, scripts, foreign objects or external images. All manifest hashes match actual SVG bytes. The source page, owner and every response-field binding match the independent inventory. All assets truthfully identify themselves as auxiliary illustrations, and their files remain `draft-not-in-release`.

Task-relevant pixel checks passed:

- L10 examination desks versus arithmetic sheet remain distinct; redX, notebook stack/open notebook, door and laughing adults support all six matching fields
- L10 fork preserves both left/right choices; hands contact the washed fruit beneath the faucet; sand-playing children appear under clouds without current rainfall; cinema caller and nearby reacting audience are visible without an invented start time
- L10 packing, studying and return-home schoolbag scenes occur at the correct text placements
- L11 pharmacy, road/car, medicine packages and cheek-pain scenes remain distinct
- L11 warm-up2 shows night snowfall, headphones, door/handle/keys and a hand holding a bottle; it does not depict drinking instead of holding
- L11 high-five palms contact; worker/customer contact the package; the man's hand reaches his forehead while the doctor writes on a clipboard; the cinema girl remains seated with projector light behind
- L11 headache, car passenger answering the phone and sofa visit scenes match their source contexts; the driver is not shown using a phone
- The culture image depicts water poured into a cup, without unsupported medical benefits or invented video content

These are source-compatible schematic aids, not photographic replicas. Nonessential exact source poses are simplified, such as the high-five participants' posture. No reversed relationship, missing task cue, clipping or broken task-relevant object contact was found that blocks these exercises. Decorative source portraits, mascots and diary-page backgrounds are not invented as extra learning figures.

## Actual renderer execution

The test executes the current real `mountLesson` and structural validator under a deterministic DOM recorder. Image publication status is changed **in memory only** for the approved-image branch. The unapproved branch was separately checked to confirm draft assets do not publish automatically. Neither draft bytes nor manifests were altered.

`render-function-checks.json` records **1479 passed assertions**. Coverage includes16 candidate activity-bearing views plus targeted content and serialization checks and12 inherited matrices:

- All52 activities,96 controls and29 figures are reachable exactly once
- Every approved figure resolves to its exact image URL and bilingual alternative text
- All28 vocabulary sense rows display Chinese, pinyin, Vietnamese and POS distinctly
- All original text lines/context, source pinyin, Vietnamese, grammar structure/explanations and examples appear in the actual renderer output
- Both tips and the full L11 culture disclosure are visible; the culture route makes no same-number dialogue-audio request
- No answers/reference feedback appear initially or after incomplete submissions
- Every official field is submitted with a wrong option and then the right option; retry/correct feedback and exact answer-PDF citations are verified
- Every nonunique-reference activity accepts alternative text without a false correct/incorrect mark and shows its bilingual reference only after completed submission
- Open responses and all-unchecked optional objective checks save without automatic correctness marks
- All group values restore on same-state remount; single-field changes preserve every sibling and clear both checked state and stale feedback
- All candidate values survive the actual current state validator and a JSON serialize/parse round trip, then restore to their own controls
- Empty-state remounts clear every candidate response and old feedback
- L10's multi-blank tasks retain independent values; picture descriptions remain in closed post-question details
- Full classroom instructions and source examples remain visible

The reviewer also exercised all12 source matrices now present across production L1–9. Their original row/column/context/control bindings, per-cell independence, accessible label/scroll branch, all-false checkbox acceptance, restoration and scoped source footers passed. This was a read-only regression check, not an alteration of earlier lessons.

The current shared unit suite passes **52/52**, and `npm run check` passes. Logs are preserved here. No full build or publication was run.

## Acceptance boundary and next gate

These exact drafts clear independent source, data, added-language, artwork and deterministic renderer/state-function review. No author correction is required by this review.

Integration should retain the accepted source/content identities and stage approved image copies consistently with manifest hashes. Then run actual browser acceptance at desktop/mobile sizes for this pair, especially the six-figure L10 warm-up, L10's seven picture blanks, both L11 warm-ups, correct/wrong feedback, nonunique/open submission, delayed hints, image enlargement, independent reload/reset persistence and source/answer citation display.

The deterministic DOM does not validate real CSS layout, focus, keyboard navigation, screen-reader output, browser storage, actual media downloads/playback or zoom-dialog behavior. No new audio alignment/listening or pronunciation certificate, browser/release pass, remote push or publication approval is implied.
