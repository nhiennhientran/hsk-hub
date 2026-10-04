# HSK1 lessons 1–3 source candidates

Status: author final source check complete, candidate revision 2; independent acceptance of the final hashes, integration and browser acceptance remain pending. No production files modified by this lane.

Sources: textbook SHA256 `25d1aad102e4179307b5bc4f932927bbd244b3f4dd53edeb6cfd4dbbb8d4f2ba`; objective-answer book SHA256 `9e783c9deb889231a778d6776b65dbc04fc734eeca0fdfda1c9d99eb793104e5`.

All 17 printed pages (1–17, PDF 16–32) were visually inspected. Lesson 1 covers four pages with 15 activities and three original scene crops. Lesson 2 covers five pages with 18 activities and four original crops. Lesson 3 covers eight pages with 32 activities and five original crops. The source does not have warmup, comprehensive exercise or learning-summary groups for lessons 1–2.

Only the five cloze fields on lesson 3 printed page 15 use official answer-key grading (B, E, A/D, C; answer-book PDF page 1). The three dialogue-completion blanks and six picture-description blanks have nonunique editorial references and remain ungraded. Vocabulary entries preserve printed order, exact pinyin and source POS cells, including empty POS cells. Source language is paired with Vietnamese explanations; no user-facing source text is replaced with invented questions.

Final author review re-read all 17 textbook pages and the answer page. Revision 2 restores printed `bù` in lesson 2 page 7, adds three cross-page provenance spans (lesson 2 text 1; lesson 3 text 3; lesson 3 吗 grammar), preserves the headerless 2×2 vocabulary self-review table, and leaves the first column header of the 9×3 skill matrix empty as printed. Root owns the engine change that accepts paired empty table column headers; general text validation stays strict. The 29 optional oral, pair, group, self-review and reflection fields are not forced. The nine written completion fields remain ungraded and required; no absent key is invented.

Pinyin printed in dialogue, vocabulary and tongue-twister sections is source transcription. Pinyin for the five grammar-reading activities is an editorial reading aid, because those examples have no printed sentence pinyin in the source. Lesson 2 page 7 prints `bù` before `shì`; actual connected speech uses `bú`, but the source activity follows the print as instructed. Lesson 3 page 14 prints `bú` in `不太`, which stays unchanged. These distinctions are recorded in `verification.json`; they do not alter frozen textbook records.

The new official Vietnamese books are reserved for phase 2. This author pass checks original Chinese content, topology, pinyin provenance, images and answer boundaries; it does not claim the later full Vietnamese comparison has happened.

Run `python3 build_candidates.py` to reproduce candidate JSON and cropped figures from the supplied original PDFs. `verification.json` records author structural and crop-hash checks only, not independent editorial approval.

Open work: independent source review by the separate reviewer; integrate only after findings are resolved; source activity persistence and responsive-browser checks; source tongue-twister audio linking (printed tracks 1-7, 2-7, 3-7) is deliberately pending rather than mapped to an invented scene ID. The bonus resources retain their source titles and unavailable state; lesson 2 has no printed video/resource number. No human listening review is claimed.
