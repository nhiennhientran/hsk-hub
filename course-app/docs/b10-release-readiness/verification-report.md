# B10 release-readiness repair review

The pre-publication gate now permits a reviewable frozen candidate with stages 1–15 evidenced as passed and stage 16 explicitly awaiting publication authorization. The old requirement to certify deployment before preparing the candidate is removed. The gate uses a real tested Git commit and an actual runtime file vector rather than requiring the gate's own commit to equal its future containing HEAD.

The CLI verifies actual tested Git paths, modes and blob bytes against the current clean worktree before build and again before freeze. Documentation-only commits can advance HEAD. Runtime/tool/raw-input drift rejects release even if the gate is altered to contain matching snapshot hashes. The existing raw audio and retained handwriting source scopes are preserved.

Official VI review now requires the actual three local PDF byte identities, complete distinct 148/162/212 source-page ledgers with explicit page dispositions, and independently accepted exact consumer identities for all 48 lessons. Page coverage and language-item completion are separate. Stage 14 additionally requires shared editorial, retained legacy questions, asset metadata, SVG, terminology and resolved errata scopes. Stage 15 requires final dual-engine/four-width native and regression evidence plus the complete native-tested dist input manifest.

Before output creation, packaging verifies every actual dist path, byte count and SHA against the native-tested vector. Changed bytes, same-length replacement, extra files, missing files and changed content-manifest bytes all reject with no output directory created. A matching synthetic fixture successfully freezes a package that still records `publicationApproved: false`, `deployed: false` and `stage16: awaiting-authorization`. The newly generated package manifest is excluded from the native-tested dist input vector, avoiding a provenance self-reference.

## Actual checks

| Check | Result | Evidence |
| --- | --- | --- |
| Targeted packaging/readiness tests | 16 passed, 0 failed, 0 skipped | `targeted-tests.log` |
| Complete course-app unit suite (`npm test`) | 200 passed, 0 failed, 0 skipped | `unit-tests.log` |
| Node syntax checks for changed tool/module and new tests | Passed | Executed with `node --check` |
| Tracked diff whitespace check | Passed | `git diff --check` |
| Actual final C15 language/native certificate | Pending; not run or supplied | Required by schema |
| Actual release package / publication / online acceptance | Not run | Publication remains withheld |

The temporary Git/evidence fixtures are synthetic test data. They prove validator behavior, not acceptance of actual source pages, Vietnamese wording or browser flows. No `unified-final-acceptance.json` was created, no old A9/CI evidence was rebound, and no runtime/adapters/deployment files were edited. No changes were staged or committed by this worker.

## Frozen implementation and log hashes

| Repo-relative path | SHA256 |
| --- | --- |
| `course-app/tools/package-unified.mjs` | `0b7bdbfe136b17108f0b5ee5ec0413e96d1e9f6a87c084636b56009439ce1cdf` |
| `course-app/tools/release-readiness.mjs` | `ed4bc1b2c9b1004819dd2e8594ee2b91a58f7b54cf9a1ef13614d8860349c6b7` |
| `course-app/tests/package-unified.test.mjs` | `4b6d3a1aa8badc67b9fce73eabda00c9aa755c1a0508430072e44f3b6e98e7c9` |
| `course-app/tests/release-readiness.test.mjs` | `b8e65e423b08c924499445fc99e6bea9f47715a58a1cdf8695fcbf4eaf49424c` |
| `course-app/docs/b10-release-readiness/README.md` | `582f2c595518d71734a26be0694eb4462cfcf9f18f8fb8d5b58d18a80c6089f9` |
| `course-app/docs/b10-release-readiness/targeted-tests.log` | `0bed6e7ab687d57fc00b54b7f48a0de5a65c865642424b55290c64f22c55084a` |
| `course-app/docs/b10-release-readiness/unit-tests.log` | `e521f8cfe78e7fe5cd3e2226dafb51cf8b935a9827a6c40d3b54231e7ac07d88` |

The exact owner file list is the seven files above plus this report. Root owns independent review and any subsequent staging/commit. Schema details and the retained generated-asset boundary are documented in `README.md`.
