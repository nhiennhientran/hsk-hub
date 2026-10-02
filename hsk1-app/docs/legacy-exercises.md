# Original exercise restoration (preview only)

Integrated final preview acceptance: [legacy-restoration-acceptance.md](legacy-restoration-acceptance.md). The local implementation checkpoints below are historical; final exact-head Chromium and WebKit verification is recorded in that acceptance note. Production remains unmodified pending user review.

## Count boundaries

- Original learning bank: 300 entry points, 20 per lesson, all 15 lessons
- Lesson 9 pilot: 30 entry points, including five ungraded writing prompts
- New authored task records: 315. Fifteen entries reference an existing authority: twelve original entries reuse current homework cores; pilot 9-o2 and 9-t3 reuse current homework; pilot 9-o3 reuses restored l09-sort-03
- Current homework review contributes another 150 entry points, not another 150 restored questions
- Current 225 homework questions, 75 listening questions and 344 vocabulary-sense records are unchanged
- The pilot reading passage remains attached to all five reading entries. The ungraded speaking activity has three stems and is outside the 330-question count

`legacy-exercise-manifest.json` maps all 330 source entries to their authority, source commit/file/line or textbook page, original-payload SHA-256, restoration decision and tests. Its mutually exclusive outcomes are 314 restored, 15 shared, and one corrected. The five manual prompts additionally carry `assessment: manual-only`.

## Data and grading

One new lazy `exercises` feature renders original, pilot and current-homework-review modes. The source corpus lives in `content/legacy-exercises.json`; question answer data exists in one authority record. Source-specific prompts and shuffled token/option presentation are entry metadata. Related knowledge, identical answer text, nominal source IDs and reused recordings alone do not justify sharing.

The old 75 Vietnamese-to-Chinese multiple-choice tasks remain automatic. Current homework translation and the five pilot free-writing prompts remain manual, with no accepted/incorrect/reference answers or explanatory model answers in student content. The printable/copyable writing sheet distinguishes drafts, submitted writing and unwritten prompts; it never fabricates a score.

The one corrected entry, l10-listening-04, retains its original quantity-comprehension options but uses 我想买两斤苹果 and matching pinyin. Evidence: current textbook `textbook-l10-text-2-line-03`, current listening `l10-listen-03`, textbook print page 73/PDF page 88, and their original track 10-3 segment 7.487–11.511 seconds. No new recording or timing was authored.

All listening requests use the existing shared audio owner with original track URLs and exact segment ranges. Replay resolves the currently displayed question, including before that question has been played; it cannot replay a previous question by accident.

## Learner state and review

`AppData.exercises` is optional when reading an older modular backup and normalizes to a blank state. New attempts contain the answer, recomputed correctness (strictly null for manual writing), source-authority fingerprint and timestamp. First/latest follow submission order, including device-clock rollback. Source grades are never accepted without recomputing the answer.

Review due dates and streaks are derived from validated answer history. Current homework review reads original question reviews and records separate practice attempts; it does not rewrite homework first grades. Original and pilot variants with separate task cores do not inherit one another's grades. Vocabulary schedules and the current listening session remain separate domains.

The explicit original-v2 import uses the pinned 069f9d source witness, exact source answer domains and option/token mappings. It can reconstruct complete first/current submitted-answer snapshots and valid drafts. It excludes the corrected l10-listening-04 and never overwrites a newer exercise record/draft. Old score-only history is retained as original bytes, not converted into invented attempts. The import warns that v2 has no content fingerprints and cannot identify arbitrary edited banks that reused the old IDs.

## Verification

- `tests/legacy-content.test.mjs`: compares all 330 entries against the pinned Git source; verifies every authored fingerprint, source-payload fingerprint, shared answer domain, passage, manual-field exclusion and original audio range
- `tests/exercises.test.mjs`: grading, first/latest, double-submit, clock rollback, manual invisible text, review filters, shared identities, resets, corruption rejection and conservative source migration
- `tests/router.test.mjs`: canonical routes, scope isolation and original pilot URL
- `tests/browser/exercises.spec.ts`: reload/navigation, wrong/due queues, manual drafts and IME interruptions, screenshot sheet, reading passage, hidden listening transcript and mobile layout

Local TypeScript/build and the complete unit suite passed. Browser acceptance is authored but requires the integration CI browser environment: this container's Chromium process is blocked by socket/ptrace permissions before startup, including the permitted escalation attempt. This note does not claim browser acceptance passed.
