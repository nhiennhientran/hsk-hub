# B10 HSK2/3 adapter independent review

Status: bounded implementation accepted after one concrete editorial guard fix. Both active registry entries remain `null`; no official Vietnamese textbook item is active.

The independent review found that an editorial anchor with `directCounterpart:false` could still carry an alleged printed book page. The exact pre-fix adapter was `2d0c0c82de128388af070bb4d93caa499566d58be9d0cb59d0a43fe2545a1060`; the separately constructed synthetic probe returned `accepted:true`. The author then rejected both `printedPages` and `officialZhText` in the editorial branch. On the final adapter `5f2d9fbd6751655fc95c161b3c93637715882960d25721211936a3f3d8420c0f`, both independently constructed probes reject with `editorial source branch`. No source or author test was edited by the reviewer.

## Executed checks

| Check | Result |
| --- | --- |
| Targeted adapter unit tests | 40 / 40 passed |
| Application TypeScript check | Passed |
| Scoped native fixture TypeScript check | Passed |
| Native fixture collection | 8 logical fixtures; 16 Chromium/WebKit cases collected |
| Native browser execution | 0 cases executed; both default executable paths absent |
| Separate editorial page/quote probes | 2 / 2 rejected by the expected branch |
| Raw HSK2/3 lesson, lexicon and index byte comparison | 36 / 36 equal to Git `835e5bd41045655cc2724ba2ba59235064ff92cf`, rechecked at final review |

The source read and tests support trusted SHA-bound proof/consumer validation, atomic VI-only clone projection, original source/answer/order preservation, and frozen old question snapshots. Listening saved answers now come from the actual attempt, legacy missing snapshots cannot fall back to current questions, and current transcripts are clearly presented as a separate current reference. Homework receipts retain first/latest snapshots and raw legacy response values, while identifying their course title as current content.

## Scope limits

Global `Bài khóa` / `Bài khóa N` UI literals require the separate UI wording task. The inspected raw metadata and `illustration.title` fields have no current source consumers; the illustration renderer uses `alt`, `description` and `label`. This is no claim of full website Vietnamese coverage.

The 16 browser cases are collected, not executed or passed. This review does not approve real textbook quotations/transcriptions, activate a revision, certify active asset loading in Vite, reuse old CI for the new source, or approve publication. Exact input hashes, proof logs and all 36 raw source checks are preserved in `independent-review.json`.
