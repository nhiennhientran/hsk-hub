# B10 HSK2/3 inactive Vietnamese projection adapter

The adapter preserves the full raw lesson, lexicon and course-index files and projects independently accepted Vietnamese leaves onto private current-display copies. The active registry contains `hsk2:null` and `hsk3:null`; no official correction is activated by this checkpoint. Synthetic wording, source IDs and book hashes occur only in tests and do not constitute textbook review.

`source-bytes.json` records the actual dirty-worktree build and input hashes. Its 36 raw HSK2/3 files are compared byte-for-byte to Git `835e5bd41045655cc2724ba2ba59235064ff92cf`; the emitted raw JavaScript imports are actually imported and their decoded strings compared with those exact source bytes. The build also contains other agents' concurrent HSK1 changes, so this is not a clean release, an exact future CI candidate, or approval to publish. This adapter checkpoint does not reuse the earlier A9 browser results.

## Runtime contract

`official-vi-registry.json` has schema version 1 and exactly the course keys `hsk2` and `hsk3`. Each value is `null` or an explicit registration containing `manifestFile`, `manifestSHA256`, `reviewFile`, and `reviewSHA256`. Missing, corrupt, foreign, stale, unreviewed or incomplete active assets reject loading; there is no fallback which silently activates or partly applies a rejected batch.

`validateTrustedViRegistry` accepts course identity, parent display identity, independently pinned manifest/review raw bytes and SHA256s, plus `{file,rawText}` baseline documents. `baselineViDisplayRevision(courseId)` is `${courseId}:baseline:2026.1`. An active manifest is a cumulative projection against that exact baseline. A previously projected file is never treated as the raw source or as an implicit new parent. `viBindingsForDocument` exposes the actual registered owner, component, original pointer/index, lesson, Chinese context and Vietnamese value. `projectLesson`, `projectLexicon` and `projectCourseIndex` return deep clones; approved projections also check raw serialization and the full raw source hash.

The shared proposal digest removes every key exactly equal to `independentReview`, sorts object keys recursively with JavaScript lexical `.sort()`, retains array order, serializes with `JSON.stringify`, then hashes UTF8 bytes. The separate review artifact is pinned by the registration and manifest; it binds a distinct author and independent reviewer, an accepted status, the proposal digest, exact accepted change IDs, exact consumer references and source evidence references. Per-change acceptance also binds that reviewer and review file.

| Binding | Required identity |
| --- | --- |
| Baseline | Exact course, engine, version, lesson/file identity, full raw JSON SHA; exact baseline/document set |
| Target | Known VI leaf, original RFC6901 pointer, owner ID, component, lesson and actual local Chinese context |
| Expected value | Exact raw baseline value; nonempty changed new value |
| Consumer | `{baselineFile,field,ownerId,component}`; exact accepted set, each with an accepted projection target |
| Direct official source | Actual occurrence `sourceId`, document source ID, book SHA, bounded PDF pages, printed pages, section, official VI text and local Chinese context |
| Terminology-derived source | Explicit `notVerbatim:true` and bounded terminology source references |
| Editorial source | `directCounterpart:false` and rationale; no alleged PDF/printed pages or official book quotation |
| Coverage | Explicit accepted owners and disjoint pending/unresolved owners; `match` belongs to the ledger, not active changes |

The VI whitelist excludes IDs, ZH, pinyin, part of speech, media, answer values, option/token order, source/ASR evidence and unknown fields. Translated activity option labels must stay distinguishable after NFC, whitespace and case normalization. All guards run before projected copies are returned. Cached raw JSON is parsed and hashed once; current lesson/lexicon caches bind course, raw SHA, revision ID and manifest SHA. Unreviewed lessons remain baseline copies.

## Submitted history

New submissions retain the existing `grade`/`recordAttempt` behavior and deep `Attempt.questions` snapshot. Their display never passes through the current VI projection. First/latest records, original answers, scores, learner profile, grading question contents and content revision remain the actual saved values. This change does not invent intermediate submissions or a historical copy of the whole textbook.

Listening now finds a saved question by its saved ID and uses the attempt's answers for readonly radio choices. A submitted legacy attempt without a matching question snapshot displays its original raw answer and saved score with a missing-snapshot explanation; it does not borrow the current question or regrade it. The current lesson transcript is rendered separately and explicitly labelled as current reference, not a historical question snapshot. Homework receipts already used only saved questions or raw values; the current lesson title is now explicitly labelled as current content.

The commit/grade/storage failure behavior and raw state schema are unchanged in this scope. The meaningful native fixtures cover saved/missing snapshots for listening and homework in both HSK2 and HSK3, including mismatched round drafts versus submitted answers, first/latest switching, reload and unchanged saved data. Local typecheck and collection are evidence of fixture validity only; Chromium/WebKit execution remains pending the parent's new CI.

## Boundaries and verification

Author targeted guards, full unit regression, source/fixture typechecks, isolated build and source-byte proof are recorded in `verification.json` with exact logs and SHA256s. `independent-review.json` separately records the actual pre-fix editorial printed-page counterexample, its narrow closure and the final source identity; do not count the initial counterexample as a passing guard. No final release gate is produced.

Only approved, minimized public manifest/review sidecars may enter `course-app/content/*official-vi*.json`: Vite can emit a chunk for a matching file even when the runtime registration is inactive. Private proposals, PDF/source pages and transcription evidence remain in docs. The runtime loads only explicitly registered assets and verifies their exact bytes.

Global renderer UI literals are outside this adapter's lesson DTO scope. In particular, `lesson-view.ts` uses the literal `Bài khóa N` for generic text tabs/headings (lines 590–603) instead of every raw `.title.vi`; this is a separately assigned B14 UI comparison task. Lesson metadata such as appendix star/POS notes, coverage-review notes and unused illustration titles are not registered projection targets; the actual renderer uses explicitly registered display copies such as illustration alt/description/label. An intentionally blank matrix header also stays untouched. These boundaries are not assertions that the full website has already been compared to the textbooks.

Reproduce from the repo: run `node --experimental-strip-types --test course-app/tests/official-vi-revisions.test.mjs`; from `course-app`, run `npm test`, `npm run check`, `npx tsc -p docs/resume-20261004/b10-hsk23-adapter/tsconfig.native.json`, and `npx playwright test --config=docs/resume-20261004/b10-hsk23-adapter/playwright.history.config.ts --list --reporter=list`. Build with `npm run build -- --outDir .repro-output/b10-hsk23-adapter/dist`, then run `node docs/resume-20261004/b10-hsk23-adapter/verify-source-bytes.mjs`. Remove `--list` only in an environment with the pinned browser installed to obtain actual native results.
