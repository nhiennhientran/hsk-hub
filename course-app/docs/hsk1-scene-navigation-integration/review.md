# HSK1 listening scene navigation compatibility

The in-place same-lesson text route update retains the current hidden-text/listening controls, cancels obsolete audio and preserves focus. Leaving the lesson/text view or reloading resets only the transient controls. No new persistent key or AppData field is added. Existing navigation still uses the established route record.

An independent actual bridge/lifecycle/renderer probe found a stale active-text link in the original author candidate: after scene1→2 the current-section link still targeted scene1. The bounded integration repair updates this href only after the same-lesson route update is accepted. The original candidate failed the added assertion; the repaired candidate passes with nonempty prior homework and legacy records.

Local339 HSK1 and112 course tests, both builds and browser-fixture types pass on the accepted506 development base. The actual bridge/lifecycle JSDOM probe passes. Native regression is pending:8 cases in the unified host plus8 standalone cases (four per browser per host). The workflow explicitly runs the standalone cases on shard2 and collects their independent screenshots/report. These are not counted as passed until actual CI execution.

Keep the original30-v1 question bank and all fingerprints unchanged. No source-pilot or paired-backup implementation is part of this patch.

The existing glossary-star test now captures nine word-dialog screenshots per browser for follow-up visual sampling. Its identity and all content/no-record-change assertions are retained. No student data is used in fixtures.
