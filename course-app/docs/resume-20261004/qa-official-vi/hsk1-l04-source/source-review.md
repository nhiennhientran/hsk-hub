# Independent source acceptance

Official file: `upload/HSK1  (3.0).pdf`,63,200,770 bytes; SHA256 **99ca3e635bbf99bcbbe003e32a0dbdf7ad0af2300b7380959d647e1028cf2764**. This is the Vietnamese edition. Its physical page offsets must not be inferred from the previously accepted Chinese source edition.

Author transcription SHA256 **c63b6a2eb49433f2234f005b20f1bc75c6432779cd0b023fc033617a66eec974** is accepted independently. The reviewer rendered the actual original PDF anew with `pdftoppm -f 34 -l 42 -r 180 -cropbox -png`, then read each complete page against each listed ID. OCR and the text layer were not used. All105 IDs were checked, including21 numbered vocabulary entries with raw POS,14 complete speaker translations, goals, all grammar prose and all Vietnamese instructions/headings/captions.

| Physical PDF page | Footer observed | IDs accepted | Full-page findings |
| --- | --- | ---: | --- |
| 34 | 018 | 9 | Lesson/title, four goals, warmup heading and instruction; picture options are Chinese/PY only |
| 35 | 019 | 16 | Text1 setting/read/role instructions, four full role lines, words1–3/POS, 有 grammar |
| 36 | 020 | 6 | Read instructions and number explanation/headings;0–99 table has Chinese/PY/digits and no VI cell translations |
| 37 | 021 | 10 | Higher-number and 二/两 prose, unique two-books VI cell, text2 lead/instruction; listening stems/options have no printed VI |
| 38 | 022 | 18 | Four text2 role lines, words4–13/POS, role/pair instructions |
| 39 | 023 | 9 | 呢 and classifier explanations and read/complete instructions; examples/dialogue blanks are Chinese-only |
| 40 | 024 | 13 | Text3 lead/listen instruction, both age-help boxes, six full role translations |
| 41 | 025 | 17 | Words14–21/POS, two translated questions, role/question/cloze/picture instructions and exercises heading |
| 42 | 026 | 7 | Classroom/pair instructions, example/bonus labels and age caption; picture blanks and sample bubble have no VI |
| **Total** | **9 observed** | **105** | **0 missing Vietnamese occurrences;0 transcription repairs** |

Critical results were rerendered from the original CropBox at360dpi, independently of the author's crops:

- The title is **Chị có hai con**. The source is not the current website's “Tôi có hai người con”.
- Text1 uses **Dì ấy**. Text2 uses **Chị / Em**, and text3 uses **Chị / Cháu**. Speakers are **Lưu Minh**, **Vương Nhất Tuyết**, **Dương Đồng Lạc**. These are contextual printed translations; do not global-replace unrelated pronouns.
- Printed vocabulary POS abbreviations are preserved literally. In particular, **多** prints raw **đt.** while the gloss prints **bao nhiêu (phó từ chỉ mức độ)**. Both are clear in the original high-resolution crop. The source records are correct; do not silently resolve the apparent taxonomy inconsistency into an inferred expanded category.
- The 二/两 table prints **(hai quyển sách)** only for 两本书. The Vietnamese assistance currently attached to 两个人 and 两口人 is editorial, not printed VI from this table.
- **Bài khoá / bài khoá** are the printed spellings. The author preserves these; later site alignment should share this accepted terminology.

The transcription joins ordinary line wraps into spaces and uses typed quotation/ellipsis/range characters to represent the visible print. Raster review establishes visible wording, diacritics and punctuation meaning; it cannot recover the original PDF's Unicode encoding, typographic spacing or italic style as text bytes. No unrelated typographic normalization is claimed as a source repair.

Full-page render paths and SHA256 are recorded per page in `source-review.json`; the three permanent detail crops have complete original-source/raster-rectangle provenance in `evidence-manifest.json`. No author source file, production file or previous CI report was changed.
