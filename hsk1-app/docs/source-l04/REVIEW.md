# HSK1 L4 source-v2 and paired backup candidate

Base: `47e599837128843c77154db59ef8d2f8937f3a52`. Supersedes source-only candidate tree `f2e8c158124cc196e45c4178703b3c6b34a921d4`. Local-only candidate for independent content/engineering review. No merge, upload, push or publication. No expansion beyond lesson4.

## Content review corrections

The author inspected textbook PDF33–41, answer PDF1–2, and the independent high-resolution family crop. The original family photo has **six people, three larger and three smaller**. The new SVG now has six independently countable figures; reference 六口人 / sáu người, explanation and asset SHA all match. Warm-up3 alt is neutral (three people behind desks, two hands raised); SVG titles no longer name students or a teacher. Printed xuéshēng, yí gè / liǎng gè / sān gè and liǎng gè rén are restored. Cloze2/4 Vietnamese explains the natural sentence meaning and explicitly says the Chinese blank does not correspond word-for-word to Vietnamese. 呢 and the question-specific open-dialogue hint were refined as requested.

The corrected activity revision is `source-v2`. Prior source-v1 records remain structurally readable as historical context and are never silently reinterpreted as the revised activity. The original textbook,30-v1, stage2, stage3 and legacy-exercises bytes remain frozen.

Scope remains21 response cards,24 inputs,10 hand-authored source-mapped SVG schematics,1 unavailable bonus reference, the original sparse10×10 numeric grid (36 examples/64 blanks),6 larger-number examples and6 二/两 examples. All15 objective blanks retain original answer-key provenance. The8 open picture/grammar blanks have non-unique, ungraded bilingual references; pair work has a self-check. Feedback appears only after confirmed save. Listening uses the existing whole-scene IDs/tracks with neutral labels; no listening/timing verification is claimed.

Source PDF SHA256: `25d1aad102e4179307b5bc4f932927bbd244b3f4dd53edeb6cfd4dbbb8d4f2ba`. Answer SHA256: `9e783c9deb889231a778d6776b65dbc04fc734eeca0fdfda1c9d99eb793104e5`. No complete PDF or textbook photograph is added to app assets.

## Implemented storage boundary

The primary `ran_hsk1_modular_v1` envelope, AppData/schema,30-v1 IDs/fingerprints/scores and all legacy keys remain unchanged. Original activities use `ran_hsk1_textbook_source_v1` with independent immutable semantic snapshots/history. Single-domain `saveCandidate` confirms immutable submissions only after exact readback; a failed attempt remains a draft and cannot become history through ordinary autosave.

The generic store exposes a small opaque participant capability, scoped to its store/coordinator instance. Preview and prepared tokens cannot be cloned, moved between instances/scopes, reused or adopted without verified readback. Revision/raw/editVersion/dirty state are checked. Both in-memory domains are adopted before either observer is notified. Existing ordinary save/confirm/restore semantics remain intact.

The HSK1-only coordinator knows exactly two live keys and acquires the existing `ran-hsk1-modular-write` lock before `ran-hsk1-textbook-source-write`. It never reacquires a store lock through `confirm`. No safe Web Locks means no paired mutation. Existing old-program tabs continue to use the original lock and raw guard; new primary/source sessions block ordinary writes while a pending paired journal exists.

Durable protocol:

1. Validate both candidates and all recovery records; write and exactly read back the pending journal.
2. Write/read back primary, then source, rechecking held state between them.
3. Write/read back the separate completed paired recovery snapshot.
4. Remove/read back the pending journal, recheck both domains, synchronously adopt both, then publish.

A write-then-throw is successful only with exact readable intended bytes. Rollback restores only this transaction's own afterRaw; a third value is never overwritten. Genuine prior absence uses removeItem, not an empty envelope. An uncertain final journal removal is handled conservatively; before rollback, the journal is re-established if it is absent. Completed recovery also retains pre-operation evidence after a durable final removal. Quota failure does not trigger a smaller destructive fallback.

Startup handles before/before, after/before, before/after and after/after; a third value, invalid journal, invalid nested recovery or unreadable state stops automatic recovery and preserves evidence. That conflict stays blocked and requires a human-reviewed recovery decision; the app offers rescue exports and does not silently choose an overwrite.

This is **recoverable cross-key replacement, not atomic visibility**. An unmodified old tab may observe the first live write before the second.

## Backup and UI contracts

- Modular full export: `hsk1-complete-backup`, schema2, explicit primary/textbook-source domains with their unmodified own schema1 backup payloads.
- Unified full export: `hsk123-unified-backup`, schema2; HSK1 explicitly includes both domains, HSK2/3 retain their own payloads.
- Old primary-only/schema1 imports preserve current source bytes. Null/malformed/missing domains are invalid in a new complete payload. A present valid empty source domain is previewed as an explicit clear.
- Compatibility exports are visibly labeled as excluding original source activities.
- A pending/unreadable/stale/dirty snapshot or missing safe locks generates a separately identified `consistent:false` rescue packet rather than pretending to export a coherent full backup. Rescue packets contain current raw evidence and separate drafts and are not accepted as ordinary backups.
- Separate primary/source/both reset scopes and paired undo are available, with current→incoming counts and explicit overwrite/recovery descriptions. Legacy browser keys remain untouched.
- Both modular and unified UIs use the same paired panel. The unified top-level importer validates the whole file before mounting any confirmation action. File selection epochs and per-selection abort signals prevent late reads/errors, detached old controls and queued old confirmations from applying after reselection or close. Successful writes are not later described as unchanged.

## Verification

See `verification-v2.json`, `paired-renderer-result.json`, `renderer-review-result.json` and `native-collection.json` for the frozen results.

- Full HSK1 unit suite:552 passed (335 old,16 source,201 paired).
- Course-app unit suite:88 passed; no original test identity deleted or renamed.
- Both builds/typechecks and new browser fixture typecheck passed. Existing bundle-size warnings remain.
- Source actual-component JSDOM:10 cases. Paired/modular/unified real-renderer JSDOM:11 cases, using real nonempty stores for paired data flows, plus synthetic providers for file-selection race isolation. These are not native browser/pixel results.
- Native unified collection:390 original identities retained,32 new cases,422 total (211 per browser,106+105 shards). Modular wrappers add30 new cases. Collection only, not execution.
- The201-case paired suite covers both live domains independently absent/nonempty; every journal/live/recovery/final-remove durable step with before-write failure, write-then-throw, readback failure/mismatch and crashes; rollback write/remove/read/crash failures; all four startup combinations; third values; invalid nested recovery/grades/arbitrary journal fields; old lock competition; dirty/IME/cancel/dispose/stale revisions; observer exceptions; opaque token scope and one-use adoption.
- All10 corrected SVGs were rasterized and inspected. Native Chromium launch remains blocked by process-singleton socket permissions, and the cloud browser rejects the local preview. No native Chromium/WebKit pass, full responsive page screenshot, audio listening pass, remote CI result or release readiness is claimed.

## Integration notes and remaining gate

New modules are narrowly HSK1-specific. BookLesson is unchanged. HSK2/3 only share the tiny card/feedback-epoch helper; preserve the separately reviewed optional-field/feedback-note increments when applying to the newer integration tree. No listening-switch patch was duplicated.

Independent content recheck and engineering review must approve this corrected tree before upload to the authorized test branch. Then execute all old and new Chromium/WebKit suites in both hosts, including mobile layout and real nonempty-record backup/recovery flows. Do not merge/publish or extend lessons merely because local unit/JSDOM checks pass.
