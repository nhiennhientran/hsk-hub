# HSK1 restoration production acceptance

- Approved runtime: `4ec260f9b7b08b793cd12e589fd5bcf1c301718f`
- Build ID: `397e792021c28a36214868d475ef6c3f01cde06cf993f86eb466de58ca1ea5d3`
- Production commit: `f7127ccd656f9ce49ebb05673625ecd991e26403`
- Recovery: `f7d87df013d38613c11326088f27dff26532cc90`, branch `backup/hsk1-pre-legacy-restoration-20261002`
- Live URL: https://nhiennhientran.github.io/hsk-hub/new-hsk1/hsk1/index.html
- Pages success: https://github.com/nhiennhientran/hsk-hub/actions/runs/36988318797
- Site QA success: https://github.com/nhiennhientran/hsk-hub/actions/runs/36988320086
- Live checks: https://github.com/nhiennhientran/hsk-hub/actions/runs/36988536520

The user reviewed the actual bilingual preview, then authorized production replacement. The exact frozen artifact was published without rebuilding. Production was re-read immediately before a non-force fast-forward. Every path outside `new-hsk1/hsk1/` remained identical. Inside that directory, 39 frozen paths were added/replaced and 23 obsolete previous-manifest generated assets removed; 374 unchanged frozen files were reused. Classic source/history files and the architecture checker were preserved.

All 412 public files and the manifest itself were independently verified locally against the frozen artifact. Live verification additionally fetches each file, compares bytes and SHA256, checks genuine 404 handling, and runs normal-login production-path journeys in disposable synthetic browser profiles. It does not seed credentials/learning records, intercept network responses or mock media clocks. No existing learner profile is opened, imported or reset.

The extra restoration journey verifies the original translation-choice task grades and survives reload, pilot writing stays manual with exact answer text, current homework/listening remain separate, Previous/Next/Skip work unrated and persist, pinyin search and examples work, and Chinese/Vietnamese mobile controls plus first-word placement render on the actual site.

Final live run 36988536520 passed: Chromium 4/4 (27.7 seconds), WebKit 4/4 (42.1 seconds), retries 0. Both fetched all 412 actual public files and compared the manifest bytes. No failures/skips/flaky results were reported. Verification source is `226eb6c8f38a69851ad44692f5ef249156f1f758`; it changes only the verification workflow/test and expected manifest, not the published runtime.

The production-triggered official-audio release audit also passed: https://github.com/nhiennhientran/hsk-hub/actions/runs/36988320163

The prior complete frozen-preview validation is 263 unit tests and 130 browser + 3 strict release checks per engine. See [legacy-restoration-acceptance.md](legacy-restoration-acceptance.md) for 480 original-entry accounting, exact build identity, visual checks and boundaries.

Physical iPhone/Android, real system IMEs, fresh human per-question listening, new complete teacher linguistic review and installed-device TTS quality remain NOT RUN. No production rollback drill was performed. A code rollback does not guarantee backwards-readable new exercise progress; preserve all data keys and exported backups.
