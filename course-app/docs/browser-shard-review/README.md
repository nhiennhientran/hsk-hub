# Browser execution sharding candidate

The unmodified native Playwright two-shard mode divides existing test files across two jobs per engine. No test is skipped, renamed, removed, retried, filtered from the full run or weakened. `fullyParallel` is unchanged. The four layout preflight cases still run once per engine, on shard1, before that shard's full suite.

`tools/verify-browser-shards.mjs` collects full Chromium/WebKit test identities and both shards, requiring nonempty unique IDs, an exact union and no intersection. The current196-case suite proves 98tests per engine =50+48, with exact identity hashes. This is a collection proof, not successful execution of the modified workflow. Re-run against the final lesson batch before upload. CI also runs the equivalence guard.

Each shard has its own reports/screens artifact names. Aggregate outcomes must combine both shards for EACH engine. A green shard alone cannot establish the full checkpoint. The unchanged 25-minute timeout is per job. Earlier run37112494707 remains the unsplit frozen L10–11 workflow and must receive its own terminal status independently.

Independent review and actual execution of the sharded workflow are pending. The goal is shorter wall-clock time without lower coverage. There is no automatic deployment.

The guard additionally checks the frozen196test identity baseline from localbe88612 / remote30d7753 and failedrun37112494707. No historical test identity may disappear; new identities are listed separately. The one corrected assertion does not rename or remove a case. This identity preservation still does not turn the old188/196 result into a pass.
