# Shared engine and HSK2 1–3 pilot acceptance

Frozen CI run: https://github.com/nhiennhientran/hsk-hub/actions/runs/37042775656
Source commit: `eef81e65f128bf8baf9c093d602034953686db28`
Tree: `e2b906ef9ac47d1754aa6e15843b619976237828`

- Shared-course12 unit tests and HSK1 333 unit tests passed; type/content/build and HSK1 release architecture checks passed.
- Chromium19/19 and WebKit19/19 course browser tests passed without retries/skips. Each also passed6/6 HSK1 native-audio regressions on the same candidate's frozen HSK1 artifact.
- All90 pilot homework items acrosslessons1–3 were answered through UI, including ordering, listening choices, Vietnamese translation and manual writing. Automatic totals25 perlesson, separate manual5 with no automatic score. Exact first/latest answer text, simulated composition, save failures, emergency export, backup preview/cancel/import, reset/recovery, legacy nonempty data, multitab conflict, browser history and refresh covered.
- Fixed two actualbrowser issues: WebKit MP3 duration moves0→positive ontimeupdate without another durationchange, and redo form replacement races asynchronous save. Tests require observed native-playing plus usable metadata/clock; empty/corrupt and bounded-segment failures remain errors. Redo immediatelyretires old controls, publishesnew form before saving, never replaces newtyping after an earlier save finishes.
- Eightscreens inspected from this run: front320/1440 and back390/768 ineach engine. Fronts contain Chinese only; back shows pinyin/Vietnamese; mobileone column, tablet2columns, desktop3columns; no horizontaloverflow. Selection screenshots also captured by tests, notall visuallyinspected inthis checkpoint.
- Chromium evidence ZIP sha256 `e54952e66461a662b97c8cbaf648d0e89f0216011df5d46dff4f954331ce966f`; WebKit `5933abaff26b92d4f74e3832f44a0ccadfc8cfe3b380defb44eb8b9ff2d1f2e9`.
- Frozen courseartifact ID11243305488 sha256 `3f98c9e0d3f74b56b3c4c90de470ad9ccb736873e440ce443e002de2801c1686`; HSK1regression artifact11243310408 sha256 `a513f540259a959a7d7cca79a21bea6c3053d0264f2128186cf343cb77b361cf`.

This closes phases3/4 pilot gates only. It doesnot certify33 lessons, physicaldevice IME, full human listening/nativeVietnamese review, final live deployment or unchanged finalcandidate regression. Production remains unchanged. Whole-edition release requires phase11 frozenartifact and phase12 live acceptance.
