# Native fixture and screenshot repair

The error-context snapshot explicitly showed the classroom entry dialog in the uninitialized second tab. The test now gives that tab only the original session entry precondition, preserving all persisted-data comparisons. The lock barrier is acquired before the action and the saving state is asserted before cancellation. No missing callback is silently ignored.

WebKit cannot capture an image above32767 pixels. Every source activity and table is now captured separately with a manifest, rather than truncating a full-page image or removing assertions. Every horizontally overflowing numeric table is keyboard-scrolled to its final column; overlapping measured slices cover every column of all three numeric tables.

All600 test identities remain unchanged. The prior failed run and exact counts are in review.json. Runtime files, lesson data, storage schemas, keys and actual business assertions are unchanged. A new full native run remains required.
