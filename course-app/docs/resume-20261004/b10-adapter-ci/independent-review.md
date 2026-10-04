# Private VI adapter CI candidate independent review

The authored candidate is accepted within its stated checkpoint scope. No concrete workflow, package-resolution, source guard, native-report format or upload-path blocker was found. The workflow has not been dispatched by this reviewer, and no real native history test was executed.

| Independently executed check | Result |
| --- | --- |
| Native result guard units | 12 / 12 passed |
| New CI fixture TypeScript check | Passed |
| HSK1 collection with HSK1 Playwright CLI | 3 logical cases / engine; 6 collected |
| HSK2/3 collection with course Playwright CLI | 8 logical cases / engine; 16 collected |
| Actual locked Playwright JSON format probe | One explicitly synthetic no-Page/no-browser test; expected report accepted |
| Actual locked Playwright collection JSON probe | Rejected by the verifier |
| Real native history/browser cases executed | 0 |

HSK1's wrapper imports its HSK1 original config and uses the HSK1 CLI/test package, avoiding a second Playwright package in that test process. HSK2/3 uses the course-app package. The inspected locked 1.62.1 reporter emits exactly the `metadata`, `id`, `repeatEach`, `retries`, outcome, result errors/retry and stats fields consumed by the verifier.

The checkpoint recorder requires the actual checkout HEAD to equal `GITHUB_SHA`, compares official and extended source vectors with HEAD Git blobs/modes, and rechecks source/build bytes after testing. The after guard requires all 18 successful command records, matching log bytes and exact 3 + 8 passed cases per engine; collection, skips, retries, errors and missing records cannot establish acceptance.

The consumer modes are accurately scoped: HSK1 uses its auth-free Vite source harness on 18911, while its dist is separately built/hashed; HSK2/3 consumes the actual compiled preview on 4179. The artifact paths include the true logs, records/manifests, result JSON, native output/screenshots and compiled HTML/JS/CSS/JSON consumers. This is a partial compiled-consumer archive, not a claim that every media/package byte is uploaded or that the production site is accepted.

The candidate must be committed before real private CI so its source vector equals the tested HEAD. The real CI still needs to generate before/builds/after evidence and execute all 22 native cases across both engines. Publication remains unapproved and no deployment operation exists. Exact candidate hashes, probe source/report bytes and classifications are in `independent-review.json`.

The final read-only guard refresh confirms that `before` rejects any defined `HSK_BROWSER_PATH`, so the recorded default installed launch entry matches the native configuration. The final prerequisite set includes `font-install`, for 18 required command records. Syntax and workflow structure checks passed; no extra native or formatter probe was run for this final delta.
