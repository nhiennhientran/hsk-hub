The final source must contain both workflows and their complete verifier/test
files before the final freeze request is committed. No live workflow rebuilds
the website. Only the root publication step may promote the exact verified
staging commit to `gh-pages`.

The freeze workflow consumes `ci-freeze-request.json`, validates the accepted
2,539 precision rows and single non-spoken annotation, verifies all 357 original
tracks, builds clean recorded source once, assembles the approved production and
legacy baselines, and runs 127 cases on each native engine against that same
site. Only after 254 passes does it stream every Git blob against the tested
inventory and push a new staging branch. Its staging receipt supplies the
actual commit and tree for the separate root publication lease.

After GitHub Pages reports actual deployment success, root may commit
`course-app/docs/final-quality-20261006/ci-live-request.json` with these fields.
The placeholders below are field documentation, not an executable request or
evidence of publication:

```json
{
  "schemaVersion": 1,
  "status": "published-freeze-request-live-revalidation",
  "baseURL": "https://nhiennhientran.github.io/hsk-hub/",
  "browserCasesPerEngine": 127,
  "originalAudioTracks": 357,
  "productionPublicationVerified": true,
  "sourceCommit": "ACTUAL_FROZEN_SOURCE_COMMIT_40_HEX",
  "freezeRunId": "ACTUAL_FREEZE_RUN_ID",
  "freezeRunAttempt": "ACTUAL_FREEZE_RUN_ATTEMPT",
  "singleBuildArtifactName": "hsk-final-single-build-SOURCE-RUN-ATTEMPT",
  "buildReportSHA256": "ACTUAL_BUILD_REPORT_SHA256_64_HEX",
  "siteInventorySHA256": "ACTUAL_INVENTORY_SEAL_64_HEX",
  "stagingBranch": "work/hsk-final-staging-20261006-RUN-ATTEMPT",
  "publishedStagingCommit": "ACTUAL_PUBLISHED_STAGING_COMMIT_40_HEX",
  "publishedStagingTree": "ACTUAL_PUBLISHED_STAGING_TREE_40_HEX"
}
```

The read-only live workflow first retains that request, checks out its exact
frozen source commit, and downloads the original single-build artifact from its
real freeze run. It independently verifies the source, build-report SHA,
inventory, original freeze run/attempt, staging tree and sole parent, and actual
`gh-pages` plus staging branch refs. Every frozen public path is fetched over
actual HTTPS with at most 16 concurrent requests and a streaming SHA-256 of the
complete response body. Redirects must finish at the approved GitHub Pages host
and website base path. Error responses retain their real status, final URL,
body length and SHA; any transport/status/byte mismatch fails the job.

After that complete HTTP gate passes, Chromium and WebKit each execute all 127
cases against `HSK_FINAL_QA_URL`. The existing password wrapper is used. The
actual Playwright reports record the real HTTPS target and absence of a local
web server. Case IDs must match collection and execution, with one successful
execution each and zero skips, retries, errors or flakes. The final combined
report preserves the new live run/attempt separately from the earlier freeze
run/attempt and binds all actual JSON bytes. A missing request, missing original
artifact, changed ref, incomplete report or missing final authority fails closed.

Local preparation checks cover schema, stream chunking and body tampering,
status/redirect failures, bounded concurrency, preserved run identity and actual
native target metadata. They do not certify a native or live execution.
