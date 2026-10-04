# Independent review of the two sentence overlay

The final frozen integration is accepted for exactly two machine-reviewed source-frame sentence fragments. It preserves the old full manifests and authority byte for byte, all 61 word clips and 13 word holds, and all 95 previous actual sentence fragments. The new total is 97 actual sentence fragments: 79 source-line records and 34 child records, counting only single-sentence lines plus children.

| Accepted target | Original source frames at 16 kHz | Requested original MP3 range | Source ordinal |
|---|---|---|---|
| HSK2 L4 text 2 line 3, 因为我喜欢白色啊！ | [159680,197921) | 9.98–12.3700625 s | 1 |
| HSK2 L5 text 2 line 8 sentence 2, 你们别客气，快坐吧！ | [572480,614240) | 35.78–38.39 s | 2 |

The L5 parent turn and its first sentence receive no precise playback button. 颜色 retains the whole vocabulary-track fallback; no repetition count or single-pronunciation word clip was invented. Every other candidate retains its previous fallback. Both low-probability raw prefixes are retained unchanged. Five explicit glyph mappings apply only to observations; textbook Chinese and pinyin are unchanged.

The independent probes passed 30 source/positive checks and rejected 81 mutations, including matching alterations to both the overlay and authority. The code pins the complete authority snapshot, the prior independent review SHA, exact IDs and sample ranges. The old complete-coverage validator and merge bodies remain byte-identical. 18 necessary old/new unit cases, source TypeScript and browser-fixture TypeScript also passed independently.

A real asynchronous loader defect was found and repaired. Before repair, a concurrent call returned the already registered old cache while the first call was still awaiting the new digest. A newer route could consequently render without the two accepted buttons. The final loader shares its in-flight promise. Independent actual-body probes confirmed that concurrent callers wait for the accepted or rejected gate. Bad checksums and optional overlay import failures preserve old clips without exposing new ones. Unknown and invalid legacy inputs continue through strict complete validation.

The final build loaded index-DHIMbq_c.js and produced 4 actual local Chromium passes. Its two first-play event records used the correct original MP3s, started unmuted at 9.981061/35.780907 s, and paused with UI ended at 12.37009/38.390348 s. The passed fixture also checks source ordinal 2, parent/sibling exclusion, replay, seek-to-end, explicit stop, lesson navigation/back, color fallback labels, and checksum-failure fallback availability. The portable report and 4 decoded original attachments were independently checked byte for byte.

Local WebKit, physical devices and human/native-speaker listening were not tested. Browser clock observations do not certify sample-perfect hardware playback or pronunciation/tone. This review approves neither the remaining ASR candidates nor a broader language audit or deployment.

The machine-readable final inputs, hashes, checks and limitations are in [partial-overlay-review.json](partial-overlay-review.json). Reproduction scripts and original observations remain beside it. The pre-repair concurrency counterexample is retained separately.
