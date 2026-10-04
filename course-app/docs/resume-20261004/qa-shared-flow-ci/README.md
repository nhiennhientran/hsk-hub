# Independent actual shared and retained HSK1 CI review

Run [37226015769](https://github.com/nhiennhientran/hsk-hub/actions/runs/37226015769), remote head `dd8b22ccb1c1a9c41bc1243887f7a60558635782`, tree `e2c89f9c2029cec09d8a8bbb1315e9cd99ea225c`.

| Actual scope | Chromium | WebKit | Total |
|---|---:|---:|---:|
| Shared homework, listening, mixed cards and save boundaries | 64 | 64 | 128 |
| Unchanged original HSK1 wrapper | 35 | 35 | 70 |
| Separate explicitly session-authorized fresh backup | 1 | 1 | 2 |
| **Accepted actual executions** | **100** | **100** | **200** |

Every actual case passed once with retry 0, zero skipped/unexpected/flaky results and zero report/result errors. Exact file, line, column, title and suite identities match independent source collection, with no missing, extra or duplicate cases. Matrix-conditioned nonapplicable workflow steps are excluded from test-skip accounting.

Four independently downloaded ZIP byte hashes and sizes match GitHub artifact digests. Six current report payloads are retained under `artifacts/`; their project metadata binds the exact run and head. Other historical reports carried in those ZIPs are excluded. Job-log excerpts confirm the checkout head and 64/35/1 actual pass summaries. Collection JSON files are **list-only** evidence; their skipped placeholders are not browser executions and did not overwrite retained CI reports.

The original 35 include the unchanged password-dependent backup test and passed through the existing private in-memory environment fixture. The separate fresh backup case observes an empty-session gate and adds explicit test-session authorization; it does not certify password validation. Original definitions, helpers and migration fixtures match the retained historical hash manifest. Detailed boundaries, per-case outcomes and input hashes are in `independent-actual-review.json`.

Reproduce the evidence checks without executing browser cases:

```sh
python course-app/docs/resume-20261004/qa-shared-flow-ci/verify-actual-results.py
```

This reviewer changed only evidence docs and a separately assigned SVG inventory helper. Package/legacy/source-font/audio gates are outside this 200-case assignment. Historical core 860 remains bound to its historical `ce374` head; no deployment, official Vietnamese textbook audit, human audio listening, pronunciation/tone certification or physical-device certification is claimed here.
