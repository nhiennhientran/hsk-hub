# CI Git fixture investigation — 2026-10-05

The previous WebKit course unit failure was a temporary readiness fixture `git add .` exit 128. Its helper discarded stderr, so the historical cause remains **undetermined**. The same HEAD passed on attempt 2; that does not close the cause.

The helper now preserves command, cwd, status, stdout/stderr, index/lock file state and inherited Git environment **names only**, then rethrows. Constructor failure now cleans its uniquely created temporary directory. There is no automatic retry or lock removal. All nine original tests and their assertions are byte-for-byte unchanged after the helper definitions.

Local verification ran 12 actual test processes at concurrency 3: 108/108 cases passed. After adding output isolation, a separate one-process rerun passed 9/9 cases and kept all original TAP hashes intact. Four controlled probe definitions test diagnostic capture, explicit synthetic-lock removal, and old/new constructor cleanup. They do not reproduce the historical CI cause.

Run from the repository root in CI, with `HSK_PHASE2_BROWSER` set by the matrix:

```bash
HSK_PHASE2_DIAGNOSTIC_OUT="$PWD/course-app/.repro-output/continue-phase2/${HSK_PHASE2_BROWSER}/ci-git" node --experimental-strip-types course-app/docs/continue-phase2-20261005/ci-git/stress-readiness.mjs --runs=12 --parallel=3
```

`HSK_PHASE2_DIAGNOSTIC_OUT` resolves against the caller's cwd. Every generated probe/JSON/TAP artifact goes there. Without an override, local runs write beside the runner. CI must use an external output directory so generated evidence does not change the immutable source/docs vector.

`git-fixture-investigation.json` pins the source, historical logs and local evidence. It distinguishes both script versions, actual tests, synthetic probes and uncertainty. The report is authored verification; independent review belongs to a different reviewer. The intended safe source files are the modified test, diagnostic runner, this README and investigation report. Generated local TAP/JSON outputs are evidence, not immutable source inputs.
