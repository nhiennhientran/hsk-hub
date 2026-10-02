# HSK2/3 reviewed content checkpoint: unit3 and later complex lesson

CI run37060569230, source835923270466a8748346be62b53ec0429a81db61, completed2026-10-02.

- Exact candidate passes Chromium and WebKit: each55 raw course tests, four packaged deployment-path tests and six HSK1 native-media regressions. Zero skips, unexpected failures or flaky tests in all six JSON reports.
- Covers all HSK2 lessons1–15 and HSK3 lessons1–9 plus18:750 homework items, with isolated exact receipts. This does not claim acceptance of unreviewed or unavailable HSK3 lessons10–17.
- Inspected32 screenshots of HSK3 lesson18 at320/390/768/1440: narrative, optional pinyin, grammar and the12-row unit16–18 review in both engines. Text wraps without horizontal overflow; pinyin visibility changes correctly. The preceding candidate's four failures per browser were a selector that counted an instruction paragraph as a review row. The permanent fix uses semantic table-row attributes and still requires exactly12 actual rows.
- Downloaded artifacts and verified ZIP SHA256: Chromium11250815673 fe0ed23da215f8fd4949b3e9e22d960f9b7646aab152ffaaa64aa3cd2ee1f1bc; WebKit11250641248 8f77a40ec0beb9c450b6713637dae68c9b88272345ceb96f775eaeb59897c55e; frozen-code11249674244 b43c60c28bb25a13ad16e80a344a5701018a6b7ffead4740f130d1c4b9376779.
- Restored297 exact manifest-listed package files plus the release manifest using264 hash-bound original local MP3s. Every byte checked; no rebuild. This is a pilot artifact, not a final release.
- Production remains unchanged. Final full33-lesson frozen release, full-site regression and online verification remain required.
