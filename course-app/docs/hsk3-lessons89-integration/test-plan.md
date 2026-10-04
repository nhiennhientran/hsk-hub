# HSK3 lessons 8–9 integration test plan

Recovered baseline: `9b7c76702e9724b4c647750138d800605254a116`, tree `87364d37a2cd26ff54540c1b39b92f9439abd4b0`.

The source-author lane owns lesson JSON, 25 original schematic SVGs and author evidence. The integration lane owns shared code, validators, regression tests and CI. Neither author evidence nor structural test success constitutes independent source approval.

## Tests added
- Eight source-specific page journeys: both lessons at 320, 390, 768 and 1440 pixels. Exact activity and illustration inventories are checked against the authored source bindings for all textbook sections and four text scenes. Image decoding, document overflow, runtime errors and handwriting controls remain inherited gates.
- Two official word-bank journeys: ten blanks each, independently specified answer sequences, rejection of incomplete submissions, save confirmation and feedback persistence. L9 primary data must contain 那儿 and 每年.
- Two picture-dialogue journeys: L8 3+3+3 and L9 4+3+3 separate fields, incomplete-submission checks, no automatic correctness grading, durable independent values.
- One L9 review-table journey: eleven source rows, 22 independent checkboxes, two separate vocabulary responses and effort response, open self-tracking and reload persistence.
- One L9 potential-complement journey: third source dialogue has two separately required fields and nonunique reference feedback.
- Two warmup journeys: six separate picture matching choices, independently specified official letter order, correct/incorrect feedback, edit invalidation and reload persistence.

- Two reading-feedback journeys: complete bilingual editorial references are absent before submission, appear after durable submission, never assign correctness by string matching, persist on reload, and disappear on edits. All 24 source reading responses must have references.

- One populated-history journey: old question/warmup/grammar/section values remain collapsed, read-only, inert text; current controls stay blank/ungraded; real unified download/restore preserves old records across reload.

These 19 test identities run under both pinned Chromium and WebKit: 38 new cases plus all 320 retained identities, for 358 collected cases. Shard equivalence and frozen historical-identity guards must pass; collection is not execution.

Six unit tests separately cover lesson inventories, source page/answerbook boundaries, word-bank keys, self-tracking and precise primary-data corrections. Existing illustration asset validation must pass for all 320 original SVG assets, including hash and no external/embed/script restrictions.

## Evidence and limits
Recovered baseline executed locally: course unit 73/73, HSK1 unit 335/335, production build and existing browser typecheck passed. Later additions require new runs.

Cloud native browser launch was blocked before app execution by OS process socket restrictions. A supported escalation did not change this. The pinned download returned invalid archives. No local browser pass is claimed. The pinned two-engine CI remains a release gate on the exact new commit.

No physical-device, human-listening, pronunciation certification, full-book publication or production deployment is authorized by these tests. Overall 16-step acceptance remains pending beyond this batch.

## Prior fallback record compatibility

Protected production commit `2da6a5c80c62d4ff5bdfa72a5bdb929b2b1ff3d4` has new-edition entrypoints, loading `course-engine/assets/index-Dy7SdlFq.js`. The existing HSK3 storage namespace is present, but the protected `course-engine/assets` tree has none of the later `activity-card`, `textbook-module`, `:answer` or `:response` markers. This does not establish use of the fallback controls in production. Preview users and imported backups can nevertheless carry their data.

The additive compatibility panel appears only on a lesson's overview, collapsed by default. It reads historical record values and original submitted/draft status, with corresponding source-column labels and reference pages where determinable. It explicitly discloses that old records did not store question snapshots. It never copies answers or old grading status into newly split controls, never rewrites storage and never scores these archived answers.

The selector excludes current authored activities, still-live fallback controls in partially upgraded lessons, other lessons and other editions. Three unit cases exercise nonempty records through actual save/reload/export/restore/recovery. Text is rendered using textContent-backed DOM helpers, and the native browser case tests malicious HTML as inert text and 320px overflow.
