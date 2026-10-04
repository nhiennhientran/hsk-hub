# HSK3 lessons 10–11 independent content/asset review

Date: 2026-10-04. Decision: **FIX REQUIRED: Vietnamese completion consistency.**

Scope: read-only review of the frozen lessons 10–11 candidate; no author files edited. Evidence accompanies this report. No commit, push, upload, publication, or browser test was performed.

## Frozen identities and successful checks

- L10 SHA256: `4a1086adabc3c0427c35ef64997099042f9996e2b55059c37968f848377de7c8`.
- L11 SHA256: `acd2f2933da5868c4405cde9a60ec45858e48b299a10c36181c93a20ac081593`.
- Independently compared every pre-existing JSON key/value recursively with baseline `9b7c76702e9724b4c647750138d800605254a116`: no changes/deletions, including original IDs and 30 homework questions per lesson. Four added top-level keys only: activities, illustrationManifest, grammarSourceExplanations, grammarPresentations.
- L10: 26 activities, 68 fields (24 official, 28 reference, 16 open), 14 figures. L11: 29 activities, 72 fields (24 official, 35 reference, 13 open), 13 figures. All 39 original source question/directive IDs bound. Activity/field IDs unique and lesson-namespaced. Existing renderer uses activity IDs and field IDs as save keys; no persistence/migration or reload test executed.
- Directly rendered and inspected actual textbook PDF98–115 and answer PDF14–16. Original word banks, listening choices, grammar explanations, source-specific comparison and classroom tasks align. No invented L11 culture/review panel. L10 culture video remains unavailable.
- Independently verified warmup/listening/word-bank official answer sequences against answer-page pixels: L10 BEDAFC / CBBBABBA / ACEDBDCBEA; L11 ACEDBF / ACCCCCCB / CADBEDBAEC. Page splits, odd-numbered listening tracks, and twice-listening instructions correct.
- All reference/open fields lack official answer/answerSource data. Non-unique responses have explicit editorial-reference labels. L10 education retelling is scoped to textbook; L11 life/work response properly separates literal text from inference.
- All 27 original SVG SHA256 values match their manifests. No embedded source images/scripts/external assets found. Independently rasterized original SVG files using Inkscape and inspected all seven `figures-*.png` contact sheets at 640×400 per asset. Recognizable source-task cues, correct warmup order, readable city labels, no answer labels on warmups, no material clipping or image-meaning blocker. Original illustration labels and pending review metadata are honest.
- Imported and executed existing `verifyActivities` directly: zero issues for both lessons. Did not run the author validator because it overwrites author evidence. Independent results are in `independent-checks.json`.

## Required fixes: Vietnamese prompt/reference consistency

Do not change the preserved baseline objects. Make these changes in the new `activities` layer only. Keep all activity/field IDs, Chinese source prompts, source references, field counts and assessment types unchanged. Where natural Vietnamese needs a different word order, move the whole relevant phrase into its Vietnamese blank/reference; do not teach 把 as an obligatory literal “đem”. Preserve the editorial/non-unique note.

1. **L11 grammar3-practice1**, `/activities/17/title/vi` should be located by ID (array index must be checked): current `Trước cuộc họp, ta phải đem ________` plus `kết nối xong máy tính` yields “phải đem kết nối xong máy tính.” Suggested title: `A: Trước khi cuộc họp bắt đầu, chúng ta phải ________. B: Được, tôi giúp bạn.` Keep reference `kết nối xong máy tính`.
2. **L11 grammar3-practice3**, title currently `Tôi làm ________ rồi đến văn phòng anh` plus `làm xong những việc này` yields duplicate `làm làm`. Suggested B turn: `Vâng, giám đốc Lưu. Tôi ________ rồi sẽ đến văn phòng anh.` Keep reference `làm xong những việc này`.
3. **L11 picture-dialogue3**, last turn in `note.vi` currently `Được, tôi đem mấy lá ________` plus `gửi xong email rồi đến ngay` yields “tôi đem mấy lá gửi xong email…”, which is ungrammatical and misrepresents sending email. Suggested turn: `B: Được, tôi ________.` Suggested `picture3-blank4.referenceAnswer.vi`: `gửi xong mấy email này rồi sẽ đến ngay`.
4. **L10 picture-dialogue1**, A's method turn currently `tôi đem ________` plus `ghi những chữ Hán chưa biết viết vào vở` yields “tôi đem ghi…”. Suggested turn: `A: Tôi có một cách hay: tôi ________, lúc rảnh thì xem lại.` Keep `picture1-blank2.referenceAnswer.vi`.
5. **L10 picture-dialogue1**, final B turn currently `Cảm ơn bạn đã đem cách hay này ________` plus `chia sẻ với tôi` yields an invalid verb/object order. Suggested turn: `B: Cảm ơn bạn đã ________.` Suggested `picture1-blank3.referenceAnswer.vi`: `chia sẻ cách hay này với tôi`.
6. **L10 picture-dialogue3**, first B turn currently `Bạn có thể đem ________` plus `đưa bài tập cho tôi` yields “đem đưa bài tập…”. Suggested turn: `B: Bạn có thể ________, tôi xem giúp.` Keep `picture3-blank2.referenceAnswer.vi`.
7. **L10 picture-dialogue3**, final B turn currently `tôi đem ________` plus `cho bạn mượn vở ghi` yields “tôi đem cho bạn mượn…” with the missing object before `cho`. Suggested turn: `B: Thầy cô đã giảng mấy câu này trên lớp rồi. Tôi ________; bạn tự xem trước nhé.` Keep `picture3-blank3.referenceAnswer.vi`.

The exact new-layer JSON indices can be located safely by stable IDs; avoid changing the corresponding old `grammar` or `sections` translations under the preservation contract. After edits, inspect completed Vietnamese sentences by inserting the new references into each changed prompt. This is a content check, not exact-string grading.

## Optional polish (not acceptance blockers)

- L10 grammar1-practice1/2/3 and grammar3-practice1/2/3 retain very literal `đem + object + blank` translations copied from old content. Their references can form understandable Vietnamese, unlike the seven required failures above, but smoother new-layer versions may translate full phrases naturally. For example grammar1-practice1 could use `Hình như tôi đã ________.` / `để thẻ học sinh ở nhà rồi`; grammar1-practice2 `Tài xế đã ________.` / `đặt hành lý của chúng tôi lên xe`; grammar1-practice3 `Khi soát vé, tôi mới phát hiện mình chưa ________.` / `để hộ chiếu vào túi`. Preserve the actual Chinese exercise and label these as natural Vietnamese translations.
- The table feet meet/cross the bottom edge in L11 text1/text3 drawings. This does not obscure characters, objects, or task meaning and is not a content blocker; extra bottom breathing room could improve polish.

## Re-review gates

Rehash both JSON files after fixes; repeat recursive baseline preservation, counts/IDs, verifyActivities, and the seven changed Vietnamese completion checks. Unchanged SVGs do not need repainting. Independent source/asset review can then pass if those checks succeed. Browser rendering, narrow viewport/accessibility, response save/reload/migration, audio playback and end-to-end homework regression remain integration gates and are **not claimed executed** here.
