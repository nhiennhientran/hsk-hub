# Student-facing backup copy simplification

Previous approved engineering/content tree: `9f305ff88c59f9455aff27d22bfa89d02ea11517`.

This follow-up changes only student-visible Chinese/Vietnamese backup text and the necessary text assertions. There are no persistence, backup-schema, transaction, count, audio, activity-content or scoring changes.

The backup UI consistently uses 学习记录 / 教材练习记录 and dữ liệu học tập / dữ liệu luyện tập theo giáo trình. Students are told what will be replaced, when to save changes or reselect a file, and what to do when another window has changed their records. They are no longer shown domain/key/atomic-transaction/snapshot/write-lock terminology. “30-v1” is replaced by the readable assignment-version label only in UI text; all bank identities and fields are untouched.

Retained safety meaning:
- A failure does not claim the records were unchanged or that every step completed.
- Recovery material is explicitly not a complete backup and must not be imported as one.
- Missing exercise records in an old backup preserve existing exercise records.
- A present empty record category clears the corresponding current category after confirmation.
- Overwrite/reset scope, every current→incoming count, preservation of older original records, available recovery, and the risk of replacing later additions remain explicit.
- Students are told not to clear browser data when a previous operation is unresolved.

`ui-copy/copy-only-proof.json` records a comparison against the previous tree: program structure outside string/template text is identical in all five production files, template expressions are identical, and every ASCII/machine literal is identical. Twelve protected files (including the generic store, coordinator, sessions, source content and all five frozen original banks) are byte-identical. `ui-copy/replacements.json` records the text changes.

Validation includes two new copy checks, the existing10 source-renderer and11 paired/unified-renderer JSDOM cases, both application typechecks, browser-fixture typecheck, and unchanged422 native test collection. The new copy checks preserve all pre-existing test identities. Native browser execution remains an external CI gate; no new native pass is claimed here.

Final local verification for this copy revision: HSK1 unit554/554; course-app unit88/88; source JSDOM10/10; paired/unified JSDOM11/11; both typechecks and browser-fixture typecheck passed. Native collection remains422 (211 per browser;106+105 shards), with all earlier identities retained. Native execution and release approval remain outstanding.
