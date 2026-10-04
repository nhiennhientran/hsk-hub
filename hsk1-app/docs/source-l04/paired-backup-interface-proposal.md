# Narrow HSK1 two-domain backup contract (design record)

This design was implemented in the source-v2 local candidate. Read REVIEW.md and the frozen verification records for actual behavior, test results and remaining independent/native gates. The live data keys and AppData were not extended. Earlier wording below records the reviewed design, not a separate release claim.

## Identities and missing-domain semantics

- Existing primary key, envelope, backup and exact lock stay unchanged: `ran_hsk1_modular_v1`, `hsk1-modular`, `hsk1-modular-backup`, `ran-hsk1-modular-write`.
- Source key/app/backup/lock: `ran_hsk1_textbook_source_v1`, `hsk1-textbook-source`, `hsk1-textbook-source-backup`, `ran-hsk1-textbook-source-write`.
- Proposed full export: `app: hsk123-unified-backup`, `schema: 2`, existing course list for HSK2/3, HSK1 course with an explicit `domains` array containing exactly named `primary` and `textbook-source` entries, each carrying its unmodified own schema-1 backup. Reject duplicate domains, unknown domain names, wrong edition, null source and invalid historical records. Parse and validate the entire imported composite payload and every candidate/recovery first; mount no confirmation buttons until every domain validates. A late invalid domain must never leave an earlier actionable preview mounted. Old readers safely reject schema 2.
- Existing schema-1 unified or primary-only backup follows the existing primary confirmation path. Source is absent, so source bytes remain untouched; preview explicitly says source records are preserved.
- Present valid empty source means replace source with empty only after the separate count/overwrite preview. Source-only files follow ordinary source store confirmation.
- Keep the old-format export as an explicitly labeled compatibility export excluding original activities.

## Small prepared participant interface

Add only the following internal capability to the existing generic store, reusing its `readEnvelope`, `validate`, serialization and revision/recovery routines. No new event bus, generic transaction framework or replacement of existing store methods.

1. `prepare(preview, signal)`: called synchronously under the already-held store lock; returns an opaque branded plan carrying the store-owned beforeRaw (including null), afterRaw, revision/editVersion tokens and a fully validated in-memory replacement. It must reject disposal, cancellation, dirty/composing drafts not flushed by the host, stale preview, invalid recovery or changed live raw. It performs no writes.
2. `checkPrepared(plan, signal)`: rechecks ownership, lifetime, revision/editVersion and exact live beforeRaw. Only usable for the same store instance. The coordinator cannot pass arbitrary keys or manufacture a prepared envelope.
3. `adoptPrepared(plan)`: after both exact readbacks and finalization, a synchronous nonthrowing update to already-validated in-memory state; no listeners yet. This avoids one observer seeing a half-adopted pair.
4. `publishPrepared()`: notifications after both adoptions, retaining existing observer exception isolation.
5. A strict envelope parser exported only to the paired recovery module validates journal before/after bytes, including all recovery records. It accepts the store's configured app identity, never an imported storage key.

`confirm`/`save`/`restore` keep their single-domain behavior. The coordinator never calls those methods while holding their locks. Preparations are ephemeral, never imported from a backup.

## Fixed coordinator, two keys only

`previewHSK1Pair(primaryPreview, sourcePreview)` captures both editable stores and lifecycle signal. On confirm, acquire the existing primary lock first, then source lock. Recheck both tokens after waiting for both locks and immediately before the journal. If Web Locks are unavailable, fail closed; export still works. Single-domain writes acquire only their existing domain lock.

Pending journal key: `ran_hsk1_source_pair_journal_v1`. Completed paired recovery key: `ran_hsk1_source_pair_recovery_v1`.

Journal identity/schema and allowed fixed keys are validated. It contains transaction ID/reason, exact beforeRaw and afterRaw of each key, and prior completed-recovery raw so uncertain finalization cannot erase the only previous recovery evidence. Imported backup content cannot specify any journal key or operation. The source store currently fails closed if any pending journal exists; the eventual coordinator owns resolution.

1. Under both locks, require no unresolved pending journal and verify the previous completed recovery record.
2. Serialize and exactly read back the pending journal before either live write.
3. Write/read back primary, then write/read back source. A write-then-throw counts only with exact readable intended bytes.
4. Write/read back the new completed paired recovery (both beforeRaw values, plus transaction identity).
5. Remove/read back pending journal; only then adopt both states and publish both observers. If removal fails or is unreadable, retain a blocked state and export evidence. Do not claim unchanged or completed.
6. On a live failure, compare every live value again. Roll back only a value still equal to this transaction's afterRaw. Exact prior absence uses scoped removeItem; no empty-envelope substitution. Never overwrite a third value. Restore previous completed-recovery raw only if its current bytes are still this transaction's intended recovery bytes.
7. If any rollback or readback is unconfirmed, retain journal and originals. New source/paired mutations remain blocked. Existing primary-only tabs are not force-migrated.

This provides recoverability, not atomic visibility: an old tab can observe a primary write before the source write. Its existing lock and raw/revision conflict guard remain honored.

## Startup/recovery states

Under both locks: before/before cancels safely; after/after completes finalization; after/before or before/after conditionally rolls back; any third value/read failure/corrupt journal preserves live bytes and evidence, exposes exports and requires an explicit recovery choice. Recovery needs no arbitrary key access. A completed recovery record is not a pending journal and does not block ordinary source work.

## Required executable fault matrix before merge

Run each case with real valid nonempty old first/latest/history/draft and legacy raw bytes, nonempty source history and both absent/nonempty prior source key:

- Journal set failure, write-then-throw, journal readback failure.
- Each live set failure before write/after write, silent mismatch, readback throw, competing third value.
- Completed-recovery write/read failure, pending journal remove/read failure.
- Rollback set/remove/read failure for each domain and completed-recovery key.
- Process stop after every durable set/remove; fresh startup recovery verifies the four before/after combinations and third values.
- Corrupt journal, hostile arbitrary key, invalid nested recovery, wrong app/schema/edition, duplicate domains and null source.
- Old backup lacks source, explicit empty source, complete new backup, source-only import; exact bytes preserved outside selected scope.
- Old primary tab plus new primary/source tabs; edits before preview, during each lock wait, after first operation. Fixed order/no nested locks. Dirty drafts and IME, dialog close/cancel, disposal and stale tokens cause no mutation.
- Throwing observers cannot turn exact committed readback into a failure or expose a half-adopted pair.
- Chromium and WebKit in modular and unified hosts with save/export/import/reset/reload/history plus old-tab conflict. Test collection and JSDOM do not count as native browser passes.

The proposal's tests are acceptance requirements, not claimed results. The implemented paired suite and its recorded results are listed in REVIEW.md.

## Separately implemented single-domain candidate save

The pilot adds `store.saveCandidate(candidate, signal)` for confirmed activity submissions only. It validates a frozen candidate and rechecks captured editVersion/raw under the existing single store lock, then calls the existing commit without a replacement reason. Failed writes do not adopt candidate history or consume import/reset recovery. The current input is retained first as an ordinary draft. This is not the proposed paired prepared participant and does not perform cross-key transactions.
