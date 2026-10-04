# Independent frozen-candidate review: HSK3 lessons 08–09

Date: 2026-10-04. Decision: **PASS for the scoped source/content/figure/preservation review.** No blocking content defect found. This is not integrated browser acceptance, deployment approval, native-speaker certification, or a new audio-listening certificate.

## Reviewed identity

- Baseline: `9b7c76702e9724b4c647750138d800605254a116`.
- `course-app/content/hsk3/lesson-08.json`: SHA256 `ceda05f514415ebb53e8cec9d2b638a8a1ef893bd7b4dada015c4d3b7e67f614`.
- `course-app/content/hsk3/lesson-09.json`: SHA256 `e207696483a08701f383c4fe6f3721048f0d50b7e29202e916a9506878d33f70`.
- All 25 SVG asset hashes are individually bound in `reviewed-hashes.json` and `figure-review-ledger.json`. All 27 candidate files were unchanged at the end of review. Editing a reviewed JSON or SVG invalidates the corresponding acceptance until rechecked.
- Textbook independently rehashed: 212 PDF pages, 75,121,060 bytes, SHA256 `33a9c743f73f634f97a9864aa0423ac4e3568b3febbf57b63e983b5dcc0932f2`.
- Objective-answer book independently rehashed: 27 PDF pages, 7,228,714 bytes, SHA256 `7cc42aa78c6b1c32f03f6deccac606c31bd787fd1f72717d45afafa29155e473`.
- All textbook PDF79–97 (printed67–85) and answer PDF11–13 were visually inspected. Raw textbook page images and full books are excluded from this project evidence directory.

## Pass/fail ledger

| Area | Result | Independent evidence and scope |
|---|---|---|
| Source coverage | PASS | 58 activities and 162 distinct fields (L8 68; L9 94). Six-picture warmups, four listening tasks, four reading tasks, separate grammar blanks, word banks, picture dialogues and classroom work are represented. |
| Official answer mappings | PASS | Visually read answer-book keys, then independently asserted option indexes: L8 warmup DCFABE, texts CC/CA/CA/AB, words DBEAC/EBADC; L9 warmup BDAFEC, texts BC/CB/AB/AA, words DCBEA/BCAED. 48 official fields total. |
| Answer page boundaries | PASS | L8 word Q1–3 answer PDF11 and Q4–10 PDF12; L9 text1–2 answers PDF12, text3–4 and all word answers PDF13. Textbook L9 text4 listening Q2 is PDF94, although Q1 and task heading are PDF93. |
| Reading references | PASS | All 24 bilingual references read against the actual text and questions. L8 includes duration, running/badminton, ear discomfort, proposed assistance, uncertain leg cause and discharge details. L9 includes returned card/running, sports preparation, badminton reluctance/practice, match difficulties and source-attributed Olympics statements. No materially unsupported answer or changed speaker found. |
| Grammar references | PASS | All 22 blanks checked in their complete sentence/dialogue context; L8 12 and L9 10. L9 potential-complement exercise 3 has independently identified question and reply blanks on PDF92. References complete the source prompts grammaticality-wise and are editorial/non-unique. |
| Grammar explanations | PASS | Seven Chinese source paragraphs and Vietnamese translations checked at PDF81,82,84,85,90,91,93. Meaning preserved, including non-durative time elapsed and both question forms of potential complements. Minor punctuation normalization is immaterial. |
| Picture dialogue blanks | PASS | All 19 references complete the correct prompt: L8 3+3+3 on PDF86,86,87; L9 4+3+3 on PDF95. Correct original scene and field bindings. References are examples rather than official keyed answers. |
| L9 review | PASS | Two vocabulary fields; 11 grammar rows with 22 independent understand/use fields; final effort reflection. First two grammar rows PDF96, remaining nine PDF97. All open and ungraded. Four-person classroom instruction and source-directed speaker/presentation fields preserved. |
| Medical/privacy framing | PASS in data | L8 medication reference explicitly says it only retells the character's regimen and is not medication guidance for learners. Other health references remain character-based textbook answers, without drug names or added dosages. L8 health discussion permits fictional scenarios and does not require real medical disclosure. Classroom/warmup notes allow fictional situations or aliases. Actual on-screen visibility remains the browser gate. |
| Vietnamese | PASS for AI editorial review | Newly added references and grammar explanations are understandable and semantically faithful. Existing Vietnamese is preserved. No claim of human/native-speaker certification. |
| Preservation | PASS | Independent recursive baseline comparison: no old L8 key/value changed or deleted; two additive contextSource objects correctly identify PDF81 and PDF84. L9 has exactly the two approved old-value corrections, in comprehensive Q2 and Q7. All existing texts, vocabulary/POS entries, grammar/examples/practices, IDs, homework and supplemental listening remain intact. |
| Scoped corrections | PASS | PDF94/printed82 Q2 visibly says 那儿, not 那里; PDF95/printed83 Q7 visibly says 每年, not 年年. Both preserved source blocks and new prompts use the corrected wording. |
| Original figures | PASS | All 25 assets freshly rasterized with Inkscape and inspected at native 640×400 in the seven included contact sheets, independently of author's images. Source teaching semantics and alt text checked. Correct tennis equipment/court in L9 picture2; badminton uses shuttlecock/net; warmup court differs from ball; six warmups per lesson distinct; no answer letters or vocabulary solutions painted in warmups. Scene numbers/temperature are relevant, not answer labels. |
| Figure provenance | PASS | XML and pixels consistent with original schematic vectors. No embedded source scans, images, scripts or external assets. Correct counts: L8 13 and L9 12. No invented L8 text3/L9 text4 standalone source figure or L9 culture panel. L8 culture remains stethoscope/heart support with no fabricated playable video. |
| Hidden/reference grading | PASS in data; browser pending | 65 reference fields have bilingual referenceAnswer and no official answer/answerSource; 49 open fields also lack official keys. Read-only renderer inspection shows exact comparison restricted to official answers and non-unique reference feedback separately. No browser execution was performed in this review. |

## Visual observations, non-blocking

The figures are simplified schematics, as labeled, rather than source-photo replicas. The classroom ear-discomfort pose uses a hand beside the upper side of the head, and the runners use stylized suspended strides. These remain understandable in their text contexts; neither changes an exercise answer. No figure repair is required for the scoped semantic acceptance.

## Evidence separation and limitations

- `field-review-ledger.json`: coverage of every field and its inspected source/answer-page relationship.
- `figure-review-ledger.json`, `sheet-1.png` through `sheet-7.png`: every original figure and fresh pixel inspection.
- `structural-review.json`: actual recursive legacy-key differences, not an author preservation claim.
- `verify-frozen-candidate.py` and `independent-validation.json`: independent deterministic checks. The expected key strings were transcribed during visual source review, not copied from the author's validation script.
- Author notes and source maps were read as claims and cross-checked, not accepted as certificates. Historical reviewStatus notes remain historical, including wording about now-superseded L9 spellings.
- This review did not edit candidate content, run browser interactions, listen to audio end-to-end, certify persistence behavior, commit, push, or deploy. Source-content preservation does not establish migration/persistence safety. Integrated browser tests must still establish delayed references, independent saves/reloads, image zoom, layout/accessibility, correct page labels and prior-record read-only behavior.
