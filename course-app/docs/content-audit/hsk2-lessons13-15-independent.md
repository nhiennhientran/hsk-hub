# HSK2 lessons 13–15: independent content review

Date: 2026-10-02 UTC. Reviewer: independent AI source/language/pedagogy reviewer, separate from the author of checkpoint `c9bd770`. Status: independently reviewed and corrected. This is AI editorial review with automated audio evidence, not qualified-teacher/native-speaker or human-listening certification.

## Evidence actually inspected

The reviewer read all three complete lesson JSON files, the content contract and author audit, then compared against every relevant original rendered textbook and answer page. OCR/ASR did not replace source-image inspection. Existing local originals and identities from `hsk23-source-check/source-manifest.json` were reused without redownload or external upload.

| Lesson | Actual textbook PNG pages inspected (one-based PDF) | Printed pages | Actual answer PDF page images inspected | Texts / blocks | Lexical records | Grammar / examples / completion tasks |
| --- | --- | --- | --- | --- | --- | --- |
| 13 | 127–135, every page | 112–120 | 17–18 | 4 / 23 | 13 | 3 / 9 / 9 |
| 14 | 136–144, every page | 121–129 | 18–19 | 4 / 20 | 14 | 3 / 12 / 9 |
| 15 | 145–155, every page | 130–140 | 19–21 | 4 / 24 | 12 | 3 / 9 / 9 |

All 12 source texts, 48 comprehension questions, nine objectives, six warmups, integrated word-bank tasks, all picture frames, tips, activity models and teacher/student instructions were checked. The 67 text blocks include two printed nonverbal scene-transition ellipses; lesson 15 also retains the separate leading ellipsis inside the teacher's later turn. Source contexts and audio-label provenance on preceding pages were checked, rather than assigning everything to the dialogue's page.

Lesson 15's two-page review retains all nine source grammar rows, their Chinese examples, separate 理解/会用 columns, both vocabulary fields and the improvement field. It was checked against PDF154–155 without collapsing the rows or dropping columns. Its warmup table description now correctly says the left activity column has no printed title.

Source objective keys confirmed against answer pixels:

- 13: warmup E/D/B/F/C/A; text1 A/B; text2 C/C; text3 C/C; text4 T/F, C/C; integrated C/A/E/B/D
- 14: warmup C/D/B/A; text1 C/A; text2 A/B; text3 A/B; text4 F/F, B/B; integrated E/B/C/D/A
- 15: warmup B/A/D/C; text1 B/A; text2 A/C; text3 C/C; text4 F/F, A/B; integrated D/C/A/E/B

## Language, source fidelity and explicit ambiguity

All printed Chinese dialogue/narrative lines and sentence/word-list pinyin are unchanged from the source-verified author checkpoint. Vietnamese translations, editorial example pinyin and POS/sense modeling were independently checked.

- 13: 笔 retains the printed measure sense “stroke”; 花 is the noun “flower”; 可能 retains the printed verb POS. The 间/问 and 日/口 contrast and 咖啡杯 composition tip are complete. 爱上中文课 means enjoying attendance in Chinese class. Vietnamese comparison wording for a journey over five hours faster was made natural without changing the degree or direction.
- 14: 包 has three explicitly printed senses/POS records, producing 14 records from 12 numbered headwords. 站 is the verb “stand”; the source gives no POS for 没意思, so its phrase classification remains editorial. All six compound-direction examples and their object-placement distinctions are preserved. Vietnamese follows Chinese 姐姐 as older sister rather than the source English's “cousin”. Printed gè/ge and erhua are retained.
- 15: 11 numbered entries plus the separately printed proper noun 颐和园 produce 12 lexical records. 好像 keeps the printed verb POS. The frequency-complement rules distinguish person/place names, ordinary thing nouns and pronouns; 有 expresses reaching a quantity or duration. Printed hǎohǎo, gè in 多个朋友 and distinct Hái shì/háishi remain. A substantive Vietnamese error in the integrated exercise was corrected: 你买的是什么时候的…… asks the departure time of the purchased ticket, not when the purchase occurred.

**Lesson 13 text4 question2 has a genuine source ambiguity.** The supplied key marks the statement about Bai Jiayue giving the teacher flowers False, but “我们班同学” is collective and does not establish whether she individually participated. The original statement and official False are preserved. A bilingual, explicitly supplemental `editorialNote` now tells learners what the key says and why non-participation cannot be inferred. No original homework/listening task depends on that disputed inference. The parent app worker has been notified to render this field beside the source question; this data review does not itself certify that UI integration.

No culture panel is printed in lessons 13 or 14. Lesson 15 preserves the actual textbook panel 中国240小时过境免签政策 and its video15-1 reference, while explicitly saying the video is absent and the historical topic is not current immigration/travel-eligibility advice. No nonexistent video content or substitute MP3 was invented.

## Original assessment review and repairs

The final three lessons contain 90 original homework tasks and 12 separate independent listening tasks. Every lesson retains the required 10 vocabulary/grammar MC, 5 ordering, 5 original-recording listening, 5 Vietnamese-to-Chinese choices and 5 manual Vietnamese-to-Chinese writing tasks.

- Replaced copied or near-repeated source assessment targets with different supported facts: teacher workload/readiness/feedback and gift occasion in lesson13; prior phone contact, upward movement, prior knowledge, surname and next action in lesson14; both students finishing, teacher response, the explicitly uncertain airfare explanation and the planned return together in lesson15
- Tightened lesson13's comparison direction. Replaced ordering items too close to classroom/source purchase statements with original family/store situations
- Removed an overlapping lesson14 listening distractor: meeting the sister earlier could coexist with liking Yifei on the first day, so it was not a valid wrong option. The replacement uses a clearly different elapsed time. Posture-change context now explicitly establishes standing up beside the seat
- Replaced lesson15's repeated weekly phone-call ordering with monthly flights, and replaced direct copied translation/manual situations. All five ordering keys were independently reconstructed
- Lesson15's 有 ordering had a legitimate alternate: 我没来这家饭馆有三个月了. The task now explicitly starts with 我有. Other prompts fix the legal placement of frequency phrases, the temporal phrase, and the online-purchase adverbial; they do not falsely claim all alternate Chinese orders are ungrammatical
- Made weak distractors more meaningful, including competing ticket types, 包 POS meanings, classifiers and the flower/bird likeness interpretation

Final homework MC answer positions (A/B/C): lesson13 6/8/6, lesson14 6/7/7, lesson15 7/7/6. Ordering chunk lengths: lesson13 6/5/5/5/5; lesson14 6/5/6/5/5; lesson15 5/6/5/6/6. Each is a full unique-index permutation with at least five distinct meaningful chunks and a key matching the explanatory sentence. Context, explicit starts and punctuation constrain accepted order.

All 15 manual-writing objects contain only id, part, prompt, focus and source. None contains answers, model sentences, explanation, options, tokens or Chinese answer chunks in the Vietnamese prompt/focus. Manual responses require manual grading and may have multiple natural translations. No teacher-only answer list was added to this audit.

## Original audio evidence

The independent reviewer read every segment of all 24 ASR JSON files, rehashed every original MP3 and fully decoded each with ffmpeg: **24/24 manifest SHA256 matches; 24/24 full decodes exit0 with no decoder errors**. Odd tracks map to the four texts; even tracks map to complete printed word lists. Shared POS senses correctly share their whole vocabulary recording.

- 13-1 through 13-8: source sequence and all lexical tracks accounted for. Homophone/script issues such as 尖 for 间 and 搬 for 班 do not override printed text. The 日/口 stroke distinction remains source-led
- 14-1 through 14-8: all source passages and list entries accounted for; 喂/位, name spellings, pronoun homophones and missing erhua are recognizer issues, not grounds to change Chinese/pinyin
- 15-1 through 15-8: exam completion and repeat-trip plans, Summer Palace activities, earlier return/ticket discussion and complete diary return plan are supported. 颐和园 appears phonetically as 仪合园/一河源 in ASR; the exact source proper name is retained. The airfare reason is explicitly the character's conjecture, not an asserted real-world cause

This establishes automated integrity, mapping and semantic-support evidence. It does not certify full human listening or native pronunciation.

## Validation and scope

- Focused assertions passed: all 90 homework part distributions, 12 independent items, 15 ordering permutations/unique chunks/key reconstructions, 60 MC keys/distinct options, odd-track links, supplemental provenance and 15 answer-free manual objects
- Source dialogue/narrative lines, printed pinyin, lexical records and all original source question wording/options/keys remain identical to the source-verified author checkpoint (apart from the added separate ambiguity note)
- `HSK_PILOT=1 node tools/validate-content.mjs`: zero issues. At this shared-workspace checkpoint it reported 21 lessons, 397 lesson-local lexical records, 84 texts, 64 grammar points, 630 homework tasks, 84 independent listening tasks and 100 sections; other HSK3 authors were still adding lessons
- These lessons contribute 39 lexical/POS-sense records. HSK2's 200 syllabus-alignment figure is not asserted to be its actual lesson-local vocabulary count
- Scope is these three lesson JSON files and this independent audit only. No application changes, other lessons, raw source packages, remote publication or deployment were performed
