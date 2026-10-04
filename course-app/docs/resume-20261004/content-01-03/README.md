# HSK1 lessons 1–3 source candidates

Status: author candidates complete; independent source review, integration and browser acceptance remain pending. No production files modified by this lane.

Sources: textbook SHA256 `25d1aad102e4179307b5bc4f932927bbd244b3f4dd53edeb6cfd4dbbb8d4f2ba`; objective-answer book SHA256 `9e783c9deb889231a778d6776b65dbc04fc734eeca0fdfda1c9d99eb793104e5`.

All 17 printed pages (1–17, PDF 16–32) were visually inspected. Lesson 1 covers four pages with 15 activities and three original scene crops. Lesson 2 covers five pages with 18 activities and four original crops. Lesson 3 covers eight pages with 32 activities and five original crops. The source does not have warmup, comprehensive exercise or learning-summary groups for lessons 1–2.

Only the five cloze fields on lesson 3 printed page 15 use official answer-key grading (B, E, A/D, C; answer-book PDF page 1). The three dialogue-completion blanks and six picture-description blanks have nonunique editorial references and remain ungraded. Vocabulary entries preserve printed order, exact pinyin and source POS cells, including empty POS cells. Source language is paired with Vietnamese explanations; no user-facing source text is replaced with invented questions.

Run `python3 build_candidates.py` to reproduce candidate JSON and cropped figures from the supplied original PDFs. `verification.json` records author structural and crop-hash checks only, not independent editorial approval.

Open work: independent source review by the separate reviewer; integrate only after findings are resolved; source activity persistence and responsive-browser checks; source tongue-twister audio linking (printed tracks 1-7, 2-7, 3-7) is deliberately pending rather than mapped to an invented scene ID. The bonus resources retain their source titles and unavailable state; lesson 2 has no printed video/resource number. No human listening review is claimed.
