# HSK2/3 source closure — recovery checkpoint

Status: the **additional official Vietnamese-source word review** has separate full visual acceptance. QA checked all81 source pages,523 stable senses,491 printed vocabulary appearances,72 boxes and487 glossary entries, after one bounded author transcription repair. Acceptance is imported only from that reviewer's exact frozen-input hashes. No lesson, lexicon or runtime file was changed in this pass. The unavailable original Chinese PDF and its English appendix remain a separate source-recovery limitation.

## Additional official source checkpoint

The lead authorized the uploaded official Vietnamese HSK3 book as an explicitly separate source revision. Local bytes verify SHA256 `7e4e6953ff41659af5ec4ca3efd12c7b53e9703f7529ee65d418426afd814951`, 96,266,563 bytes and 212 PDF pages. Cover/title, contents, the lesson vocabulary boxes, PDF186 POS legend and PDF195 appendix heading were actually viewed. The appendix beginning at PDF195 is **Vietnamese translation**, not the original Chinese book's English translation. No equivalence of file bytes or English POS abbreviations is asserted.

- All **72 vocabulary boxes / 72 body pages**, including proper-name sublists: 523 stable word-sense rows and 491 printed vocabulary appearances.
- Entire glossary PDF186–194: **487 printed entries = 479 ordinary entries + 8 proper names**. All current Chinese forms and all lesson-number bindings are covered.
- Raw printed Vietnamese POS abbreviations and printed numbers are kept in a distinct sidecar; multi-POS entries retain a shared printed number and separate stable IDs. No printed POS is invented for unlabeled expressions or proper names.
- Author source inputs: `official-vi-l01-06.json`, `official-vi-l07-12.json`, `official-vi-l13-18.json`, `official-vi-glossary.tsv`. The first batch contains171 stable rows, the second184, the third168.
- `build_source_revision.py` joins these inputs into `official-vi-source-revision.json`, verifies exhaustive ID/head/lesson coverage, and checks all existing number and glossary-page bindings. Current structural result is zero issues. This does not replace independent visual review.
- The additional book prints a star for **客气** (two existing L2 senses), unlike the preserved old-source flag. It therefore contains23 starred heads/25 sense rows. This is a source-revision difference, not a silent overwrite of the accepted22-head original-source audit.
- **关系** in both the new glossary PDF189 and body PDF150 prints `guānxì`, differing from current canonical `guānxi`. The author's initial glossary `guānxī` was corrected after separate QA's enlarged-page check. The complete pre-repair TSV is preserved as `official-vi-glossary.before-relation-repair.tsv` (SHA256 `5648f7d6e7f245c776f8c152c1117973815a99f4a069680165e4a1939a04eb90`). QA verified that the final TSV changes only this field and accepted final SHA256 `aea9a464ff839968750c51c30df22736ed2385ce49fa1c8ace996583f32cd5df`. No website pinyin or POS was changed.
- Vietnamese gloss translation alignment remains Phase B. Merely reading the new book's word boxes for source identity/number/POS does not claim that all Vietnamese has been audited.

Rebuild the additional source sidecar with:

```sh
python course-app/docs/resume-20261004/hsk23-source-closure/build_source_revision.py
```

Independent source acceptance is recorded in `docs/resume-20261004/qa-hsk3-official-source/review.json`. The join refuses an accepted-input hash mismatch; the two different raw revision names used by the original author batches identify the same explicit uploaded-file SHA, and the joined registry uses `hsk3-official-vi-20261004` consistently.

The final visual review includes all523 accepted stable IDs and four accepted-input manifests. Its frozen SHA256 is `9f015fbf612d81a8c8ab498ecf6b3af40209f5ae0832d34e78bc961f85d5a23c`.

## Bounded metadata integration proposal

`official-vi-metadata-proposal.json` provides every concrete operation: 18 lesson-file paths and expected original file hashes; 18 top-level `additionalSourceRevisions` registries; 523 stable word IDs, vocabulary-array JSON pointers, expected absent fields, complete expected original word objects, and added `additionalSourceEvidence` records. It is not applied to the actual course files yet.

The existing `Source` type has only page/section/provenance, so using it alone cannot identify a new edition. Existing `appendixMetadata.sourcePos` contains English abbreviations from the original edition. The proposal therefore adds a separate registry and separate per-word evidence; it preserves every existing source object, old number/POS field, star flag, canonical value and catalogue byte. The current JSON loader carries extra metadata with the lesson object. Its validation does not reject additive fields, and this proposal requires no shared-engine/type change.

Each added word record stores an explicitly identified vocabulary-box source, the actual printed number, source-list identity, raw pinyin, raw Vietnamese POS set, declared Chinese POS categories, and a glossary source with printed pinyin, star and lesson numbers. Unlabeled expressions and proper names keep null raw POS; multi-POS printed items retain all printed labels and distinct stable senses. Source-revision differences for the two 客气 senses and 关系 are recorded alongside the preserved course values.

`check_pos_crosswalk.py` checks all523 canonical category bindings against the newly transcribed full printed POS sets using explicit mappings. There are508 rows with printed POS and15 without; the existing174 English-label metadata sets also agree under the declared mapping. Current category issues: zero. This read-only mapping comparison is not a claim that the unavailable original English pages were reopened.

Generate and preview without mutating course files:

```sh
python course-app/docs/resume-20261004/hsk23-source-closure/build_source_revision.py
python course-app/docs/resume-20261004/hsk23-source-closure/check_pos_crosswalk.py
python course-app/docs/resume-20261004/hsk23-source-closure/build_metadata_proposal.py
python course-app/docs/resume-20261004/hsk23-source-closure/apply_metadata_proposal.py
```

The preview guards the source inputs, QA evidence, complete lesson bytes, every original word and the canonical catalogue. It reconstructs the joined source evidence from the frozen inputs and real QA verdicts, then reconstructs the complete proposal and requires exact equality with both stored files. The real QA verdicts must include all523 rows/491 appearances/72 boxes/487 glossary rows and18 sequence ranges, not merely a status string. It separately checks unique18-file coverage and lesson identity, and verifies that removing the new metadata restores each original lesson object exactly. The `--apply` option additionally requires full independent source acceptance before writing the18 guarded lesson files. The lead reviews the integration proposal within the authorized task; no upload, commit or publication occurs in this script.

Separate engineering QA accepted the final pipeline in `docs/resume-20261004/qa-hsk3-metadata-engineering/final-pipeline-probes.json`: two positive cases and34 negative cases ran against the real scripts in disposable full-app copies. All negative cases were rejected before any course write. The positive apply preserved all original lesson objects after removing the two additive fields, kept canonical bytes unchanged, retained old-source counts217/174/0 and added exactly18 registries/523 official-word records. The initial failed negative probes remain preserved in that QA directory. No actual course file was written by either QA or this author.

The accepted proposal SHA256 is `615c1f39801a163fbc86618b3da731274abb47a741fa0a2ee34db437d053d4b1`; the joined source sidecar SHA256 is `af765496215f0b6081904b9d3f0df3f13234737feddd0f2120174de54ed920fa`. Do not regenerate these after integration and call the resulting changed course hashes the reviewed pre-integration input. The integration-result report captures the before/after lesson hashes separately.

Original metadata counts remain217/174/0. If integrated, additional official-source glossary/number-POS/number-POS-page coverage will be523/523/523. This explicitly closes the current official source evidence gap without falsely raising old-edition coverage counts or declaring the old English appendix complete.

`inventory.py` reads actual lesson JSON and reports the old and additional official coverages separately, as well as canonical-binding and additional-source ID/head/page/number/POS/lesson-binding issues. Before integration it accurately reports zero additional records. Re-run it after the lead applies the accepted metadata plan; the proposal itself is not evidence that runtime files have been updated.

## Completed and preserved evidence

- HSK2 appendix closure was already independently accepted in `docs/independent-hsk2-lessons-14-15-review/candidate-review/independent-review.md`: 210 printed glossary entries, 226 stable sense rows, 10 stars, 60 lesson vocabulary boxes, all printed number/POS distinctions. Do not restart or overwrite this work.
- HSK3 starred glossary closure was already independently accepted in `docs/hsk3-appendix-stars/`: 22 starred heads and 23 sense records. Do not infer ordinary-glossary or English-appendix acceptance from that scoped result.
- The reviewed canonical identity catalogue already distinguishes all 523 HSK3 senses / 487 Chinese forms and all 226 HSK2 senses / 209 Chinese forms. No merge is proposed. Printed sense/POS distinctions remain authoritative even when Vietnamese wording overlaps.
- `inventory.py` compares every current lesson word's Chinese, pinyin, Vietnamese, POS, text number, audio track, source object and lesson identity with its catalogue binding. Current result: 749 sense rows; zero stale or missing canonical values/provenance bindings.

## Actual current metadata coverage

| Course | Stable rows | Appendix source | Number/POS metadata | Explicit number/POS source |
|---|---:|---:|---:|---:|
| HSK2 | 226 | 226 | 226 | 226 |
| HSK3 | 523 | 217 | 174 | 0 |

These are inventory counts, not fresh source-verification percentages. HSK3 number/POS metadata currently covers lessons 2–7. Some HSK3 appendix source objects exist without such metadata, and the previously accepted stars add a separate subset. Missing metadata does not prove a displayed word is wrong; earlier per-lesson content reviews remain preserved.

## Source recovery issue

Expected original HSK3 textbook identity (from `docs/source-inventory.json`):

- filename: `新HSK教程3(HSK3.0) (郭风岚,汤旭) (z-library.sk, 1lib.sk, z-lib.sk).pdf`
- 75,121,060 bytes; 212 PDF pages
- SHA256 `33a9c743f73f634f97a9864aa0423ac4e3568b3febbf57b63e983b5dcc0932f2`
- resolved native file: `libfile_ffde15d98ec48191a117bb239439fe39` / `file_00000000a36081fb887efeb76ce50ce7`

The current helper was fetched from the current Library skill source and invoked with the complete search result selecting only the textbook. Two materialization attempts failed with HTTP 502. No usable PDF was installed. The executor's attachment-transfer fallback refused the file because it exceeds 32 MiB. A native page read requesting 186–188 returned no images and reported 150 accessible pages. That retrieval response cannot establish the true page count or substitute for the original PDF; the existing 212-page source identity is not overwritten.

No placeholder page, OCR invention, Vietnamese-book substitution or guessed headword/POS metadata was integrated.

## Original-source recovery follow-up

1. Recover the exact original PDF and verify the SHA256 above before rendering it.
2. Inspect PDF186 legend; PDF187–194 glossary, including proper-name lists and multi-lesson/sense headwords; record every printed entry and all lesson bindings.
3. Inspect the lesson vocabulary boxes that lack exact number/POS source evidence. Preserve prior accepted words, sense IDs, catalogue mappings, pinyin and translations unless actual source evidence establishes an error.
4. Inspect PDF195–209 / printed183–197 English appendix and map all 72 texts to their lesson/text IDs. Use it as source-consistency evidence; do not invent a requirement for a new English-language UI.
5. Propose bounded data-only metadata changes; notify the lead before writing lesson files. A different reviewer must reopen the original pages and check the exact proposal before acceptance.
6. Re-run inventory and relevant content/lexicon validation after integration. Freeze exact input/output hashes and record what was actually checked. Native browser, audio, new official-Vietnamese alignment and final release remain separate gates.

Re-run the inventory from `course-app`'s parent with:

```sh
python course-app/docs/resume-20261004/hsk23-source-closure/inventory.py
```
