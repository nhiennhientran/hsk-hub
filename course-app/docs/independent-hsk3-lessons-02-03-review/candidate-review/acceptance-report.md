# Independent HSK3 lessons2–3 candidate review

2026-10-03. PASS for source/data fidelity, independently inspected original artwork, deterministic actual-renderer behavior and production state-adapter behavior on the hashes below. This is not browser, audio-perceptual, publication or release approval.

## Accepted scope

- L2:26activities;57source fields+3optional objectives;23official/31nonunique reference/3open source fields;20text questions;10original SVGs plus separate5-slot2x2 menu;30lexical rows from28printed entries
- L3:29activities;84source fields+3optional objectives;24official/32nonunique reference/28open source fields;20text questions;14original SVGs;27lexical rows from26printed entries
- Total55activities,141source fields+6optional checks,47official keys,63bilingual nonunique references,31open fields,40text questions,24SVGs
- Full original nested IDs, text, Chinese/pinyin/Vietnamese, source prompts/options, grammar examples/explanations, audio pointers,30homework per lesson (25automatic+5writing) and4independent-listening records per lesson are preserved against Git HEAD runtime and frozen author baselines
-357original audio byte identities checked. Protected HSK4/HSK4up original bytes unchanged. Audio listening/timing was not performed

## Source and artwork inspection

Freshly rasterized and opened every textbook PDF22–40 page, answers PDF2–5, appendix PDF186–194:32pages total. Read all8relevant vocabulary boxes. Separate source ordinals/POS and appendix pages/lesson numbers remain correct; no target star/proper-noun entry was invented. 客气 and外卖 split sense rows bind their single numbered source entries;需要 preserves v./n.;员 preserves suf.;张 retains[2,16]. Contextual 一 sandhi/propername Yīxuě and还 huán/hái remain distinct. Source 不用 prints búyòng and is preserved.

L2 personal-order reference correctly states that Wang Yixue’s personal order is unspecified; inventing a dish would not be supported. Three listening+reading topology differences from HSK2 are retained:5questions per text, text4multiple-choice and3pictured dialogues. L2 menu topology/fixed foods/glosses, two full warmup prompts,9grammar responses,10word choices,10picture blanks and1group notes/report task match source. L3 sixwarmup images,11picture blanks,5group responses and21cross-page review inputs match source. L3 textbook word-page split1–7/8–10 differs from official-answer split1–4/5–10 and is retained per field.

Independently rasterized/opened all24SVGs at640x400; source roles/scenes and readable shape relationships match. No clipped content was observed. No copied source pixels, embedded raster/external images, scripts, real card/account digits or issuer logos found. Specific per-page and per-scene observations and byte hashes are in independent-source-pixel-review.json and independent-artwork-pixel-review.json.

## Executed verification

-8,956data/source/baseline/audio-byte assertions: PASS
-1,723actual mountLesson deterministic semantic/event/state assertions: PASS
-156independent source-row provenance renderer/state assertions: PASS
-12asynchronous assertions over9scenarios using real createLearningStore and deferred locks: PASS
-TypeScript check: PASS
-67unit tests: PASS

Actual menu controls retain the title, four source quadrants, fixed bilingual foods and fiveunique associated field labels. Every candidate activity/control and all24figures appears exactly once in its intended section. Unbound L2group support has3figures; field-bound illustrations are not duplicated. Ordinary empty/partial/wrong/correct submissions, nonunique responses, separate checkbox dimensions, independent edits clearing feedback, production confirmed save/fresh store reload/reset/export/import are verified. Non-HSK3 sentinels remain unchanged. Existing15HSK2lessons retain406activities/859fields/198figures; HSK3pilot retains13figures, making211previous assets total.

Source-note consolidation matches allfoureffective Source fields, requires at least2cells, preserves exact source metadata and IDs, and retains individual cell citations for mixed provenance. All9L15rows/18controls and same-page HSK3review behavior were exercised.

## Defect found and repaired

An in-flight submit previously restored feedback after an edit during a deferred storage lock, although checkedAt had been cleared. Original failing evidence is retained in delayed-save-original-failure.json. Integrator repair f3592f… uses submission epochs, disposal signal and exact current record/value checks. Independent recheck passes edit-during-save, newer submit, reversed completion order, repeated identical submit, incomplete supersession, dispose, failed write, independently altered values and removed record. No unresolved source/content/semantic blocker remains.

## Reviewed key hashes

- drafts/hsk3/lesson-02.json: fb80569457449e5365be5cc701c0eb9c1d9a5cf22967f135e8ef8701c282ae10
- drafts/hsk3/lesson-03.json: 718c27d505266543d42e553ba0e844bffedaac77a96379e87df2b50afec2a654
- src/lesson-view.ts: f3592f5053eb088a7e16f6b68f187bd2b5b28de94df904a5fdc6683f04970211
- src/types.ts: 5dd8f531572324ef81fdc83781ec269915db1b8490b27601bc65310f63099566
- src/activity-provenance.ts: 59b711b1d57a5c6d0d61d033356d37830e5c7caefe5ae53988091a47a32cef67
- src/style.css: bddc7ae488fd6cbd2cc0068b1ec2b1b242b7be30433c65db67ff2730a49cc4eb
- tools/verify-activities.mjs: 881b8f8094bfa2d26b9b05c48c0afd325afb05c941570341ceab69ee46813379
- tests/source-menu.test.mjs: 9b4d0ad25a3dec9b1e889efe9924a22321173950994d153e94bfa8161fd1aedd

All24asset hashes plus remaining input hashes and snapshots are in final-reviewed-hashes.json. Source originals remain private evidence, never runtime assets.

## Remaining gates

1. Integrate candidates through the authorized release process; they are still draft-not-in-release
2. Run the new Chromium/WebKit browser suite against the exact integrated commit. Verify responsive320/390/768/1440layout, native focus/zoom, sixwarmup images, threepicture dialogues with exact3+3+4and4+3+4counts, source-menu/native deferred WebLock behavior, real localStorage reload/reset/backup and regressions. Deterministic DOM evidence makes no browser-layout/native-storage claim
3. Inspect actual resulting screenshots. Earlier244CI cases at prior remote commit do not cover this newHSK3/shared change
4. Original word/sentence audio timing and human/perceptual quality remain separate from this byte/source review
5. Publication/remote artifact/production verification remains with integrator, under existing authorization

New browser suite was code-reviewed only. Integrator applied the reviewer’s recommendations: exact L3sixwarmup image/select and4+3+4picture input/image assertions; a populated HSK2L15七/八/九 record is durably saved before the HSK3deferred-lock flow, asserted non-null and then verified unchanged. Browser execution remains pending. This reviewer did not restart services, operate a browser, edit runtime/draft source, commit, publish or spawn reviewers. Writes were restricted to this candidate-review directory.
