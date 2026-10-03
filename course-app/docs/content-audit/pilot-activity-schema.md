# First-lesson activity extension contract

The extension is additive to lesson schemaVersion 1. Old source text, bilingual layers and source identifiers remain available. It does not redefine homework or listening question schemas.

## Activity

- `id`: globally unique stable lesson-prefixed activity ID
- `kind`: `choice | matching | fill | open | survey | self-assessment`
- `title`: Chinese/Vietnamese Copy, often the complete printed grammar/dialogue prompt
- `source`: source textbook PDF/printed page, section and provenance
- `origin: textbook`: this activity corresponds to an original textbook task, not one of 30 supplemental homework questions
- `targetRef`: exact old node ID or a colon-suffixed child reference; renderer may match exact ID or the ID plus colon, never a loose substring
- `fields`: input records, each with stable `id`, bilingual `prompt`, `input: text | textarea | select | checkbox`, and `assessment: official | reference | open`
- For a select: `options: Copy[]`, `answer: string` equals the selected option's Chinese text, not its position or ABC letter
- For official keys: `answerSource: { document: hsk2-answers | hsk3-answers, pdfPage, item }`; these answer-source pages belong to a separate PDF, not the textbook offset
- For non-unique replies: `referenceAnswer: Copy`; do not grade by string equality or call it an official key
- `note`: bilingual disclosure or pedagogical guidance
- `illustrationIds`: ordered image IDs; individual fields can have `illustrationId` to bind the proper image to that field
- `targetRef` on a field maps to an original text question when applicable
- Listening groups additionally carry `audioTrack` and `recommendedPlays: 2`; do not reveal transcript/answer before listening submission in a test mode

A group can mix data location and page origins. Text questions keep individual old source references in their target nodes; the group source is only the first question's page. Do not count a whole text as one page just because its group source is on the opening page.

## Original illustrations

`illustrationManifest[]` holds `id`, `kind: original-illustration`, `originalTextbookImage: false`, source page metadata, `textbookRelation: {pdfPage, printedPage, owner, position}`, bilingual title/alt/description/label, `sceneKey`, `file`, `publicationStatus`, dimensions, SHA-256, authorship, rights statement and separate author/independent visual status.

`original-illustration` means a newly authored teaching schematic. It does not mean a textbook original. `file` is relative to course-app's public asset base; production must resolve it under the deployed course base. No PDF, screenshot or original scan is present in these assets.

Owners: `:warmup1`, `:sectionN` for exercise groups; `:text1` through `:text4` for scene aids; `:culture` for the HSK2 food schematic. Do not display a group image once per blank when multiple fields share one `illustrationId`. Preserve image numbering and group order.

Preserve the old section's non-question instruction/example/tip blocks when inserting activities; replacing all blocks with an activity can lose the printed role-play example. Source question paragraphs should not appear twice in the same view.

## Syllabus star

Pilot vocabulary has `supplementarySyllabus: boolean` and `appendixSource: Source`. The appendix source can fall outside the lesson's page range. `true` means starred as beyond the level's syllabus in the textbook appendix. It remains a valid textbook vocabulary item. Absence on later lessons means not yet checked, not false.

The two confirmed pilot stars are HSK2 接 (PDF158/printed143) and HSK3 服务台 (PDF188/printed176). The 42 pilot bindings preserve original word identity; canonical-sense keys and word counts do not change.

## Review status

`coverageReview` distinguishes new author visual inspection, independent review, UI verification, original-homework separation and known gaps. Never interpret older `reviewStatus` flags or a successful structural build as independent acceptance of added models and images.
