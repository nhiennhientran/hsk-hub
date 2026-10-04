# A7/A8 learning-flow and compatibility evidence

64 added unified native Chromium cases passed against the repaired frozen build. They verify all 48 lessons' five homework parts, complete shared listening and mixed-card banks, and common persistence boundaries. The scope does **not** mean that every possible flow was exercised on every lesson. Separate retained HSK1 and protected legacy-host checks are recorded below. Independent engineering review is in `independent-qa/`; the author does not self-sign independent acceptance.

## What was actually executed

| Scope | Actual execution | Precise coverage | Evidence |
|---|---:|---|---|
| Unified homework | 48 passed | H1 L1–15, H2 L1–15, H3 L1–18; all five parts, actual 1,440 questions/240 saved groups; reload, exact questions/fingerprints, first/latest, manual original whitespace/newlines, four old H2/H3/H4 keys unchanged | `all-lessons-native-repaired.log`, exact extracted `all-lessons-native-repaired-log-summary.json` |
| Shared independent listening | 2 passed | All H2 60 and H3 72 IDs, every option and bilingual prompt; feedback hidden before submit, exact saved snapshot, reload, incorrect first → correct latest, wrong-only restart, cross-level isolation | Same original log, cases 49 and 51 |
| Shared mixed cards | 2 passed | All 226 H2 and 523 H3 canonical senses: complete shuffled queue, every front/back with exact ID, sense ID, hanzi, pinyin, VI and POS at 1440; final-page reload and 390/768/1440 resize binding; cross-level isolation | `practice-input-native-final-results.json` |
| Durable shared submit | 8 passed | H2/H3 × homework/listening × quota/actual held WebLock; no newly adopted receipt/feedback/history before confirmed write; real remount cancels retired attempt; ordinary save cannot commit it late; draft retained, explicit retry, reload, first preserved | `durable-native-final-results.json` |
| Final-lesson input boundaries | 2 passed | H2 L15/H3 L18: old out-of-range radio answer requires reselection, preserves old first; homework IME start aborts a lock-waiting attempt, later draft save stays unsubmitted; explicit retry and immediate editing after redo preserve history | `practice-input-native-final-results.json` |
| Mobile boundaries | 2 passed | At 320, each level's six longest VI card backs plus one long independent-listening prompt/options; card/document no horizontal overflow; confirmed feedback, reload; six PNGs | `mobile-boundary-native-results.json` |
| All-48 data roundtrip | 4 passed | Actual engines/store/validators with **synthetic memory StoragePort**, all 48 nonempty histories/reading/drafts, 240 first/latest groups, 132 shared listening records, 749 shared mixed senses; export/preview/import/rollback/quota/retry/cross-level and future-version rejection | `all48-state-roundtrip.log`, `all48-state-roundtrip-coverage.json` |
| Retained HSK1 native flows | 34 passed; 1 original fixture blocked | Separate current standalone build: all 75 listening questions, 344 senses/319 forms, four-width layouts, real MP3 L1/L10/L15 and clip boundaries, pause/resume/speeds/request failure, migration, competing real tabs, quota, reset, held-lock cancellation, exact old strings | `hsk1-retained-standalone-native-results.json` |
| Fresh-context HSK1 backup | 1 passed under explicit test session | Actual nonempty downloaded backup → new context → fresh gate observed with empty session → explicit authorized test session → exact restore, second import, exact recovery/rollback and reload | `hsk1-fresh-authorized-backup-native-final-results.json` |
| New nested package entries | 2 passed without substitution | Actual assembled new H2 L15/H3 L18 default entry, scene4 deep-link/reload, five translation questions; explicit cross-level links remain supported | `legacy-native-first-results.json`, only its two passed nested cases |
| Protected old entries | 1 passed under isolated dependency condition | Actual old H1/H2/H3/H4-up/H4-down 15/15/20/10/10 cards, route links, extra H4 gate/session/reload; **five nonempty legacy keys byte-identical** | `legacy-local-dependency-native-results.json`, condition below |

The mixed-card complete traversal is at **1440**, and the three resize checks are on the saved final page. The 320 check targets six long backs per level, not every one of the 749 backs. These are Chromium viewport tests; no physical-device test or local WebKit run is claimed.

`coverage-audit.json` has the 64 unique passed case identities and per-report hashes. `flow-inputs.json` hashes the actual current banks. The repaired 1,717-file build and standalone 613-file build still match every frozen byte; the four recorded runtime source hashes remain unchanged. Frozen manifests are `frozen-repaired-build.json` and `frozen-hsk1-standalone-build.json`. The old 1,782-file diagnostic build is explicitly separate.

## Conditions, differences and preserved failed attempts

- The retained HSK1 listening contract deliberately retains a clearly **unsaved** submitted candidate in live state/export and allows recovery/retry. The new H2/H3 confirmation-only rule is not generalized to HSK1. The retained HSK1 quota behavior was actually tested, rather than silently reinterpreted.
- The original HSK1 fresh-context case stopped at its required `HSK_TEST_PASSWORD` environment fixture before restore. The original definition is unchanged. The separate passing equivalent uses the suite's explicit session-authorization technique; it does not certify password validation or claim that the original 35/35 passed locally.
- The exact protected HSK2 old HTML initially failed because local Chromium received `ERR_EMPTY_RESPONSE` for the remote Pako2.1.0 CDN request (`pako is not defined`); Google Fonts also failed. `legacy-hsk2-dependency-observation.json` preserves the unsubstituted observation. For isolated old-route flow verification, only that exact CDN request was fulfilled with the already protected **same-version** `assets/pako.min.js`, 46,859 bytes, SHA256 `ede2693a4a6a5126b9d35669062b358ecab6ae7b9b86a1cf302feb45a8514907`. No package or HTML changed. A normal-network CI run must still check the original CDN chain.
- The actual old-route run used `package-closure-assembled` v1 (3,893 files). The assembly owner's v2 proof establishes identical 2,776 manifest-listed application/asset consumer bytes and identical protected old hosts; v2 changes only manifest metadata. Preserve the original tested artifact identity. Assembly evidence is `../package-closure/assembly-report.json` and `assembly-report-v2.json`.
- First durable native attempt: 6 passed, two homework quota assertions looked at the global message instead of the actual form status. The bounded locator fix was rerun: **8/8**. `durable-native-first-results.json` preserves the failed fixture assertions.
- First all-bank attempt: 48 homework + 2 listening passed; both mixed tests read storage before async start had saved/drawn. After awaiting the actual card and saved state, both full traversals passed with the two final-lesson cases: **4/4**. The original log is retained. Its structured report was overwritten by a concurrent `--list` operation: `collection-shared-playwright-error-results.json` is a **collection error**, excluded from acceptance. The 50 actual passed lines are sourced directly from the original reporter log; the derived summary does not pretend to be an original Playwright JSON report.
- The first HSK1 wrapper used the unified root's HSK2 default host for standalone `#/` fixture routes, then stopped. That host mismatch is retained and excluded. The separate standalone build subsequently ran the 35 retained definitions. A second Playwright-package import was also a collection failure; the dedicated retained runtime facade pins the wrapper, config and original tests to the same HSK1 installed runtime.
- Local Chromium lacks CJK fonts. Exact strings, saved objects, responsive boxes and transport were verified; Chinese glyph typography requires CI with Noto CJK. No human listening, physical-device certification, Vietnamese textbook-alignment acceptance or new answer-source audit is inferred here.

The prior official main run `37215775744` at `8cb52dddcd046e1d0eb6977b308b64c4d3f6c462` observed **857/860** passed before three gallery cases were cancelled by the old job timeout; it is not a full-pass certification and cannot certify the repaired candidate. The existing main workflow covers source-specific activity/reading/gallery flows separately. These added 64 gates close the previously absent all-lesson homework, complete shared-bank and submission-recovery coverage; they do not replace current two-engine main CI.

## Reproducible CI commands

From the repository, install both lockfiles and build `course-app`. Execute this additional job separately from the source-gallery shards. The config defaults to the checked-out `course-app/dist`; temporary local frozen paths are optional through `FLOW_DIST_DIR`. Default discovery includes exactly the five formal candidate files, **64 cases**, and excludes the old bad-behavior diagnostic file.

```sh
npm ci --prefix course-app
npm ci --prefix hsk1-app
npm run build --prefix course-app
cd course-app/docs/resume-20261004/flow-compat-review
node ../../../node_modules/@playwright/test/cli.js test --config=playwright.flow.config.ts --project=chromium
node ../../../node_modules/@playwright/test/cli.js test --config=playwright.flow.config.ts --project=webkit
```

Install the selected Playwright browser and Noto CJK fonts in each normal CI job. Use `--list --reporter=list` for collection so collection cannot overwrite a native JSON report. The config has one worker, zero retries, 120 seconds per test; `FLOW_PORT` can isolate concurrent hosts. `FLOW_BROWSER_PATH` is optional for the restricted local runtime.

For the retained HSK1 standalone job, build `hsk1-app`, use its CLI/runtime, and run from this directory so original screenshots stay within the review artifact folder. The retained config defaults to `hsk1-app/dist`.

```sh
node ../../../../hsk1-app/node_modules/@playwright/test/cli.js test --config=playwright.hsk1-retained.config.ts --project=chromium
```

The original 35-case run requires its existing `HSK_TEST_PASSWORD` fixture for the original fresh-context auth step. To isolate backup behavior without a password, use `FLOW_HSK1_MATCH=hsk1-fresh-backup.retained.ts` with the same command; it explicitly uses test-session authorization and is separately reported. Repeat each intended job in WebKit on normal CI.

For a verified assembled checkpoint, set `FLOW_PACKAGE_ROOT` to the assembly owner's actual output and run `playwright.legacy.config.ts`. Its default normal-network run performs no substitution. `FLOW_LEGACY_LOCAL_PAKO=1` enables only the explicitly recorded local dependency isolation condition. `FLOW_PACKAGE_PORT` defaults to 18783. Keep package verification, normal-network old-entry checks, and isolated fallback results distinct.

Before treating this directory as a frozen acceptance record, run `node verify-evidence.mjs` and read the independent review. No production publication or production-code mutation was performed by this A7/A8 author.
