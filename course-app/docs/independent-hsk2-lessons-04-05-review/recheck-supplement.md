# Recheck supplement: HSK2 lessons 4–5 and bounded matrix regression

2026-10-03 05:52 UTC. **Passed for content/artwork/interaction-structure integration. All initial findings R1–R5 are closed.** The original hold applied to the initial hashes only; initial report and evidence are retained unchanged. Actual browser/release acceptance remains separate and must use the corrected tree.

## Closed findings

- R1: the clock's default note now says only to use the clock and person's condition, without the time or 都……了 construction. The original `都十点多了` nonunique reference is retained for post-submit feedback. A real-renderer check confirms no initial feedback and confirms the reference only after submission.
- R2: L4's five word-choice fields now have exact source PDF pages `[50,50,51,51,51]`. Each input's renderer shows printed page35 or36 as appropriate, and the group footer shows both 35、36. IDs, options, keys and grouping remain unchanged.
- R3: L4 now renders a semantic 3-row × 3-option survey table, with the original `动词 / 情况1 / 情况2 / 情况3` headings. All nine words remain visible in the correct cells; each checkbox has its original ID and complete accessible verb-plus-word name. Zero selections and arbitrary multiple selections save and restore independently in the same-state remount test. Existing L3 self-assessment retains its `语言点与例句` heading and checkbox model.
- R4: the two changed SVGs were independently rasterized again and their actual pixels reopened. Each trouser hanger and all three bag handles now connect to the rail via visible hooks. The original colors, object counts, bindings and draft status are retained. Evidence is in `recheck-illustration-renders/` and `recheck-illustration-index.json`.
- R5: the author report now correctly says 上去 is numbered4 and 下面 is unnumbered.

## Final L4–L5 rechecks

- 379 independent data/source-key assertions pass again
- 34 real-renderer structural checks across sixteen views pass again
- 42 focused correction/regression assertions pass
- All 44 official keys, all 32 original text-question bindings, ten L4 grammar blanks and eleven L5 grammar blanks remain correct
- All 52 activity IDs and 102 field IDs remain unchanged and reachable exactly once; all 29 figure associations remain reachable
- Each lesson's 30 supplemental homework records remain deeply unchanged, with the original 25 automatic / five manual split
- Video5-1 remains unavailable and is not replaced by text audio5-1; nonunique tasks remain reference/open
- The existing source-parity limits and no-native/no-audio/no-browser certification boundary remain in force

Final draft hashes:

- L4: `ae9f702a19a643429a56d32b065320672a83959bd2b5a97278ccc05fa49180bb`
- L5: `ec7610fe69c2ce7186f9043490006d0d7994c6962c2dcf59b362f140bca4d5d7`

## Additional, expressly requested template regression

After the initial review, the parent requested read-only checks of two other matrix conversions sharing the renderer. This was a bounded regression check, not a new whole-lesson acceptance of L1 or L2.

I independently rendered and opened textbook PDF16/P1 and PDF25/P10. Hashes are in `template-regression-source-index.json`; generated source rasters were removed after inspection.

### L1 travel survey, PDF16/P1

- `:activity:travel-survey` correctly preserves the original three-column `项目 / 关键词 / 回答` table
- The three source row and keyword pairings are `出发时间 / 什么时候去的`, `同伴 / 和谁去的`, `旅行方式 / 怎么去的`
- Three original stable free-text field IDs remain independently editable, saveable and recoverable in an in-memory remount
- The table remains an open personal survey, with no correctness grading

### L2 preference survey, PDF25/P10

The source table uses `情况 / 方式1 / 方式2`, not 情况1/情况2. The first revision combined both options into one context cell. On review, I recommended retaining separate source option columns. The final revision now has `情况 / 方式1 / 方式2 / 我的选择`: the three original source columns plus a digital response column.

- All three situations match the source
- All six option strings remain visible in their exact source columns: 坐火车去/坐飞机去; 回家做饭/去饭店吃饭; 在家休息/去看电影
- Each row retains its original single-choice select and stable field ID, not two independent checkboxes
- All three choices save and restore independently; no correctness grade is assigned
- The current CSS applies a separate compact hidden-label class to non-checkbox matrix inputs and allows narrow selects to shrink. This was source-code inspection only; mobile width/layout remains for the parent's browser CI

`check-template-regression.mjs` passes 42 assertions for these L1/L2 DOM, source-context and state checks. Total final independent automated assertions: 497 (379 + 34 + 42 + 42), alongside actual source/artwork pixel inspection.

## Exact acceptance boundary and next gate

This report approves the reviewed draft content, original schematic pixels, provenance fixes, matrix semantics and deterministic renderer behavior for integration. It does not certify real Chromium/WebKit rendering, responsiveness, keyboard/screen-reader execution, local storage/import/export persistence, perceptual audio, sentence alignment, complete release build or remote CI. In particular, the previously frozen 2–3 CI tree cannot prove the later matrix/template changes passed. The parent must run final browser/release checks on the corrected tree before declaring the complete release accepted.

`final-reviewed-hashes.json` identifies the exact drafts, shared renderer/schema/style/validator files, and bounded L1–L3 regression inputs reviewed. No author draft, production source, or public asset was edited by this reviewer; all reviewer writes are inside this independent report directory. No push or publication occurred.
