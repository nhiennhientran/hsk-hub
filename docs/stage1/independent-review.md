# Stage 1 independent technical review

Baseline: `gh-pages` at `069f9d956c9a600a91e6b4ce82241ceccc184dce`.

## Scope

This review covers the independent lesson 3 prototype and its supporting design records. Stage 1 is limited to 15 working homework tasks: 5 multiple-choice, 5 sentence-ordering, and 5 teacher-reviewed free translations. It does not authorize bulk rewriting the other 14 lessons, replacing the production learning module, or publishing the site.

The integration owner clarified that this is a newly authored local/offline prototype. It does not connect to the protected production course or load production auth, data or application scripts. The prototype itself has no login. Production authentication remains unchanged; reusing its password belongs to a later integration step. Testing this new independent prototype through its own normal interface is not a test or bypass of the original site's authentication.

The reviewer has not opened a browser, entered an access password, modified session authentication, written to a remote repository, or committed changes. Existing production test reports are historical evidence and are not presented as new test results.

## Technical preparation

| Item | Read-only finding | Consequence for this prototype |
| --- | --- | --- |
| Production branch | README explicitly identifies `gh-pages`; `main` has diverged. | Keep the prototype based on the current `gh-pages` baseline. |
| Build/runtime | Static HTML, CSS and JavaScript. No repository package manifest, npm preview command or Sites hosting configuration was found. | A small local HTTP server can serve the prototype without rebuilding the production site. |
| Production access gate | The HSK1 gate validates the classroom password client-side and stores tab-session authorization. There is no provider-backed authentication API. | Preserve it unchanged. This local prototype does not access the gated course and does not reproduce or bypass the gate. |
| Later gate reuse | The legacy gate loads the shared shell through a page-relative URL and has legacy environment behavior. | Review asset resolution and ordinary password entry when production integration is authorized; do not add hostname/session shortcuts. |
| Existing local server | `tools/tests/browser-support.cjs` serves the repository on `127.0.0.1` with MIME types and byte-range handling. | Its serving approach is reusable. Browser login helper requires the password in `HSK_TEST_PASSWORD`, not a committed test fixture. |
| Browser dependency | Playwright 1.62.1 resolves from the primary runtime. Its default Chromium executable is absent. | The integration owner must supply a valid installed browser path or an approved existing preview/browser environment before claiming a browser run. |
| Existing reports | Browser JSON reports are tracked in `tools/tests/results/`; screenshots are generated into the chosen test-output directory and are not tracked baseline images. | New prototype screenshots and test records must come from the new run. |
| Remote capability | Read-only GitHub metadata reports repository push capability. | Capability is not a publication instruction. This review performs no remote writes. |
| Production QA | README requires `.github/workflows/site-qa.yml` before production. The workflow checks syntax, original course integrity, authentication, accessibility and curriculum baselines. | Stage 1 local verification is narrower. Production QA remains a later release gate if production publication is requested. |

## Question-bank review

`new-hsk1/hsk1/stage1/sample-bank.js` was read independently and checked with a local Node data audit. Results:

- Exactly one lesson, lesson 3.
- Exactly 5 choice, 5 sorting and 5 translation tasks; 15 unique IDs.
- Exactly 10 automatic and 5 manual assessment items.
- Student-facing translation objects have no `answer`, `answers`, `options`, `explanation` or `optionFeedback` keys.
- Print-page and PDF-page references consistently differ by 15 pages. This validates the recorded mapping; the textbook owner separately inspected the source pages.
- Choice/sort IDs and scoring-core fields match the existing lesson 3 records, supporting the declared compatibility for those items only.
- Free translations use new IDs and explicitly do not claim compatibility with historical multiple-choice translation records.

One small editorial clarification was recommended and applied by the question-bank owner: sentence-order item `l03-sort-03` now explicitly asks students to start with `她`, because the same blocks also permit the natural identity sentence `我的中文老师是她` in an appropriate context. The current accepted answer and its scoring fields remain unchanged.

No other blocking issue was found in the bank at this review point. This is not a claim of browser execution or whole-book question review.

## Engine source review

The complete first version of `new-hsk1/hsk1/stage1/engine.js` was read independently. No blocker was identified for the current 15-task sample.

- Uses the isolated key `ran_hsk1_stage1_v3`. The module itself has no storage, authentication, DOM or network operations.
- A complete five-answer submission unlocks the next task group regardless of score. No 80% or 100% gate is used.
- Translation completeness checks only nonblank text and length. Translation has no automatic correctness result, does not contribute to automatic scores and does not enter automatic wrong-answer review.
- `first`, `latest` and current `attempt` are copied separately. Restarting clears the current draft/attempt but retains submitted snapshots and completion.
- Homework totals separate 10 automatic tasks from 5 manual tasks. The generic optional listening API is present, but the sample bank has no listening content.
- Import reconstructs scores from submitted answers and rejects incompatible question fingerprints. Translation remains ungraded after import.
- Legacy migration is a pure, explicitly called function. It archives the original object, restores only declared-compatible objective work and leaves new free translations unsubmitted. It cannot overwrite a browser's legacy storage key.

The reviewer independently ran the final `node --test tools/tests/stage1-engine.test.cjs`: 29 tests passed, 0 failed, 0 skipped. These include unanswered submissions, zero-score unlocking, redo snapshots, manual translations with exact text preservation, independent score denominators, import validation, bounded history and migration fixtures generated by the original schema-2 engine. In addition to focused fixture banks, the final suite runs the actual 15-item lesson 3 sample through submission and backup recovery, and migrates records produced from the original deployed lesson 3 bank. Its final test reads the existing lesson 1 and lesson 15 sorting questions to check complete versus omitted token sequences; it does not author new questions or interfaces for those lessons. This is Node execution, not a browser test or a whole-book content audit.

## Interface review

`index.html`, `app.js`, `styles.css`, the inherited `learning.css`, and the local build/preview helpers were read. `node --check new-hsk1/hsk1/stage1/app.js` passed. The following findings are source review, not visual, screen-reader or browser execution:

- The page loads only the sample bank, pure engine, new interface and local styles. It loads no production auth/data/application scripts. The inherited stylesheet has no remote imports or font downloads.
- The interface reads and writes only the new sample key and its recovery key. It does not read or modify the production progress key, session authentication, original lessons, or network services. Legacy migration happens only when a user supplies a backup in the backup panel.
- The overview separates 15 submitted homework items, 10 automatically marked items and 5 ungraded translations. Partial automatic results use the number already submitted as the score denominator and show progress out of 10 separately.
- Choice buttons save original option indices after display shuffling. Sorting saves unique token indices and submits through the same engine checks. Buttons use ordinary keyboard activation and restore focus after replacing a question's markup; drag gestures are not required.
- Student name, class and translation text are escaped before HTML interpolation. Translation text is displayed inside escaped textarea content or escaped, pre-wrapped receipt text. Backup validation errors do not insert the supplied JSON or error message as markup.
- Translation input updates the stored text without rerendering its textarea. Composition-end synchronizes the final input value. There is no Enter-key handler or form default submission that would deliberately submit during Chinese IME composition. Actual IME behavior still requires a browser check.
- The translation receipt uses the current submitted snapshot or the latest completed snapshot, never a new unfinished draft. A redo screen keeps a button for viewing the previous saved translation. The receipt identifies the latest submitted version and its timestamp; it does not infer a lifetime attempt count from the history array capped at 20.
- Receipt wording tells students to capture all five answers and send them to the teacher themselves. It does not claim delivery or teacher feedback. No teacher reference answers are loaded into this student page.
- Backup inspection validates a candidate before replacement. Opening that candidate requires a separate user click and first saves the current state under the recovery key. The recovery button returns that version through the same inspection flow. If saving the recovery fails, replacement stops.
- Initial invalid saved data is not automatically overwritten. Runtime save failures leave the current in-memory answers available for JSON export. A subsequent successful write clears the prior write-failure warning.
- The build helper inlines only the local sample scripts and styles into one offline HTML. The preview helper serves an explicit file allowlist, without exposing uploaded materials or the rest of the repository. The reviewer did not run either server or a browser.

### Reported interface repair

Production `learning.css` hides disabled `.la-token` buttons, while the new interface disables the sentence's tokens after a sorting submission. This finding was reported to the interface owner and repaired locally with `.stage1-app .la-sentence .la-token:disabled { visibility: visible; opacity: 1; cursor: default; }`. The reviewer checked the applied source override. It preserves the submitted sentence while leaving already-used tokens in the pool unavailable. This is a source-level repair check, not a claimed browser observation.

## Isolated CI review

The integration owner plans browser verification in a new `work/hsk1-stage1-*` test branch. The reviewer read `.github/workflows/hsk1-stage1-qa.yml` and `tools/serve-stage1.cjs`; this review does not perform the branch push or start that run.

- The new workflow declares only `contents: read` and runs engine tests, installs the test browser, builds the offline HTML, exercises the local sample and uploads test artifacts. It contains no deployment, repository write-back, production login or explicit secret reference.
- Existing production workflow push-branch filters do not include the proposed `work/hsk1-stage1-*` branch family.
- The local test server permits only nine explicit sample/style/test paths, including the single built offline HTML, and only GET or HEAD. It does not serve original protected HTML, authentication code, teacher references, repository metadata or uploaded textbook/audio files.
- Two configuration refinements were reported and applied: a job-level branch guard restricts all triggers, including manual dispatch, to `work/hsk1-stage1-*`; checkout sets `persist-credentials: false` to make the read-only intent explicit. The reviewer checked both settings in the updated workflow.
- The reviewer read `tools/tests/stage1-browser.cjs` and passed its syntax check. It launches a new isolated Chromium context against that local sample server, permits only its localhost origin plus data/blob resources, and observes uncaught errors and failed resources. It does not connect to production, reuse a user session, log in, or inject application storage/state.
- Its 13 planned browser checks use visible controls for choices, token assembly, translations, redo, JSON download and inspected backup import. They cover wrong-answer feedback, score/progress separation, saved multiline translation snapshots, reload, legacy import and literal display of student HTML. The synthetic legacy record is built by the original Node engine and entered through the normal backup UI. The final script also checks one token's Enter-key activation and focus retention, and a 1,500-character Chinese/Vietnamese draft at a 320-pixel viewport.
- The offline build has its own fresh context and minimal check: page startup, five choice questions, locked sorting, a real answer click and persistence after reload. The static-review refinement was applied: this check verifies that neither external scripts nor external stylesheets remain, so the allowlist server cannot mask a missed CSS inlining step.
- These are checks of test code and intended coverage. A passing CI status and the actual JSON/screenshot artifacts remain separate execution evidence; a workflow or test script alone is not a completed browser run.

## Verification boundary

This review independently executes the 29 engine tests and JavaScript syntax checks, and reads the interface, packaging, isolation logic and browser test script. It does not certify mobile layout, print output, audio, real device input, screen-reader pronunciation or production login. The integration owner's actual browser checks and evidence must be recorded separately. A local prototype does not complete or publish the other three planned steps.


## 主任务集成验收补记

独立源码审阅之后，GitHub Actions运行36748943799已经成功：29项引擎测试和13个真实Chromium页面步骤全部通过。主任务已取回并视读3张截图；具体步骤、校验值和边界见同目录 `test-report.md` 与 `tools/tests/results/stage1-ci-summary.json`。本补记不改变上文对独立审阅者操作范围的说明。
