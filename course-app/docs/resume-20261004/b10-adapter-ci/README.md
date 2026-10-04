# B10 adapter CI preparation

The new workflow runs only on a push to `work/hsk-b10-adapter-ci-20261004` or an explicit `workflow_dispatch`. Its two matrix jobs are Chromium and WebKit. Permissions are read-only; it has no merge, publication or deployment operation. This folder records preparation and static verification. It does not claim that the new CI has run.

Each job installs both apps using their committed npm locks, runs both unit suites, source/fixture checks and typechecks, installs the actual pinned Playwright matrix browser and Noto CJK fonts, then builds both apps. HSK1 copied audio/glyph/license bytes are checked by the existing asset verifier. The two app copies of Playwright must both be 1.62.1 and declare identical browser revisions. CI rejects `HSK_BROWSER_PATH` overrides so the recorded default launch entry is the one used by the native config. Its actual hash is recorded, with the limit that this does not hash every browser/system library.

Native execution uses the existing HSK1 three fixtures through an auth-free Vite dev harness on port18911, and the HSK2/3 eight fixtures through the real isolated compiled app preview on port4179. The HSK1 harness exercises the actual source modules and history renderer; its independently built dist is separately hashed. This is not a claim that the three harness cases test every production HSK1 entry. HSK1's CLI, author config and fixture import the HSK1 Playwright installation; the wrapper deliberately avoids loading a second runtime copy from course-app.

The CI-specific configs write JSON, failure contexts, traces and per-case PNGs under `course-app/.repro-output/b10-adapter-ci/<browser>/`. They do not overwrite the frozen local collection-only reports. HSK1's existing two author screenshot calls retain their named output locations in the private CI checkout and are also uploaded. Tests run with zero retries; collection is not invoked by the workflow. Each engine must produce three HSK1 and eight HSK2/3 actual passed results, with exactly one result per case, matching project/file identity, no expected failures, skips, retries, errors or flaky outcomes. Failure of either suite or a prior command rejects the job. If HSK1 native fails, HSK2/3 still runs to preserve useful independent diagnostics; the failure remains a failure.

`run-command.mjs` captures actual stdout/stderr, exit code, timestamps and the log's SHA256 while preserving failure exit status. `checkpoint-records.mjs before` requires the checkout HEAD to equal the real `GITHUB_SHA` and validates every scoped worktree byte/mode against that commit. It records the existing packager runtime snapshot plus an explicitly labelled extended build/fixture snapshot covering HSK1 tools/review/config/locks, retained legacy source dependencies, both app tests, these configs/scripts and the workflow. Both registries are recorded as actual values, without declaring their contents independently accepted.

`builds` hashes all actual output files of both builds and verifies that all 36 HSK2/3 raw lesson/lexicon/index chunks decode to the current exact source bytes. `after` requires identical checkout identity, runtime/build/fixture snapshots, unchanged built bytes, every required successful command with its exact log SHA, and the two valid actual native reports. Its accepted status is a private native checkpoint; it is not a release certificate or user publication approval. Any missing report, collection-only JSON, launch failure, skip or source/build drift creates a failure record and exits nonzero.

Each always-upload artifact contains exact source identity/snapshots, build inventories, installed-browser metadata, actual reports, stdout logs, PNG/error/trace outputs and compiled JS/CSS/JSON/HTML consumers. Large copied MP3/PNG/glyph binaries are represented by the full built-file manifest and source/asset checks rather than uploaded again. Do not claim that the downloadable artifact contains every built byte; the compiled consumers and per-case screenshots are uploaded, and omitted asset declarations can be checked against the exact checkout and locked dependency provenance.

Local validation covers workflow parsing/structure, Node script syntax, meaningful report rejection unit cases, fixture typechecking and case collection (six HSK1 and sixteen HSK2/3 across both engines). The planned existing HSK1 catalog/migration-fixture and HSK2/3 content checks also passed a read-only local preflight; these check source derivation/structure, not official-language acceptance. These are not 22 native passes. The parent will freeze the adapter/CI candidate, persist and verify its remote tree/ref, trigger the run, then independently accept its actual head and artifacts. The prior B10 blocked/collection and A9 reports keep their original candidate identities.

Reproduce static checks from repo root:

```sh
python course-app/docs/resume-20261004/b10-adapter-ci/verify-workflow.py
node --check course-app/docs/resume-20261004/b10-adapter-ci/checkpoint-records.mjs
node --check course-app/docs/resume-20261004/b10-adapter-ci/run-command.mjs
node --test course-app/docs/resume-20261004/b10-adapter-ci/verify-native-results.test.mjs
course-app/node_modules/.bin/tsc -p course-app/docs/resume-20261004/b10-adapter-ci/tsconfig.json
hsk1-app/node_modules/.bin/playwright test --config=course-app/docs/resume-20261004/b10-adapter-ci/playwright.hsk1.ci.config.ts --list --reporter=list
course-app/node_modules/.bin/playwright test --config=course-app/docs/resume-20261004/b10-adapter-ci/playwright.hsk23.ci.config.ts --list --reporter=list
```

The Python structure checker uses the existing local PyYAML installation. The GitHub job itself does not depend on that Python checker. Its acceptance comes from actual commands and guarded reports, not from static validation.
