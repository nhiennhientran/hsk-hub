# Additional L4–5 native browser cases: independent code review

Accepted source/readiness code-review candidate: `/tmp/hsk3-lessons45.spec.ts`, SHA256 `d11b72e05d351b582f5a9d06c40cb1b8840a9d556ebfa755c921cb998409001e`.

The untouched source snapshot is `browser-candidate-source.ts.txt`. The review-only executable copy substitutes the exact frozen draft JSON fixtures and adjusts relative helper imports; it does not modify test bodies or expectations. This lets source tests be typechecked/collected before runtime integration. The review-only config has no web server or browser execution. It collects24 cases,12 per engine. Combined expected future coverage is268 retained+24 additional=292 cases, subject to integrator collection after actual placement.

## Completed inspection

- Four widths320/390/768/1440, both lessons, all seven sections and four text scenes retain exact source activity inventories
- Reported lazy-hanzi ordering flaw was repaired: await mode=display immediately after openLesson, before activity enumeration, overflow checking, image enumeration or screenshots
- Every normal navigation uses the reviewed exact scene/activity/figure readiness gate; each field group is complete before filling/enumeration and uses the correct source-kind button
- L4 image counts1/1/0/1; L5 counts1/3/1/1. Warmup6 selects/photos each; source-specific picture blank counts3/4/4 and3/3/4. No uniform or invented image assumptions
- Both lessons' exact two bilingual 图片说明 paragraphs remain one collapsed hints container after all3 picture-dialogue activities; every source group is already counted before `.all()`
- L4 grammar1 and3 groups/explanations/examples and grammar2 cross-page notes have explicit expectations; text3 official answerPDF5/6 split is checked
- L4 all11 independent nonunique picture responses plus one open travel plan save and reload; no automatic reference grading
- L5 actual4×2 table, all printed first-row positive/negative frames and 最近 gloss; all8 values save/reload; focused horizontal region receives ArrowRight and must scroll without viewport overflow
- L5 native backup/download/change/scoped-HSK3-restore uses verified current backup UI labels. Actual downloaded bytes are reimported; restoration is scoped to HSK3 and all8 original values checked after source/activity readiness. It does not claim a new reset path
- L5 all4 grammar groups/13 fields and all3 distinct text2 figures are explicit. Two word-bank values, official answerPDF7 and first bank source44/44/45/45/45 are checked, then10 correct results must survive reload
- Missing culture/video states and 又 tip remain explicit. No audio substitution, fake storage success, fixed sleeps, test removal or intentional race masking

## Typecheck and collection

Strict test-only TypeScript check passed with `types:["node"]`, required for the candidate's newly added `node:fs` download reader. The initial test-only config without Node types failed; the explicit Node type environment resolves that infrastructure issue without changing assertions or runtime compiler settings. The exact passing config is `browser-candidate-tsconfig.json`.

`browser-candidate-collection.log` proves24 additional collected identities. It is not a browser execution result. Actual source fixture publication status, native dialogs/downloads, image loading, browser layout, keyboard scroll, storage and restored UI remain final GitHub CI gates against the integrated commit. Local browser execution was explicitly blocked and was not attempted or bypassed.
