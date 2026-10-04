# HSK2 L4–6 independent ASR pilot review

Decision: accept the actual small/medium evidence provenance and printed Chinese target context. Do **not** certify or promote any raw endpoints as precise clips. Current production-approved count is **0**; current honest fallback remains the original whole vocabulary group or whole text track. Two sentence targets are prioritized for an additional actual crop verification, not approved.

This review reads the unchanged author inputs. It does not modify production, author transcripts, source lessons or audio. There was no human listening, native-speaker audio review, device test, or full Vietnamese translation alignment.

## Actual evidence

| Evidence | Independent result |
|---|---|
| Small CI run 37217540172, commit b32215e5990c3d9673f6fb0f8c27e804c062b6e6 | Actual ZIP SHA/CRC and all 29 expanded files verified |
| Medium CI run 37218301490, commit 5b913cad4f7c20bc991b34e9ec182d6b006f2000 | Actual ZIP SHA/CRC and all 29 expanded files verified |
| Script / dependencies | Worker script SHA 6c32b719… and requirements SHA 03008384… match the committed small-run blobs and both actual runs; all 26 pinned package versions checked |
| Input audio | All 24 original MP3 SHA/bytes checked; all 24 locally decoded float32 16 kHz mono PCM SHA match worker evidence |
| Model | Exact requested/actual snapshot revision checked: small 536b0662742c02347bc0e980a01041f333bce120; medium 08e178d48790749d25932bbc082711ddcfdfbc4f; actual CPU int8_float32 recorded |
| Model file hashes | Four SHA values were recorded by the verified worker. Model binaries are absent from these artifacts and were not independently rehashed here |
| Options | Both runs have Chinese, transcribe, beam/best-of 5, temperature 0, word timestamps, VAD off, previous-text conditioning off, prompt/prefix/hotwords explicitly null |
| Source separation | Chinese is saved in source-comparison-input.json and passed only to the post-ASR matcher; full original PCM alone is passed into transcription |
| Raw comparison | 477 independent provenance/target/occurrence checks pass for each run |
| Actual probes | All 100 small raw-range WAV files match the exact quantized sample slices of the verified original PCM; source SHA/range/header/sample count checked |

A successful run and a source-identical WAV prove evidence integrity. They do not prove that the cut contains all and only the intended utterance.

## Printed targets

The original Chinese HSK2 PDF SHA 3a544d951502f8a86137981bb2f60812acfcca0577618ce8f4ff023326cc71ec is not locally recovered. This review therefore does not make a new visual certification of that PDF. Root authorized the currently uploaded official Vietnamese edition as additional Chinese-context evidence. Its SHA is **6465777a77f8d9cb0d29b47f00b36a8e9e9ff627509f0f02a9909c7aaeaa231b**; it has 162 pages and printed body page +14. Existing source objects retain their original edition/page identity.

I visually read the actual new-edition pages 44–49, 52, 54–57, 61–66, using CropBox-aware page rendering. These 17 pages cover all 12 text passages, 12 vocabulary audio labels, Chinese lines and word heads. All 146 target objects have the expected Chinese wording, printed context and track identity.

Counts must keep their grains separate:

- **51 stable vocabulary sense rows** = **47 numbered printed vocabulary entries** + unnumbered **面** nested under **下面** + three extra sense rows for **快、跟、画**. There are 48 physical lexical heads including that subentry.
- **63 source lines** include 51 single-sentence lines and 12 multi-sentence parent lines. The multi-sentence lines yield 32 child sentences, so there are **83 sentence units**.
- 51 words + 63 line parents + 32 child objects = **146 display target objects**. Parent and child counts are not independent recordings.
- Two senses sharing a single accepted pronunciation may reuse one clip after approval; this does not create a second localized recording. The current 快 rows share one raw interval. 面 has no independent whole-ASR-word endpoint and cannot borrow a guessed sub-character time.

No Vietnamese wording was audited or changed in this task.

## Recognition and boundary outcomes

| Strict unique raw endpoint targets | Small | Medium | Unique in both |
|---|---:|---:|---:|
| Vocabulary sense rows | 39/51 | 31/51 | 28 |
| Source lines (including multi-sentence parents) | 46/63 | 46/63 | 43 |
| Multi-sentence child objects | 15/32 | 27/32 | 15 |
| Printed sentence units (single lines + children) | 55/83 | 65/83 | — |

These are textual/model-endpoint candidates, **not** accurate-cut counts. Small's 39 word rows contain only 38 distinct raw intervals because the two 快 senses share one interval. The author boundary producer explicitly holds 74/100 small unique targets: 67 have active energy at a raw cut edge, 16 have a token probability below its 0.5 triage threshold, and 画笔 contains another printed 画 observation. Reasons overlap.

Independent model comparison adds material concerns:

- In medium **H2 L5 T2**, there are 153 raw words, **124 zero-duration words**, of which **119 have probability >0.9**. The text loops 上来 and appends 中文字幕组. Segment compression ratio is 18.5357; the appended segment's no-speech probability is 0.84294. High reported token probability does not rescue this observed failure.
- The worker's observation diagnostics permit start == end and therefore report no invalid time indices for this track. The exact matcher rejects zero-duration spans. These diagnostics must not be relabelled as a zero-duration-free result.
- 小/中模型 agree on the text 画笔 but place it at **6.60–9.70** and **8.78–10.86** seconds. Small also uses its initial 画 endpoint for the separate printed 画 sense. Source order and waveform/repetition context remain unresolved.
- In L4 T2 商场 has minimum small probability 0.111; L4 T4 因为 has 0.198. In L5 T4 爷爷, small is 3.22–4.64 and medium is 2.92–5.94 with medium minimum probability 0.100. These cannot be waved through by string equality.
- Waveform-only inspection of all 12 vocabulary tracks shows many model endpoints inside non-silent energy and intervals spanning repeated speech blocks. It is evidence of timing risk, not semantic listening or proof of exactly how many utterances were spoken.
- Exact matching deliberately preserves traditional/simplified, homophone, names, erhua and number differences. Those residuals are real recorded differences; they were not silently replaced to obtain more matches.

Only 13 target objects unique in both have both endpoint differences <=0.20 seconds (2 words, 5 lines, 6 child sentences). Of the author's 26 unheld small probes, **only two** also meet that comparison and the uncalibrated >=0.5 probability triage. None are currently production approved:

| Priority target | Small seconds | Medium seconds | Next evidence required |
|---|---:|---:|---|
| H2 L4 text2 line3 因为我喜欢白色啊！ | 10.10–12.08 | 10.16–12.22 | Actual guarded crop, complete endpoint/context check and independent unprompted crop transcription |
| H2 L5 text2 line8 sentence2 你们别客气，快坐吧！ | 35.90–38.06 | 36.00–38.24 | Same; ensure preceding 谢谢 and following audio do not invade |

The 0.20-second, 0.5 and 0.8 thresholds in these audit files are prioritization heuristics, not measured accuracy probabilities or guarantees.

## Matcher scope and required final gate

The author matcher appropriately binds original audio identity, immutable revision presence, no prompts, exact CJK text, full ASR-word endpoints, positive finite in-track times and monotonic start/end order. It blocks half-word endpoints, repeated exact matches, unsupported Latin/digit targets and zero-duration candidate words. It never interpolates character times, approves an acoustic boundary, or promotes a clip.

Its weaker conditions are acceptable only while outputs stay **unapproved candidates**. It concatenates CJK across segments, can ignore non-CJK lexical tokens, permits overlapping adjacent word spans and long internal gaps, and merely records probability. Its revision check accepts any 40-hex value, and its source lesson comparison reads current JSON rather than itself validating the run's frozen source-comparison input. This independent audit pins the exact repositories/revisions/options and frozen source lesson SHA values for both actual runs. Four adversarial examples in independent-small-inspection.json demonstrate that low confidence, an intervening NO, an 11-second gap, and overlapping timestamps can still yield a unique textual candidate while productionApproved remains false. No actual pilot candidate had an internal overlap or a >1-second gap; seven small unique candidates crossed ASR segments and require contextual review.

Before any precise clip can be promoted:

1. Bind frozen original MP3/PCM, printed target ID/Chinese context and actual run/model/package evidence; preserve all raw observations and residuals.
2. Resolve source order and actual repeated pronunciations within each track. Hold unaccounted source words, same-spelling ambiguities, foreign/numeric tokens and neighboring-source invasions. Reusing one pronunciation for senses must be explicit and must not inflate localized clip counts.
3. Require finite positive nonoverlapping endpoint evidence, reject zero-duration/repetitive-decoding tracks and record weak/nonmatching evidence. Cross-model textual agreement is supportive evidence only.
4. Inspect actual onset/tail and neighboring context, choose a guarded source sample range, and fully decode that actual crop. Fixed 120/150 ms padding is only a proposal; it is not acceptance of an onset or a tail and can cross into another utterance.
5. Obtain independent unprompted transcription of the actual crop and verify complete target content and absence of neighboring words, while retaining all residuals. Any acoustic or source-order uncertainty stays on honest whole-track/group fallback.
6. Write a versioned clip manifest with source SHA, sample range, crop SHA, reviewer evidence and truthful machine-review status. Do not call machine review human listening/native review or imply a semantic certificate from an RMS threshold.

## Expansion recommendation

**Small is sufficient for bounded evidence generation, and insufficient as the sole precise-cut approval method.** Its measured inference is 38.773 seconds for 462.768 seconds of audio (RTF 0.08378, peak 764788 KiB). Medium used 179.397 seconds (RTF 0.38766, peak 2310084 KiB), improved several paragraph texts but had fewer strict vocabulary candidates and the explicit repetitive-decoding failure above. These pilot measurements do not guarantee speed or quality in other lessons.

The remaining-batches.json total scope is **29 lessons / 232 tracks**, including the already transcribed 3 pilot lessons /24 tracks. The unrun portion is **26 lessons /208 tracks**. Evidence-only expansion may retain immutable source/model inputs, at most three lessons per batch and max two parallel workers, with per-batch checkpoints and an independent review gate. Reuse the verified pilot rather than silently rerunning it as another completed batch. Start with small, use a second fixed model selectively, and keep every unresolved item on the existing original-track fallback. Do not mark all 29 lessons precise or change runtime labels from this pilot.

## Files and reproduction

- source-target-review.json: actual visual scope, PDF identity, 17 page raster hashes and all 146 accepted Chinese-context target IDs.
- independent-small-inspection.json / independent-medium-inspection.json: full provenance, exact occurrence binding and risk details; generated read-only by inspect_pilot.py --variant small|medium.
- commit-provenance.json: actual final small-run code blobs independently read from Git.
- artifact-probe-verification.json: actual ZIP CRC/digests/expanded-byte identity, all 24 local PCM hashes and all 100 WAV source-slice byte checks.
- local-waveform-decode.json: private 12-vocabulary-track waveform inspection source/hash details.
- cross-model-review.json: unchanged source target comparison, raw residuals/zero durations, all 146 current decisions and two priority IDs; generated by compare_models.py.
- review.json: frozen independent acceptance and explicit precision/expansion boundaries.
