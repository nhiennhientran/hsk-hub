# Independent official-VI HSK3 source review

Status: full new-official HSK3 glossary, POS legend and all L1–18 source vocabulary evidence independently accepted after one bounded transcription repair.

This review used the actual 212-page user-supplied official Vietnamese edition, SHA256 `7e4e6953ff41659af5ec4ca3efd12c7b53e9703f7529ee65d418426afd814951`. It does not establish recovery of the original Chinese edition SHA `33a9c743f73f634f97a9864aa0423ac4e3568b3febbf57b63e983b5dcc0932f2`.

The reviewer independently opened PDF186–194 in full, compared all 487 Chinese/pinyin/lesson rows (479 ordinary and eight proper names), all 23 printed stars and all 16 POS legend mappings. The initial TSV has one error: PDF189 / printed177 关系 is printed **guānxì**, while the frozen TSV says guānxī. [Five-times source detail](relation-p189-detail.png) shows the falling mark above the last i. The initial reviewed TSV is retained locally in this audit directory as failure evidence. The author changed only that field. Independent final comparison confirmed the one-field diff and final SHA256 `aea9a464ff839968750c51c30df22736ed2385ce49fa1c8ace996583f32cd5df`; all other 486 rows stayed unchanged.

PDF190 / printed178 does mark 客气 with a star. It is a genuine new-edition observation; this audit does not overwrite the previously accepted old-edition star catalogue. New-edition 关系 guānxì likewise remains version evidence, with canonical guānxi untouched.

All L1–6 24 vocabulary boxes on the listed 24 pages were reopened and every one of 171 stable rows / 162 printed occurrences was compared for Chinese, pinyin, printed number, raw POS, POS legend interpretation and text/box identity. All matched. All 24 referenced author raster files exist and match their recorded SHA256. Repeated sense rows retain the complete printed multi-POS set. Blank POS entries (感兴趣、哈哈、常用、北京南站) remain null; the proper-name sequence for 北京南站 resets to 1. Three line-end pinyin hyphens are retained in raw transcription and not presented as changed pronunciation.

Vietnamese gloss/text alignment remains Phase B. This review makes no claim of audio listening, native UI/device verification, old-English-appendix coverage or acceptance of runtime edits.

Exact inputs, counts, exclusions and findings are recorded in [review.json](review.json).

The reviewer then reopened all L7–12 24 vocabulary boxes (184 stable rows / 166 printed occurrences). Chinese, pinyin, number, raw POS, POS categories and text identity all matched. All 48 referenced author spread/source-page rasters matched their SHA256. In particular 把 is a preposition in L10 and a classifier in L12; these rows are kept separate. The three proper-name entries and 只能 have no printed POS. Raw line-end hyphens and wrapped POS labels are kept as source data. This is source-evidence acceptance, with canonical values untouched.

L13–18 final SHA256 `452fde861c9899f90a1e16b82e4c8556414d563ed94fd6a7dac0502c59758449` also passed independent full-page review: 24 vocabulary boxes, 168 stable rows and 163 printed occurrences. All Chinese, pinyin, sequence numbers, raw POS, derived POS categories and source-text bindings matched. All 48 author spread/source-page raster hashes and all four two-batch detail hashes were checked. [PDF150 detail](relation-p150-detail.png) independently confirms 关系 guānxì in the lesson box as well as the repaired PDF189 glossary row.

Across the three batches, every one of 523 stable sense IDs matches the current course Chinese, PDF/printed page and sourceText binding, all ordinary/proper-name numbering ranges are complete, and the glossary's 491 headword/lesson bindings exactly equal the lesson boxes' distinct printed occurrences. No headword or sense has been collapsed: 把、好像、节、张 retain their lesson-specific roles, and all multi-POS occurrences retain their printed sets. Different empty-category serialization (`null` or `[]`) means no POS is printed, not a source category invention.

Total visual scope: 81 original PDF pages, 487 glossary rows, 23 stars, 16 legend mappings, 72 text vocabulary boxes, 491 printed lesson occurrences and 523 stable sense rows. The only required transcription repair was the accent in the glossary's 关系. The website's canonical guānxi, old-edition star catalogue, Vietnamese glosses and all runtime files were left unchanged. The original Chinese PDF and its English appendix remain outside this new-edition acceptance.

`acceptedStableIds` lists all 523 accepted IDs; `acceptedInputFiles` binds each input to its exact SHA and row/box counts. Run `python3 course-app/docs/resume-20261004/qa-hsk3-official-source/verify_accepted.py` from the repository root to recheck the frozen identities, all source bindings and referenced raster hashes. This verifier reproduces technical invariants; it does not replace the completed independent visual review.
