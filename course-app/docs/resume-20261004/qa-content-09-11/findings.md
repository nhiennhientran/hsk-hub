# Independent source review: lessons 9–11 (partial checkpoint)

Status: paused at parent-requested stage checkpoint. This is **not** a full acceptance or release approval.

## Completed checks

- Read PDF review skill; independently hashed the original textbook and answer PDF. Both matched the expected SHA256 values recorded in `checks.json`.
- Rendered textbook PDF76–100 (printed61–85) and answer PDF6–9 directly from those originals into this folder. Rendering does not mean those pages have been reviewed.
- Visually inspected **textbook PDF76–81 / printed61–66** and compared the lesson-9 candidate objectives, six warmup options/pinyin and intended image mapping, original four Xiaoyu tips, three dialogues, three grammar explanations/example sets, two dialogue-completion prompts, four listening question/option sets, and four comprehension prompts and reference translations appearing on those pages.
- Found no new confirmed mismatch in that inspected portion. Reviewed Vietnamese text communicates the Chinese prompt/reference meaning in this portion. Listening answer correctness still needs independent answer-book comparison; audio was not heard.
- The previously reported printed67 cloze correction now appears in the candidate as 小狗 / chó con. This reviewer has not yet independently read printed67 and does not claim its source confirmation.

## Resume point

Next: **textbook PDF82 / printed67** (`p082.png`), then printed68–69 summary tables and answer PDF6–7. Continue lesson10 printed70–77 and lesson11 printed78–85. Compare all 45 answer-key fields to the answer booklet; check original table topology and all 41 final crop pixels/hashes; finish pinyin and Vietnamese checks. Candidate text snapshots are saved as `candidate-9.txt`, `candidate-10.txt`, and `candidate-11.txt`; reload the live JSON before concluding because author edits may continue.

`checks.json` enumerates exactly which activities were compared and records candidate hashes at this checkpoint. The images are source render evidence only, not rendered app evidence.

No candidate/shared files were edited. No CI, audio listening, native-browser/mobile checks, Git commit, or publication was performed. No full-batch acceptance is claimed.


## 2026-10-04 autonomous execution: completed original-source review

The earlier partial checkpoint above is preserved as historical evidence. This new review independently reopened and hashed both original PDFs, rendered and visually read **all textbook PDF76–100 / printed61–85**, and read **answer PDF6–9**, including the image-based warmup keys. It reviewed all **104 activities / 113 fields**, **45 answer-key fields**, **68 ungraded fields**, and **41 original crops**.

### Confirmed blocker: restore the first cat on printed67

The original PDF82 / printed67 first cloze sentence is **“＿＿上有一只小猫，房间外＿＿一只小狗。”** The candidate and runtime currently incorrectly say 小狗 in both positions. The previous reviewer’s suggestion to change the first 小猫 to 小狗 was wrong; independent source reinspection establishes that the first animal is a cat.

- Activity: `hsk1-original-2026-l09-p067-cloze-01`.
- Paths: `activities[28].prompt.zh` and `activities[28].prompt.vi` in candidate and runtime lesson-09.json.
- Expected Chinese: `＿＿上有一只小猫，房间外＿＿一只小狗。`
- Expected Vietnamese: `Trên ＿＿ có một con mèo con, ngoài phòng ＿＿ một con chó con.`
- Rebuild script: the first prompt passed to `cloze(d,67,...)` in `content-09-11/build_candidates.py` must also be restored to prevent recurrence.
- No answer changes: the two keys remain E and A.

### Passed checks

- All 45 objective answer fields match the actual answer booklet, including continuation pages.
- The lesson-9 printed65 ordinal group is correctly `第一个，第二个，第一本`; the candidate/runtime are correct. The older author narrative about a repeated 第一个 is stale and is not relied on.
- Lesson-9 self-review retains 2 vocabulary rows, 10 content rows, separate understanding/use fields, and optional self-review/reflection. The first content row belongs to printed68; the remaining rows to printed69.
- Lesson-10 money reference table retains all 6 rows, 3 columns, printed order, values, and pinyin; `fields:[]` is appropriate. Three-person classroom instructions and the unavailable printed bonus resource 10-1 are preserved.
- All scene, picture and warmup crop semantics match their original source images. All 41 PNGs were independently reproduced from recorded page/coordinates at scale 2 and matched both their metadata hashes and present public copies. This verifies source crops, not app screenshot layout.
- Open-model fields remain ungraded, marked as editorial models, and carry non-unique-answer notes. Invented time/price/plan details are explicitly disclosed.
- Remaining Chinese prompts, options, grammar/example sets, dialogue copies, comprehension questions, activity instructions, audio track labels and page bindings were compared against original pages. No other substantive blocker was found in this batch. Vietnamese was checked only for paired meaning and the cat correction; the new official-Vietnamese full alignment remains phase-2 work.

### Acceptance boundary

`checks-complete-original.json` records exact reviewed hashes, all activity IDs, 45 field-level key checks, and 41 crop checks. **Full source-content acceptance is pending root’s cat correction and final-hash reinspection.** This review did not run CI/browser tests, hear audio, use physical devices, deploy, or certify final language alignment. No candidate/runtime/source originals were modified by the reviewer.


## Final hash reinspection after root correction

**Accepted for original-source content** at the hashes in `checks-postfix-original.json`. Lesson-9 candidate/runtime both hash `73c838700066dd38d9812e2874d268852acb7bc65aaa5297ead27cd1e93a984b`; first noun restored to 小猫 / mèo con, second retained 小狗 / chó con. The affected cloze activity version is `source-resume-20261004-reviewed-2`; keys E/A remain unchanged. Generator first-cloze source text is likewise corrected. Lessons10/11 retain their previously reviewed hashes. This supersedes the earlier pending-cat-fix status for these exact files only.

### Oral-entry follow-up proposal

The original oral role-reading/pair/group activities have no mandatory written response box. The website adds a written dialogue record; leaving it required blocks saving after a student has completed the spoken task. Recommend `required:false` for **17** specific single textarea fields: 5 lesson9 + 6 lesson10 + 6 lesson11. Exact IDs, source pages, and paths are in `oral-optional-proposals.json`. Bump affected activity versions and preserve generator regeneration. Written response/picture/cloze fields should retain their current requirements. The reviewer has not applied these optional-entry changes. Reinspect hashes if root applies them.
