# Separate A7/A8 CI gates

The accepted author bundle is unchanged (`freeze-manifest.json` SHA256 `a91404a54eafa0b19250d37a8ac47be3086119a23b944265ae7f3bb38f5dfc39`). Its independent review is `independent-qa/independent-review.json`, SHA256 `4fee9ce7cd02a7a2653fa285e3f68b31b77ca85dbe86d44bda43b55c446fe486`. This supplement supplies only the requested fixture tsconfig, stage list and separate CI commands.

Use a separate two-engine job from the source-gallery shards. Install both lockfiles, the selected browser and Noto CJK. Build `course-app` for the formal 64 and `hsk1-app` for the retained standalone checks. The following commands run from `course-app/docs/resume-20261004/flow-compat-review`; `${BROWSER}` is `chromium` or `webkit`.

```sh
node ../../../node_modules/typescript/bin/tsc --project tsconfig.candidates.json
node ../../../node_modules/@playwright/test/cli.js test --config=playwright.flow.config.ts --project="${BROWSER}"
cp native-flow-results.json formal64-${BROWSER}.json
```

The default main config collects exactly **64** formal cases in five files. It does not include the four old diagnostic assertions. Default asset root is the checked-out `course-app/dist`; `FLOW_DIST_DIR`, `FLOW_BROWSER_PATH` and `FLOW_PORT` are optional. A collection-only command must use `--reporter=list` to avoid overwriting a result JSON.

Run the **34 retained standalone HSK1 definitions** separately from the **one explicitly test-authorized fresh-context backup case**. The original password-dependent case stays unchanged and is excluded from this isolated backup-flow job. The filter uses that test's full, unique title without anchors because Playwright matches the project/file-prefixed full title. Collection independently verified 34 retained cases per engine with this filter.

```sh
node ../../../../hsk1-app/node_modules/@playwright/test/cli.js test --config=playwright.hsk1-retained.config.ts --project="${BROWSER}" --grep-invert='a downloaded nonempty backup restores identical data in a new context and one import-before recovery'
cp hsk1-retained-results.json retained34-${BROWSER}.json
FLOW_HSK1_MATCH=hsk1-fresh-backup.retained.ts node ../../../../hsk1-app/node_modules/@playwright/test/cli.js test --config=playwright.hsk1-retained.config.ts --project="${BROWSER}"
cp hsk1-retained-results.json authorized-backup1-${BROWSER}.json
```

The retained config defaults to `hsk1-app/dist` and pins its runtime to the same installed HSK1 Playwright copy as the retained definitions. The separately supplied session fixture is explicit and does not certify password entry. A normal CI job can independently run the untouched original 35 with its existing authorized password fixture; do not conflate that run with the 34+1 above.

The synthetic all-48 data roundtrip is a separate Node check; it is not a native browser result:

```sh
node --experimental-strip-types --test all48-state-roundtrip.candidate.test.mjs
```

For verified assembled output, `FLOW_PACKAGE_ROOT` must point to the assembly owner's real directory. `playwright.legacy.config.ts` uses that directory and defaults to no network substitution. Its three checks are new nested defaults/deep links and one protected old-route/history/H4-stage check. A normal-network CI job checks the original Pako CDN chain; `FLOW_LEGACY_LOCAL_PAKO=1` is only the separately labeled local isolation condition backed by `legacy-local-dependency.json`. Never silently set it in the normal-network acceptance job.

Upload this directory's result JSONs/logs, six mobile PNGs, retained test screenshots, and native error contexts. Save the per-run reports under the separate names above before the next command writes the default reporter filename.

`STAGE-FILES.txt` lists the concrete repository-relative accepted artifacts and CI fixtures; it includes the independent reviewer evidence and explicit failed/blocked records. Root can stage exactly those paths with `git add --pathspec-from-file=course-app/docs/resume-20261004/flow-compat-review/STAGE-FILES.txt`.
