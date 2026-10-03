# Independent review: HSK2 lessons 02–03 original-audio alignment

Review date: 2026-10-03. This reviewer did not author or modify the segment draft, lesson content, audio, author evidence, manifest, contract, or player. All review-created files are confined to this directory. No push, deployment, browser/socket attempt, or third-party audio upload was made.

## Decision

**The submitted draft passes independent source identity, actual-crop metadata, acoustic-boundary and source-sentence reconstruction checks. Its full 26-word publication scope is not recommended unchanged.** A fresh independent medium-model check introduces a material `手 → 少` disagreement on both isolated repetitions. Hold that one additional word for focused Mandarin listening, alongside the six already unresolved words.

**Recommended automated-alignment promotion scope. The repaired source/timing gate passed final independent checks; browser/device acceptance remains separate:**

- 25 of 32 vocabulary clips; 7 words on clearly labeled whole-original-vocabulary-group fallback
- All 36 source-line ranges, including 5 multi-sentence parents with 10 separately supported child ranges
- 31 already-single-sentence source lines + 10 children = **41 actual source-punctuation sentences**
- **71 recommended ranges**: 25 vocabulary + 36 parents/source lines + 10 children
- Lesson 2: 14/17 words, 3 unresolved; 19 source lines; 22 actual sentences
- Lesson 3: 11/15 words, 4 held/unresolved; 17 source lines; 19 actual sentences

The **unchanged author artifact still contains 26 words, 6 unresolved, and 72 ranges**. This report neither silently changes those counts nor promotes it. The new hold is a conservative review judgment, not proof that the recording is wrong or the author's small-model evidence is false.

All accepted scope remains **automated alignment only**. Human listening, device playback and pronunciation/tone certification are false. Actual Chromium/WebKit/device acceptance is owned by the parent after integration and was not run here.

## Fixed artifact and source identities

- Draft: `drafts/audio/audio-segments-hsk2-lessons02-03.json`
- SHA256: `0bf5fea95f3d27c8d29a118d029f318684b7d9e750513b8e68a222b65088b75d`
- Lesson 02 JSON SHA256: `720d329d7e2889e48d7268b91a14c55bbca31c0d9d96d0aed90fa5a8ac71d89e`
- Lesson 03 JSON SHA256: `b8d202698cc7398e2f206e23a6f18c56f2b90b66543ffbe574ac90f87614f1fb`
- Source scope is exactly HSK2 lessons 2 and 3, sixteen original MP3s. No L1 or later-lesson entries occur in the draft
- Independently rehashed and fully decoded **16/16 originals**, without ffmpeg decode errors; MP3 bytes match both the source manifest and draft
- Recomputed **32/32 silence measurements** (two thresholds per original) independently; every event equals the author's recorded result
- Verified **81/81 author evidence/indexed-file SHA256 and byte sizes**, including the six supplied waveform images and draft
- Rehashed all eight recorded local small/medium model-cache files; the supplied model identity records match

See `independent-source-decodes.json`, `independent-silence-measurements.json`, `author-evidence-integrity.json`, and `independent-model-cache-check.json`.

## Independent source/crop audit

The reviewer wrote and ran `check-data.py`; the author's validation script was not executed or treated as an independent review.

- All 32 vocabulary source IDs are accounted for exactly once as 26 submitted verified words or 6 unresolved words
- Every one of the **72 submitted bounds** matches the correct stable ID, unchanged Chinese source string, unchanged pinyin, intended track, and SHA256 of that exact MP3
- All 72 bounds are inside the independently decoded PCM timeline and contain non-silent audio; original PCM crop hashes are recorded per range
- All **134 author isolated-crop evidence records** cross-check against the exact candidate range, original hash, track, and target: 64 small-word + 18 medium-word + 36 small-line + 5 medium-line + 10 small-sentence + 1 medium-sentence
- All 16 whole-track ASR identities also match their originals
- The author ASR metadata and actual transcribe call sites have no expected text, initial prompt, prefix, hotwords or previous-text conditioning. Source target strings are used for post-recognition comparison, not recognizer input
- All 26 submitted vocabulary ranges have exact isolated small/medium lexical evidence after only script/punctuation normalization: 23 supported by small, 3 by medium. This source-audit fact does **not** erase the new independent discrepancy for 手
- Across all 72 submitted ranges, 68 have exact-normalized supporting text and 4 have narrowly documented variant decisions. Of the 46 line/child entries, 42 are exact and 4 are qualified variants
- All 72 submitted verified entries explicitly set `humanListening`, `devicePlaybackCertified`, and `pronunciationToneCertified` to false

Historical author executions were audited, not all rerun: no metadata or code inspection can by itself independently attest every past inference. This review freshly reran 13 selected published crops and one additional repetition, with PCM hashes recorded, described below.

## A1 — New cross-model disagreement: 手 (hold before promotion)

ID: `hsk2-fltrp-2026:l03:word09`; original track `course-assets/hsk2/audio/3-6.mp3`; original SHA256 `3bd0aada96a022fe362e17c86924355f6aa91c3f9365bc7eda6eef11056b8bd2`.

- Submitted repetition 1: **8.090–9.044 s**; author small gives `手`; fresh independent medium gives `少`
- Candidate repetition 2: **9.074–10.178 s**; author small gives `Shall`; one bounded fresh medium check also gives `少`
- Whole-track small gives the intended `手`; that context is supportive but does not resolve the isolated recognition disagreement
- `手 shǒu` and `少 shǎo` are not merely alternative characters for the same syllable. Written ASR outputs are not acoustic tone measurements
- The plotted bounds and independent silence episodes support one complete acoustic utterance per crop. This finding is lexical/phonetic uncertainty, not evidence of a doubled recording or timing-through-speech defect

**Action:** retain the original group fallback for this word pending a qualified Mandarin listener's identity/onset/tail/pronunciation check. Do not rewrite the source word or pinyin to 少. No more model retries were used after the one second-repetition check.

Evidence: `independent-medium-asr.json`, `independent-hand-second-repeat.json`, and their reproducible scripts/logs.

## Qualified source-text variants remain honest and narrow

1. `l02:text1:line2`: source `有，但车站有点儿远。`; both author's medium and independent medium omit written `儿`. The source unit and crop identity are supported, but audible erhua is not certified
2. `l02:text2:line4`: `三千` appears as `3000`. This is the specifically reviewed number-notation equivalence, with original written Chinese/pinyin retained
3. `l02:text3:line1`: proper name `家月` appears as `佳月`. The compatible homophonous name spelling does not certify the source spelling or tone. Independent medium retains the same rendering and correctly includes `电影院`
4. `l02:text3:line4:sentence2`: `二十` appears as `20`; this is the second individually reviewed numeric equivalence

The fresh independent medium runs reproduced all four qualifications. `刘明` in the first lesson-3 paragraph sentence was reproduced with the exact simplified/traditional-equivalent spelling. No generic fuzzy/homophone acceptance rule or source-text rewrite is justified.

## Six original unresolved words remain unresolved

- Lesson 2: `word09 万`, `word10 名`, `word13 间`
- Lesson 3: `word03 完`, `word08 拿`, `word14 每`

Each has exactly two existing small and two existing medium isolated observations. Their uncertain English approximations, unrelated text or homophone spellings were not upgraded. They have no published start/end in the draft and point to clearly labeled whole-group fallback. They were not retried in this review merely to increase coverage.

Together with 手, the recommended pending set is **7 words**, not 6.

## Actual sentence reconstruction and boundary review

- Independently derived sentence identities from the original Chinese punctuation, with corresponding exact pinyin sentence fragments
- All 5 multi-sentence source lines have all 10 ordered children; the children's Chinese concatenation reconstructs the parent exactly
- All parents remain dialogue turns or source paragraphs, not falsely labeled single sentences; all children stay within their correct parent/track and do not overlap at the same level
- The two text-4 paragraphs retain two source-punctuation sentences each. ASR's alternative comma/full-stop choices were not used to invent additional source sentences
- Lesson 2 text 4 children: **0.788–4.229**, **4.857–14.665 s**; lesson 3 text 4 children: **0.718–9.825**, **10.815–15.455 s**
- Fresh independent medium separately transcribed all four of those paragraph sentence crops with exact script/punctuation-normalized text
- Candidate production is based on actual acoustic episodes/silence and separately checked content, not equal-duration or character-count allocation. Paragraph child durations and observed intervening gaps independently support this

Actually inspected the pixels of all six supplied panels: lessons 2/3 × vocabulary/source-line/actual-sentence. The author panels depict both vocabulary repetitions, including unresolved candidates; candidate plotting itself does not confer verified status.

The independent −38 dB episode reconstruction finds exactly two pronunciation episodes per source word, and each of the **26 submitted word crops contains exactly one** such episode. The within-外国 gap is joined, and the short impulse after the second 手 is excluded by the documented policy. Submitted word clip durations are **0.470–1.336 seconds**; none is a whole vocabulary-group track.

No gross clipped major speech peak, overlapping neighboring utterance, doubled repetition, sentence reorder or missing large speech block was identified. Across all 72 crops, the loudest first/last 40 ms RMS is approximately **−41.44 dBFS**. This supports quiet padding but cannot certify soft-consonant/final completeness or lexical tones. Acoustic energy and a full ASR sentence are not substitutes for listening.

## C1 — Initial runtime contract does not fail closed (separate integration finding)

The initial `src/audio-segment-contract.ts`, SHA256 `4f6ec9c62171090d1599e99c30bb3e504186bb6c8823e1c77afc08926ddd17b9`, accepted the real draft and correctly rejected a zero-length range. It nevertheless accepted **15 other intentionally invalid mutations** in this review's promotion/integration probes:

- Per-entry sourceHash replacement/deletion; unchanged-but-wrong same-kind track
- Word Chinese or pinyin replacement; invented same-lesson stable ID
- L1 entry/track mixed into declared lessons-2/3 scope
- Whole-group-length range advertised as a single word
- Each false certification flag changed to true; missing method
- A pending unresolved ID simultaneously present under verified words
- Orphan child sentences; multi-sentence parent falsely converted to one sentence without children

This is not a finding that those changes occur in the submitted author data. It is a promotion/runtime validation boundary, reported immediately to the parent for repair. The current shape-only API does not receive original lesson source content, so source-text binding requires additional trusted inputs or a separate promotion gate.

`contract-probes.json` freezes the initial tested source hash and result, with exact mutation IDs/fields. `check-contract.mjs` is rerunnable and writes `contract-probes-live.json` by default, preserving the initial finding.

Minimum trusted promotion inputs:

- Explicit scope; original stable word/line IDs, exact Chinese/pinyin, and intended audioTrack
- Punctuation-derived actual sentence/parent relationships
- Authoritative track SHA256 and decoded duration; per-entry hashes bound to that track
- Reviewed timing/evidence identity, or a digest of a closed approved timing catalog. Text checks or a generic word maximum duration alone cannot prove a word-sized crop
- Complete verified/pending partition and duplicate-safe imports; reject overlapping IDs instead of silent `Object.assign` replacement

A repaired contract needs its own new test evidence before claiming this integration gate closed. Browser/device playback is another gate, not part of the source/crop pass.

## Fresh local ASR scope and limitations

`recheck-asr.py` made 13 fresh calls using cached medium weights offline, CPU/int8, no initial prompt, no previous-text conditioning, and 0.5 seconds of silence appended after each exact PCM crop. It checked 远、送、累、外国、手, the four qualified variants and all four paragraph children. `recheck-hand-repeat.py` made exactly one further fresh call for 手's second repetition.

Results: 8 exact-normalized published crops, 4 reproduced known qualified variants, and 1 new 手/少 disagreement; the additional 手 repetition also produced 少. These are independent executions of the **same Whisper family**, not an independent recognizer architecture or human listening. No audio left the executor and no new model download occurred. A harmless UCX VFS socket warning appeared; inference completed.

## Reproduction

From the `course-app` directory:

```bash
PY=/tmp/hsk-asr-env/bin/python
D=docs/independent-audio-hsk2-lessons02-03-review
"$PY" "$D/check-data.py"
"$PY" "$D/check-model-cache.py"
HF_HUB_OFFLINE=1 "$PY" "$D/recheck-asr.py"
HF_HUB_OFFLINE=1 "$PY" "$D/recheck-hand-repeat.py"
node --experimental-strip-types "$D/check-contract.mjs" contract-probes-live.json
```

These scripts write only this review directory. The ASR scripts intentionally perform fresh inference; they do not treat prior result files as an inference cache. Use the artifact hash above to ensure the assigned author draft has not changed. The contract probe result records whichever contract bytes it actually executed; the initial result remains separately preserved.

## Evidence map

- `review-recommendation.json`: 25/7 recommendation, complete approved/held IDs and 71 exact recommended source-bound ranges
- `independent-data-check.json`: exact counters, source JSON hashes and zero structural/source/crop-evidence issues
- `independent-source-decodes.json`: independent MP3 hashes, PCM samples/hash and decoder results
- `independent-silence-measurements.json`: all 32 fresh silence measurements and comparisons
- `independent-range-metrics.json`: all 72 submitted ranges, transcripts, endpoint energy and PCM hashes
- `independent-crop-evidence-crosscheck.json`: all 134 historical author isolated-crop records mapped to live PCM
- `independent-sentence-reconstruction.json`: all five exact parent/child reconstructions
- `reviewed-variants.json`: the four explicit variant cases
- `author-evidence-integrity.json`, `author-transcribe-call-audit.json`: file hash checks and code-level unprompted-call inspection
- `independent-model-cache-check.json`: eight live model-cache hashes
- `independent-medium-asr.json`, `independent-hand-second-repeat.json`: fourteen fresh local recognitions
- `contract-probes.json`: initial runtime/import gate failures, code SHA256, exact mutation targets

## Integration appendix: narrowed candidate and repaired guard

The parent provided a separate integration candidate; the original 26/6 author artifact remains unchanged. Independently compared every retained entry, source binding and approved timing before testing the new contract.

- Candidate: `drafts/audio/audio-segments-hsk2-lessons02-03-integration.json`; SHA256 `9bd2278cf872cf1d9bdccfbb3a8ff54ed96477833d73e258c724671746da91ef`
- Candidate contains exactly the recommended **25 words, 7 pending, 36 source lines, 10 children, 71 total ranges**. Every retained word/line/child object is unchanged from the author artifact. The six original pending records are unchanged; 手 is added as pending with no published range
- First tested combined source/timing authority: `/tmp/hsk-audio-candidate-authority.json`; SHA256 `bc1b6dd89a6f24351693d86ad0aca0c98f04c78ee81c2430ee078f3c0c7e3654`
- Authority contains the two prior pilot lessons plus HSK2 lessons 2/3: **4 lesson definitions, 74 source vocabulary entries, 78 source lines, 172 reviewed ranges**. Every source field and punctuation-derived sentence matches the original current lesson JSONs. Approved ranges equal the prior pilot plus the 71 newly recommended ranges
- The existing pilot differs from HEAD only by **315 sourceHash/sourcePinyin/false-tone metadata additions**. No timing, Chinese text or prior verified/pending assignment changed
- `tools/build-audio-authority.mjs` is an explicit integration operation. It is not run by ordinary `npm run build`. This is a trusted-source/range allowlist boundary, not a claim that a client can resist its entire same-origin program and authority being replaced together

### Initial repaired-contract test

Contract SHA256 `09168dbbe4fb37dd5a4d9453e005e1794ff85010a4536d457a7aad43bf417986`:

- Accepted the valid 25/7 candidate and a valid disjoint pilot + candidate merge
- Rejected **41/41 intentionally invalid cases**: all 16 initial negative probes plus 25 new cases covering missing/wrong authority, wrong source text/pinyin/track, wrong child source text/pinyin, all original 26 words against the narrower allowlist, duplicate validated manifests, missing coverage, sentence reversal, altered repetition/method/content-match class, non-finite/out-of-source ranges, incorrect pending hash and fallback
- Independently ran all **6 focused audio-segment unit tests**, all passed. This is a focused test result, not a claim to have independently rerun the parent's entire suite or browser matrix

This closes the initial C1 source/text/timing/certification/coverage gate for the tested inputs. Initial raw probe results are preserved in `contract-v2-first-probes.json` and the tested initial repaired source in `contract-v2-first.ts.txt` when available. A later refinement is recorded separately rather than overwriting this evidence.

### Smaller metadata/helper observations

Additional first-revision probes accepted (a) extra start/end on a pending record, (b) an inflated declared decoded duration with unchanged valid container duration, (c) a changed historical observedTranscript while timing/method/contentMatch stay unchanged, (d) an unrecognized root `humanListening: true` field, and (e) a direct merge-helper input that is unvalidated and collides a pending ID with an existing line ID.

None caused a changed approved range to be played: ordinary loading validates each manifest, pending records are not playable, root unknown fields are unused, and the playback allowlist rejects arbitrary timings. The unvalidated helper collision is unreachable through the tested normal loading path. These were separated from the core gate rather than overstated as unresolved playback defects. All five observed cases were subsequently repaired and rejected in the final retest below. Arbitrary unknown fields or free-form historical evidence prose are not claimed to be a strict closed schema or a cryptographic record of inference.

### Integration reproduction/evidence

```bash
PY=/tmp/hsk-asr-env/bin/python
D=docs/independent-audio-hsk2-lessons02-03-review
"$PY" "$D/check-integration-inputs.py"
node --experimental-strip-types "$D/check-contract-v2.mjs"
node --experimental-strip-types --test tests/audio-segments.test.mjs
```

- `integration-input-check.json`: exact candidate comparison, trusted source index comparison and all pilot-only metadata additions
- `contract-v2-probes.json`: latest independently executed guard probes, candidate/authority/contract hashes
- `contract-v2-first-probes.json`: preserved first repaired-contract result
- `contract-v2-unit.log`: latest seven independently executed focused unit tests
- `check-integration-inputs.py`, `check-contract-v2.mjs`: reviewer-written reproduction scripts. They default to the exact reviewed authority snapshot `candidate-authority-reviewed.json`. Set `HSK_AUDIO_AUTHORITY` to intentionally test a new authority; its hash and source bindings must be rechecked

## Final gate closure — 2026-10-03 06:41 UTC

**All 48 independent gate cases passed: 46 rejected mutations plus 2 accepted legitimate cases.** This includes all 41 earlier negative cases and the five metadata/helper observations above. Pending bounds, inflated decoded duration, altered observedTranscript, false root certification, and cross-kind helper collision are now rejected. The seven current focused audio-segment unit tests also passed independently.

- Final tested contract SHA256: `7f6d5ec47182c1075be739ebef35cf39069e5c0a0a2065fd1163ce271e66fe7a`
- Final tested authority SHA256: `0931b8ec8d0ba58df8453906cc01da4c89238059095039662ecef86d1726c0a4`
- Candidate SHA256 remains `9bd2278cf872cf1d9bdccfbb3a8ff54ed96477833d73e258c724671746da91ef`; original author artifact remains `0bf5fea95f3d27c8d29a118d029f318684b7d9e750513b8e68a222b65088b75d`
- Independently rehashed and fully decoded **all 32 MP3s in the final combined authority** (16 prior-pilot and 16 new-lesson tracks). Each authority sourceHash, decodedDuration and containerDuration exactly matches the newly measured source bytes/sample timeline. See `integration-authority-track-decodes.json`
- Final authority additionally binds observedTranscript for ranges, and track hash/decoded/container durations. The source-index and timing comparison still passes with zero issues
- `candidate-authority-reviewed.json` preserves the exact final tested authority as review evidence; `contract-final.ts.txt` preserves the final tested contract text. Neither is imported into the app from this report directory

**Final disposition:** the separate 25/7 narrowed integration candidate is acceptable for this automated alignment/data-contract gate. Proceed only with its reviewed 71 ranges and the stated seven whole-group fallbacks. Preserve the source text/pinyin and all false listening/device/tone certifications. This does not certify actual browser playback, human listening, exact lexical tones, or every faint onset/tail; those remain separate checks. The 手/少 disagreement remains an explicit hold, not a resolved pronunciation judgment.
