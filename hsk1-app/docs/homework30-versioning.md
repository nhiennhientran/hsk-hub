# 30-question homework: version and compatibility contract

## Version identity and scope

`hsk1-homework-30-v1` is a new assessment version, not a relabeling of the historical stage2 bank. Each of 15 lessons contains exactly 30 questions: 10 vocabulary/grammar MC, 5 sentence ordering, 5 original-audio listening MC, 5 Vietnamese-to-Chinese translation MC, and 5 manually reviewed Vietnamese-to-Chinese writing prompts. There are 375 automatically scored items and 75 ungraded writing items. Automatic score denominators exclude writing.

The order is `choice → sort → listening → translationChoice → translation`. Submission, even with zero correct answers, opens the next section. A redo does not erase the first/latest submission or re-lock later sections. Up to 20 most recent attempts are retained in each versioned group; the original first attempt remains separately retained even after that window moves.

## Data preservation

- `AppData.homework` remains the frozen stage2 state. Its bank, engine, IDs, fingerprints, answer snapshots, grades and history are unchanged
- `AppData.homework30` is optional on historical records and uses `{version, lessons, profile, updatedAt}`. Missing fields are read as empty by new-version projections/controllers; reading an old record does not synthesize a new persisted extension
- New blank app states include the extension. The first new-version edit creates it in historical records through the existing atomic store
- Nothing copies old answer records, completion, timestamps, scores or fingerprints into the new version, including shared-source questions
- Old comprehensive exercise records stay under `AppData.exercises`; their selection as new homework content does not copy grades or drafts
- Standalone listening, textbook practice, vocabulary schedules, reading marks and source recovery bytes stay separate
- The storage key and atomic envelope remain `ran_hsk1_modular_v1`, schema1. Backups contain both versions when present; old backups without homework30 remain valid
- A rollback to an older runtime cannot safely edit a backup containing this extension. Download a full backup before rollback; the older validator rejects unknown fields rather than silently discarding the new state

Import validation rejects foreign IDs, mismatched SHA-256 question fingerprints, altered automatic grades, manual results that claim automatic correctness, inconsistent first/latest/history/current snapshots, malformed token orders, invalid lesson IDs and missing prerequisite submissions. Unsubmitted manual text retains the existing 12,000-character limit with no truncation. Validation is not cryptographic authentication: an external editor able to rewrite all matching answers and derived results can construct a consistent backup.

## Unreleased engineering-candidate boundary

The earlier engineering candidate `a63e64775345d3a155deb3bfdd0849803fa014b1` used provisional v1 IDs before the substantive content audit. It was not delivered as a learner preview, deployed to production, or used for student records; its CI profiles were disposable. The final accepted artifact is the reviewed, frozen bank. Its changed question fingerprints deliberately reject submitted groups from that provisional candidate rather than relabeling or regrading them.

`tests/fixtures/homework30/unreleased-candidate-a63e647.json` is a synthetic submitted group captured from that exact commit (source-bank SHA-256 `2eabb473486eb9ede2af17df8605293ce115ab2ec1b56e199bb004f7f9597840`). The boundary regression proves that a stale candidate backup is rejected without modifying it or the current state; a stale primary remains blocked from writes and its exact original bytes remain downloadable. A separate regression submits all 225 genuine pre-v1 legacy questions and verifies their original history, fingerprints and scores are still accepted unchanged. This is an unreleased-candidate incompatibility guard, not a student-data migration.

## Routes and receipts

The route model uses `homeworkVersion: '30-v1' | 'legacy'`. The canonical query is `version=30-v1`, for example `#/homework?lesson=1&part=choice&version=30-v1`. New student navigation must emit this explicit version. Historical canonical URLs, legacy learning-page aliases and saved routes without the field still resolve to their historical 15-question homework. `version=legacy` is the explicit equivalent.

New homework offers a historical-view link (`#homework-legacy-link`, inside `#homework-version-history`). It keeps the lesson and preserves compatible sort/translation part selections. First/latest receipts explicitly identify their question-bank version and read submitted snapshots, never an unsent redo draft. Writing receipts show no automatic score and still need the learner to send them to their teacher.

## Reset and backup safety

The existing preview/confirmation/atomic-recovery workflow is retained. A homework reset with no version selector includes both versions for its specified lesson scope; the preview explicitly warns that both 30-question and 15-question records will be removed. Optional `ResetScope.homeworkVersion` values `30-v1` and `legacy` allow callers to reset only one version. `all` includes both. The UI need not infer a version from its last visited route.

Summary metrics for imports/resets separately label old and new homework counts. Cancelling a preview does not mutate storage; confirming preserves the preceding app data as the normal recovery snapshot. A quota failure leaves the in-memory answer exportable and does not claim a saved submission.

## Public code interfaces

- `getHomework30Bank()` / `loadHomework30Bank(signal)`: validated new content only
- `createHomework30Controller(...)`: new version only; existing controller still owns legacy work
- `summarizeHomework30(data)`: fixed current-version course totals and per-lesson `homework`, `automatic`, `translation`, `nextRoute`; historical-state absence uses an in-memory empty fallback
- The existing `summarizeProgress` legacy fields are unchanged; the integrating UI can add a clearly separated current-version projection

## Evidence and verification

- Content authority/selection: `homework30-mapping.json`
- All 450 prompts, IDs, skills and source pointers: `homework30-inventory.json`
- Per-lesson coverage and explicit sentence-overlap audit: `homework30-content-audit.json`
- Regeneration guard: `node tools/homework30-content.mjs --check`
- Domain/storage regression: `tests/homework30.test.mjs`
- Content regression: `tests/homework30-content.test.mjs`
- Authored browser journeys: `tests/browser/homework30.spec.ts` (five journeys × Chromium/WebKit)

Local verification on the isolated implementation branch: 292/292 unit tests passed, TypeScript and production build passed, course-asset check passed, ten new Playwright scenarios discovered successfully. Browser execution was not attempted because the parent already established a browser-launch restriction; no bypass was used. The build emits a >500kB chunk warning for the versioned JSON bank (about138kB gzip); this is a performance warning, not a failed build. No external push or production deployment was performed.

Final reviewed bank SHA-256: `efc0fd1c3bbbead479e8d610da9ea7c802d7cf3edb553942edc2d7dce54c9c5d`. The post-review verification was rerun against this exact hash before and after the checks. The original three bank files and legacy engine remain byte-identical.
