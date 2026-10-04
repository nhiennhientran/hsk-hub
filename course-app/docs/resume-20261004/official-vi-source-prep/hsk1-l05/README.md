# HSK1 lesson 5 official Vietnamese source transcription

Source-only author reading of the supplied 148-page PDF, SHA256 `99ca3e635bbf99bcbbe003e32a0dbdf7ad0af2300b7380959d647e1028cf2764`. Lesson boundaries were visually confirmed: PDF43/printed027 opening to PDF50/printed034 activity/video. PDF51/035 opens lesson6. No website Vietnamese was read or compared in this source task.

All eight complete pages and a 4× word-table crop are retained with SHA256/bytes and exact renderer settings. The crop confirms original `đtnn.` for 会 and no POS beside 做饭. The source contains 141 printed Vietnamese occurrences, 22 ordinary word glosses, 21 actual POS labels, 14 role translations, three grammar explanations, five date example translations, twelve month and seven weekday labels, and one inline option gloss `đi làm`. Repeated print occurrences have separate source IDs; the count is not a count of unique semantic correction targets.

PDF44/028 actually prints the English running header `New HSK Course 1`, separately recorded in `nonVietnamesePrintedHeaders`, while PDF46/48/50 have Vietnamese headers. No header translation is invented. The video compound title has two separate printed Vietnamese spans. Nominal-predicate examples continue on PDF46, text2 word/instruction blocks on PDF47, and text3 translations/questions on PDF48; source layout relationships are recorded explicitly. Chinese-only examples/options/image descriptions remain documented as having no printed VI translation.

`source-transcription.json` preserves printed wording, case, accents, punctuation, role and ordinal bindings, physical VI line fragments and raw POS labels. Author completion is not independent acceptance: `independentReview` remains pending, active revisions remain absent, and no production data or scoring/audio/source bank is modified.

Reproduce source-raster verification with:

```sh
python course-app/docs/resume-20261004/official-vi-source-prep/hsk1-l05/render-source.py --pdf '/workspace/scratch/28b55072841a/upload/HSK1  (3.0).pdf'
python course-app/docs/resume-20261004/official-vi-source-prep/hsk1-l05/verify-transcription.py
```

These checks verify exact source-image and structural identity only. Independent original-page language review is a separate gate.
