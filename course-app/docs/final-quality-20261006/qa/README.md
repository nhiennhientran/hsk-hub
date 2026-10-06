# Final course acceptance — 2026-10-06

The published course contains 48 lessons: HSK1 15, HSK2 15, HSK3 18. The 30-question groups total **1,440** questions (450 HSK1 plus 990 HSK2/3). Every group retains its stable IDs, original answer order, and separate manual writing assessment.

`teaching-coverage-ledger.json` traverses all 27,735 registered Vietnamese teaching consumers, verifies all 64 teaching input files against accepted source commit `003cbae9fe3a8f9f085522bb66ea108d451fa52a`, binds current VI projection to independent accepted reviews, and explains the 99 intentional optional empty fields. Its 18,948 unique nonempty value/context records are an audit worklist. This is exhaustive structural/byte/projection coverage; it does not claim a fresh semantic reading of every unchanged field. Separate newly performed semantic and audio reviews must cite their own exact inputs.

The 165 newly appended D choices have separate independent review. `abcd-distractor-independent-review.json` records all accepted IDs and the fixed canonical entries hash. Runtime verifies that hash plus the report hash before appending D after the trusted VI projection. Original Chinese/VI teaching JSON, A/B/C order, grading indices, and historical receipts remain unchanged. Old three-choice draft snapshots stay readable under the existing incompatible-draft protection; beginning a current attempt retains history.

Lesson access requires the preceding lesson's completed textbook record or all five submitted homework groups. Zero automatic scores and submitted manual writing qualify. Valid existing work or completed reading for a later lesson preserves that lesson's access, without claiming that an incomplete preceding lesson is complete. New drafts and mere page visits do not unlock the next lesson. Direct lesson/homework/listening/archive routes use the same policy as selectors and aggregate practice/listening controls. Records are local to a browser profile, not a student account.

## Reproducible checks

From the repository root:

```sh
node --experimental-strip-types course-app/tools/final-quality-20261006/qa-teaching-ledger.mjs
node --experimental-strip-types course-app/tools/verify-official-vi-adoption.mjs --require-complete-course-adoption
node course-app/tools/validate-content.mjs
```

From `course-app`:

```sh
node --experimental-strip-types --test tests/final-quality/access-and-abcd.test.mjs
node node_modules/@playwright/test/cli.js test --config=tests/final-quality/playwright.config.ts --project=chromium
node node_modules/@playwright/test/cli.js test --config=tests/final-quality/playwright.config.ts --project=webkit
```

The browser suite collects 64 cases per engine (128 total): 48 lessons and all their actual teaching sections at 390px, 3 isolated student contexts, actual nonempty three-level backup export/selected restore, local-progress notice, and 11 requirement cases. The requirement cases include empty-profile deep-link locks, aggregates, draft refusal, five-group zero-score/manual completion, and actual A–D submissions. Exhaustive lesson scans intentionally seed isolated validated historical homework fixtures. Negative access cases start with empty course data; production policy is never bypassed.

`HSK_FINAL_QA_DIST` selects an assembled deployment directory. `HSK_FINAL_QA_URL` (with trailing slash) selects a running/deployed site and disables the local server. `HSK_FINAL_QA_REPORT` selects the JSON result path. The existing `official-vi-release-ready.spec.ts` and `homework-all-lessons.candidate.spec.ts` now use explicit valid completed-reading fixtures so their original all-lesson assertions remain meaningful under sequential access; the latter expects current accepted VI and reviewed D choices.

Collection and unit/type checks are recorded separately from actual browser runs. A browser installation failure is infrastructure evidence, never a passing browser result. Browser results and final publication identity are reported only after the corresponding native runs complete.
