# HSK1 legacy restoration and bilingual preview acceptance

Status: independent preview; production replacement requires the user's approval of the actual pages.

## Candidate identity

- Preview branch: `preview/restore-legacy-experience`
- Runtime source: `4ec260f9b7b08b793cd12e589fd5bcf1c301718f`
- Exact public build: `397e792021c28a36214868d475ef6c3f01cde06cf993f86eb466de58ca1ea5d3`
- CI: https://github.com/nhiennhientran/hsk-hub/actions/runs/36985143506
- Original reference: `069f9d956c9a600a91e6b4ce82241ceccc184dce`
- Starting source: `9bae5c173817d6b7f46e876ea144380d0627ab7d`

The CI build is frozen once and checked by both engines without rebuilding. The downloaded archive digest and all 412 release-manifest file hashes were verified. Public output contains no source maps or reversible credential fallback. The classroom password and WebCrypto-only authentication policy are unchanged.

## Content accounting

`correction-manifest.json` accounts for every one of the 480 original entries. Counts refer to entry points, not an assertion that every entry represents unique knowledge.

- Original textbook 150:36 exact;100 same-target corrected current versions retained;4 explicit textbook corrections retained;10 valid old vocabulary/pinyin targets restored using current correct content. Current textbook practice has160 questions, not a copy of the obsolete generated150.
- Original learning 300 and pilot 30:315 authored task authorities plus15 shared-reference entries. Mutually exclusive manifest outcomes:314 restored,15 shared,1 corrected. Exact prompt/option/token variants are retained as entry metadata where needed. Shared sources are not duplicated as question/audio authorities.
- Current 225 homework,75 independent listening and344 sense records remain. Their score domains are distinct.
- Both 75 original translation-choice tasks and75 current free-writing tasks are available, following the user's explicit decision. Pilot five free-writing prompts remain ungraded; no accepted/incorrect/model answers were revived for those prompts.
- Pilot reading retains its original passages; three oral stems are separate from its30 entries. All 441 old lesson-character entrances remain within the current 485 entrances/267 local character assets.
- All 93 original audio files are unchanged.330 vocabulary senses have original word clips;14 correctly state unavailable. Current textbook source examples cover 328 senses with 565 references; absent examples are explicit rather than fabricated.

## Functional boundaries

- Free card Previous/Next/Skip never requires rating; rating still requires reveal, drives only review scheduling, and never auto-advances. Unrated cards remain in saved queues, including out-of-order completion and backup round-trips.
- Mixed Hanzi/Vietnamese/pinyin search intersects lesson/rating scope without merging senses. Current textbook examples retain source links.
- Listening 5/10/all stores the chosen immutable round. Question-level homework/original wrong/due review is separate from vocabulary scheduling and independent listening grades.
- Old-data discovery previews exact understood/unrecognized source counts. It supplements missing identities without overwriting current work. Ambiguous, corrected or score-only history remains raw. Old v2 has no per-question fingerprints; the UI states that limitation instead of claiming arbitrary edited banks are safe.
- Lesson/module/all reset previews scope, asks for explicit confirmation, retains recovery, and preserves unaffected mixed-round work. No actual learner data was reset during development.
- All HSK1 controlled interfaces, including login/help/data management, have deliberate Chinese/Vietnamese copy. Curriculum texts, options, typed answers and source passages are unchanged. Native browser/OS dialogs follow device language.

## Verification matrix

Final exact-head run 36985143506 completed successfully on 2026-10-02. Retries are disabled. No failed, skipped or flaky cases were reported.

| Check | Chromium | WebKit |
| --- | --- | --- |
| Early actual-page capture | 6/6 passed | 6/6 passed |
| Complete interaction suite | 130/130 passed | 130/130 passed |
| Strict release-path checks | 3/3 passed | 3/3 passed |

The early six capture cases are included again in the complete suite; do not count them as six additional unique tests. The single frozen build job also passed catalog and 12-fixture checks, all 263 unit tests, TypeScript, release build, seven release-architecture checks, original-asset checks and public credential/map audit.

The interaction suite actually renders and submits all 330 restored entry points, checks all 344 senses in three lesson batches, and independently exercises all 21 homograph families/46 sense identities. It retains existing all-course homework/listening, reload, IME, route race, corrupted storage, conflict, migration, reset/recovery and answer-reveal regressions. Both engines use the same frozen bytes and no production deployment step.

Chromium job: 110768556953 (130 cases in 9.8 minutes; release 18.6 seconds). WebKit job: 110768557002 (130 cases in 13.6 minutes; release 22.8 seconds). The earlier bilingual run a120657 also passed both 130+3 suites, but final acceptance uses 4ec260f, not that earlier result.

Actual Chromium and WebKit screenshots cover desktop 1440 and mobile 390: home, textbook vocabulary/dialogue/grammar/Hanzi/practice, homework, listening, mixed cards, progress, original translation-choice, pilot reading, login, help and data management. Separate interaction tests include 320/390/768/1104/1440 layouts. Final compact screenshots verify the first mobile word and first desktop exercise prompt are visible initially. No clipped controls or overlapping lesson content were found in the representative pixel review.

## Limits and release gate

NOT RUN: physical iPhone/Android and their system IMEs; fresh human listening to every recording; complete new teacher linguistic review; installed-device TTS voice quality. Browser/asset/automated composition tests do not substitute for those checks. Force-closing a browser, power loss or explicitly leaving with unsaved changes can still lose an unsaved draft.

Production `gh-pages` was independently rechecked at `f7d87df013d38613c11326088f27dff26532cc90`, unchanged.

The preview package listens only on 127.0.0.1 and stores separate-origin test data. No new public website, production branch, live learner records or production deployment has been changed. Publication remains pending explicit approval after actual preview review.
