# Canonical lexicon independent review

Review date: 2026-10-02 (UTC). Reviewer: independent canonical-identity reviewer, separate from catalogue author. AI source/identity review, not native-speaker certification.

Worktree base at review: `49ed229692e57d21cabdf3da03e2be639fffd99f`. The reviewed current lesson files include the lead’s final HSK3 lesson10 explanation corrections. Only the two catalogues and this audit belong to this review commit.

## Result and scope

- HSK2: 226 source records, 226 canonical POS/sense cards, 209 Chinese forms; 16 reviewed same-form groups, covering 33 records. Zero merges.
- HSK3: 523 source records, 523 canonical POS/sense cards, 487 Chinese forms; 36 reviewed same-form groups, covering 72 records. Zero merges.
- These are exact study-card/source counts under the content contract, not the books’ advertised 200/500 syllabus targets.
- All 749 lesson-local source records are mapped exactly once. Each canonical spelling, pinyin, Vietnamese gloss and POS matches its source record. Source word ID, lesson ID/number, text number, original full-list audio track, and complete PDF/printed-page/section/provenance object were compared exhaustively with current lesson JSON. No missing, duplicate, incompatible or stale binding remains.
- Every possible same-form repeated-sense group was independently reviewed from original word-list pixels. This covers all 52 groups and 105 records, not a sample. None is a repeated equivalent sense eligible for merging: 51 groups differ in printed POS (including 过, which also differs in pronunciation), and 打 retains two printed verbal meanings despite identical spelling, pronunciation and POS. All single-form records are already unique within their edition.
- No vocabulary text, translation, POS, source binding, source ID or canonical sense ID was changed in this pass. The catalogue changes replace generic draft reasons with page-specific findings and set independent/reviewed flags only after the checks. No catalogue regeneration was used.
- Study identity is edition-scoped. Shared spellings across HSK2 and HSK3 do not merge the two courses or migrate legacy data.

## Review method and limits

Read `docs/content-contract.md` and `tools/verify-lexicon.mjs`; used the independent verifier both before and after the review. Full content validation also checks unique lesson IDs and the 15/12-page source offsets, preventing a duplicate lesson-local ID from hiding in the mapping comparison.

Reviewed original PNGs at their supplied resolution, using original-resolution crops when a glyph or layout was unclear. The PDF101 mathematics rationale was additionally cropped to confirm 没看清楚要求. Source images/PDFs and temporary crops are not included in this commit or published. Vietnamese is editorial course copy, not asserted to be printed in the book.

Earlier separate lesson audits provide full lesson-source and language coverage. This pass independently closes catalogue identity and source-to-catalogue coverage; it does not claim a second fresh pixel transcription of all 749 records. The 105 repeated-form records were all independently checked against the printed word lists. No merge was inferred from Vietnamese equality or inequality: for example, 决定 has the same Vietnamese surface text for its verb and noun, but the printed v./n. distinction controls.

## Complete same-form decision ledger

### HSK2

Word-list pages independently viewed (one-based PDF; printed page in parentheses): 26 (11), 45 (30), 53 (38), 57 (42), 62 (47), 66 (51), 72 (57), 74 (59), 77 (62), 80 (65), 84 (69), 100 (85), 102 (87), 124 (109), 128 (113), 130 (115), 137 (122).

| Form | Stable sense suffixes | Independent reason to keep distinct |
|---|---|---|
| 还是 | l02-word06, l10-word12 | PDF26/printed11 labels the recommendation use adv. (had better); PDF102/printed87 labels alternative-question or as conj. Both háishi, but distinct printed POS and grammatical function. |
| 过 | l04-word01, l06-word12 | PDF45/printed30 prints neutral-tone guo, part., marking past experience; PDF66/printed51 prints guò, v., spend time/celebrate a birthday. Pronunciation, POS and meaning differ. |
| 快 | l05-word01, l05-word02 | PDF53/printed38 explicitly prints adv./adj.: hurry up versus fast. Keep the urging adverb and speed adjective separate. |
| 跟 | l05-word17, l05-word18 | PDF57/printed42 explicitly prints prep./conj.: with versus and. The prepositional companion and conjunction uses are distinct. |
| 画 | l06-word03, l06-word04 | PDF62/printed47 explicitly prints v./n.: draw versus painting. Action and resulting picture have different POS. |
| 往 | l07-word02, l07-word03 | PDF72/printed57 explicitly prints prep./v.: towards versus go. Directional preposition and motion verb are distinct. |
| 打 | l07-word05, l07-word06 | PDF72/printed57 prints dǎ, v., with two meanings: play (games) and hit. Preserve l07-word05 for playing a hand-based sport/game and l07-word06 for striking; identical spelling, pronunciation and POS do not erase this semantic distinction. |
| 运动 | l07-word08, l07-word09 | PDF74/printed59 explicitly prints n./v.: sports versus exercise. The activity noun and exercise verb remain separate. |
| 爱好 | l07-word17, l07-word18 | PDF77/printed62 explicitly prints n./v.: hobby versus be fond of. Possessed interest and liking action have different POS. |
| 开始 | l07-word19, l07-word20 | PDF77/printed62 explicitly prints v./n.: start versus beginning. The starting verb and initial-stage noun remain separate. |
| 比 | l08-word04, l08-word05 | PDF80/printed65 explicitly prints prep./v.: than versus compare. Comparison marker and comparing action differ in POS and use. |
| 花 | l08-word14, l13-word03 | PDF84/printed69 prints huā, v., spend; PDF128/printed113 prints huā, n., flower. Spending money/time is not the flower noun. |
| 笔 | l10-word04, l13-word08 | PDF100/printed85 prints bǐ, n., pen/pencil; PDF130/printed115 prints bǐ, m., stroke. Writing instrument and counted writing stroke are distinct. |
| 考试 | l10-word06, l10-word07 | PDF102/printed87 explicitly prints v./n.: take an examination versus examination. Taking the test and the test event have different POS. |
| 站 | l12-word09, l14-word01 | PDF124/printed109 prints zhàn, n., stop/station; PDF137/printed122 prints zhàn, v., stand. Place and standing action differ. |
| 包 | l14-word02, l14-word03, l14-word04 | PDF137/printed122 explicitly prints n./v./m.: bag, wrap, bundle. Preserve all three printed POS: container noun, wrapping verb, and package/bundle counter. |

### HSK3

Word-list pages independently viewed (one-based PDF; printed page in parentheses): 16 (4), 23 (11), 27 (15), 37 (25), 44 (32), 53 (41), 60 (48), 62 (50), 72 (60), 74 (62), 75 (63), 80 (68), 82 (70), 83 (71), 89 (77), 91 (79), 93 (81), 99 (87), 101 (89), 103 (91), 104 (92), 113 (101), 119 (107), 137 (125), 142 (130), 146 (134), 151 (139), 158 (146), 161 (149), 169 (157), 176 (164).

| Form | Stable sense suffixes | Independent reason to keep distinct |
|---|---|---|
| 好像 | l01-word12, l16-word06 | PDF16/printed4 prints hǎoxiàng, adv., seemingly; PDF158/printed146 prints hǎoxiàng, v., seem/be like. The earlier tentative adverb and later resemblance predicate are explicitly POS-distinct, even where Vietnamese glosses overlap. |
| 客气 | l02-word05, l02-word06 | PDF23/printed11 explicitly prints v./adj.: be polite versus polite. Preserve action/state-of-behaving and adjectival description separately. |
| 张 | l02-word21, l16-word20 | PDF27/printed15 prints zhāng, m., for paper/pictures; PDF161/printed149 prints zhāng, v., open (the mouth). Counter and opening verb are distinct. |
| 外卖 | l02-word24, l02-word25 | PDF27/printed15 explicitly prints n./v.: takeout versus offer a takeout service. Food/service noun and selling action have different POS. |
| 需要 | l03-word26, l03-word27 | PDF37/printed25 explicitly prints v./n. with the shared English gloss need. Keep verbal need and nominal need/demand separate; a shared gloss does not merge printed POS. |
| 特别 | l04-word13, l04-word14 | PDF44/printed32 explicitly prints adj./adv.: special versus especially. Property adjective and degree/focus adverb remain separate. |
| 比较 | l05-word13, l05-word14 | PDF53/printed41 explicitly prints v./adv.: compare versus relatively. Comparison action and degree adverb are distinct. |
| 打算 | l06-word02, l06-word03 | PDF60/printed48 explicitly prints v./n.: plan versus intention. Planning action and intended plan remain separate. |
| 行 | l06-word05, l06-word06 | PDF60/printed48 explicitly prints v./adj.: be all right versus capable. Acceptance/feasibility predicate and capability adjective are distinct. |
| 小心 | l06-word08, l06-word09 | PDF62/printed50 explicitly prints v./adj.: take care versus careful. Caution as an action and as an adjectival quality remain separate. |
| 急 | l06-word13, l06-word14 | PDF62/printed50 explicitly prints adj./v.: urgent versus be anxious. Urgency adjective and anxiety verb differ. |
| 决定 | l07-word12, l07-word13 | PDF72/printed60 explicitly prints v./n.: decide versus decision. Both Vietnamese fields say quyết định, but identical translation text does not justify merging the printed verbal and nominal uses. |
| 冰 | l07-word18, l07-word19 | PDF74/printed62 explicitly prints v./n.: freeze versus ice. Chilling action and frozen-water substance have different POS. |
| 声 | l07-word28, l07-word29 | PDF75/printed63 explicitly prints m./n.: a unit used for sounds versus sound. Sound counter and sound noun remain separate. |
| 习惯 | l08-word04, l08-word05 | PDF80/printed68 explicitly prints n./v.: habit versus be used to. Habit noun and habituation verb differ. |
| 感冒 | l08-word11, l08-word12 | PDF82/printed70 explicitly prints v./n.: catch a cold versus cold. Being ill and the illness noun remain separate. |
| 差不多 | l08-word22, l08-word23 | PDF83/printed71 explicitly prints adv./adj.: almost versus similar. Approximation adverb and similarity adjective differ. |
| 比赛 | l09-word10, l09-word11 | PDF89/printed77 explicitly prints n./v.: match versus have a match. Event noun and competing verb remain separate. |
| 练习 | l09-word12, l09-word13 | PDF89/printed77 explicitly prints v./n.: practice versus exercise. Practising action and practice exercise noun remain separate. |
| 只是 | l09-word16, l09-word17 | PDF91/printed79 explicitly prints adv./conj. Restrictive only and adversative only/but uses remain separate despite overlapping English wording. |
| 影响 | l09-word23, l09-word24 | PDF93/printed81 explicitly prints n./v.: effect versus affect. Effect noun and influencing verb differ. |
| 得分 | l09-word25, l09-word26 | PDF93/printed81 explicitly prints v./n. with the shared English gloss score (points). Scoring action and points scored remain POS-distinct. |
| 清楚 | l10-word04, l10-word05 | PDF99/printed87 explicitly prints adj./v.: clear versus know. Clarity adjective and knowing/understanding verb differ. |
| 把 | l10-word07, l12-word13 | PDF99/printed87 prints bǎ, prep., fronting an object in the disposal construction; PDF119/printed107 prints bǎ, m., for handled or splayed-legged objects. Grammatical marker and object counter are distinct. |
| 要求 | l10-word13, l10-word14 | PDF101/printed89 explicitly prints n./v.: requirement versus require. Requirement noun and requiring action differ. |
| 差 | l10-word15, l10-word16 | PDF101/printed89 explicitly prints adj./v.: poor versus be short of. Poor-quality adjective and lacking verb differ. |
| 明白 | l10-word24, l10-word25 | PDF103/printed91 explicitly prints v./adj.: understand versus clear. Understanding verb and clarity adjective remain separate. |
| 努力 | l10-word32, l10-word33 | PDF104/printed92 explicitly prints adj./v.: hard-working versus make an effort. Effortful quality and deliberate effort action remain separate. |
| 生活 | l11-word26, l11-word27 | PDF113/printed101 explicitly prints n./v.: life versus live. Life noun and living verb differ. |
| 变化 | l12-word17, l12-word18 | PDF119/printed107 explicitly prints v./n.: change versus variation. Changing action and change/variation noun remain separate. |
| 节 | l14-word03, l18-word03 | PDF137/printed125 prints jié, m., for class periods/lesson sections; PDF176/printed164 prints jié, n., festival. Lesson counter and festival noun differ. |
| 一块儿 | l14-word25, l14-word26 | PDF142/printed130 explicitly prints adv./n.: together versus the same place. Joint-action adverb and shared-location noun remain separate. |
| 根据 | l15-word09, l15-word10 | PDF146/printed134 explicitly prints prep./v.: according to versus depend on. Basis-marking preposition and reliance verb differ. |
| 经过 | l15-word25, l15-word26 | PDF151/printed139 explicitly prints v./n.: pass by versus process. Passing action and course-of-events noun remain separate. |
| 有关 | l17-word14, l17-word15 | PDF169/printed157 explicitly prints v./prep.: have something to do with versus about. Relational predicate and topic preposition differ. |
| 大概 | l18-word06, l18-word07 | PDF176/printed164 explicitly prints adv./adj.: probably versus rough. Probability/approximation adverb and rough-outline adjective differ. |

## Focused listening-explanation cross-check

Checked all nine current audio-linked questions/explanations in each of HSK3 lessons10, 11 and 12 (27 total: homework16–20 and listen01–04 per lesson). Read their linked textbook bodies, question/answer choices and Chinese/Vietnamese explanations. Compared all twelve complete auxiliary ASR `.text` outputs for tracks10–12 × 1/3/5/7. ASR corroborates track content but is not an exact-Chinese authority, and no fresh full human listening certification is claimed.

| Lesson | Text pages (PDF / printed) | Finding |
|---|---|---|
| 10 | 99/87, 101/89, 103/91, 104/92 | All nine questions and explanations supported. The mathematics-error rationale is failing to read the requirements clearly and answering several questions incorrectly. The book-return quote and post-explanation comprehension quote are faithful. No name-position example remains asserted as original audio content. |
| 11 | 108/96, 110/98, 111/99, 113/101 | All nine supported: revised meeting time/location, display→silent audio→quiet audio sequence, lunch decision after postponement, and the family constraints on moving. Statements about preparation and the original meeting time are directly grounded contextual inferences. |
| 12 | 117/105, 119/107, 120/108, 122/110 | All nine supported: no fixed replacement outing date, today’s umbrella exception, sudden wind/rain, weather adaptation, Beijing snowfall as the scope of 一次, and summer day/night comparison. No unsupported all-locations claim was added. |

Current lesson hashes used for this cross-check:

- `lesson-10.json`: `a43e5f2b020690d52b3dce0c1119dc5897eb68efe6a5c175cb22d66a38a7fa33`
- `lesson-11.json`: `3410c84ed3d532f1fe9c5c39d0b5b1ffe571b2127e47f7c299beef7386d2ac8a`
- `lesson-12.json`: `51ff6e46fc9a45728917e98de11ce92ba21c4f5f1ab4b91cdbbf717e0c5a7631`

### All eleven later-lesson ellipsis excerpts

Read the quote-triage report and independently verified every excerpt against original source-page pixels. The report contains eleven excerpt occurrences across ten questions. Each omission preserves order, speaker and factual scope; no inserted phrase or unsupported factual addition was found. Ellipsis is an editorial abbreviation, not a claim that the dots themselves were spoken.

| Question | Excerpt | PDF / printed | Result |
|---|---|---|
| l13:listen03 | 今天…请他们到我家 | 133 / 121 | Faithful abbreviated invitation after the earlier visit; omits birthday context without altering chronology. |
| l14:hw20 | 可以帮你…还书 | 137 / 125 | Faithful; only two afternoon classes leaves time to return the book, not a claim of no classes. |
| l14:listen03 | 过几天…会有…我打算再看 | 142 / 130 | Faithful; video availability and replay are future plans. |
| l15:hw16 | 过几天…看看 | 146 / 134 | Faithful future visit; does not imply a completed purchase or move. |
| l15:hw18 | 虽然不是最长…可是在历史上很重要 | 150 / 138 | Faithful contrast of length ranking and historical importance. |
| l15:hw20 | 下班后…晚饭…边吃边聊 | 148 / 136 | Faithful, same speaker and sentence; preserves after-work dinner-and-conversation arrangement. |
| l16:hw17 | 一会儿…一会儿… | 157 / 145 (also grammar158/146) | Faithful alternating actions; sleeping and climbing are not described as simultaneous. |
| l17:hw16 | 我怕…生气 | 167 / 155 | Faithful expression of the classmate’s fear; no teacher reaction asserted as established fact. |
| l17:hw16 | 一定觉得… | 167 / 155 | Faithful expression of that classmate’s belief, not independent narration of the teacher’s view. |
| l17:listen02 | 那个屋子里有些…书 | 169 / 157 | Faithful location memory followed by 我去找找. |
| l17:listen03 | 前天我看见家月了，她告诉我… | 170 / 158 | Faithful time and information source; preserves attribution. |

The focused checks required no further changes to lead-owned lesson files.

## Verification

- `npm run content:check`: PASS in release mode, zero issues. This includes both catalogues with `requireReview: true` and all 33 current lessons.
- `npm test`: PASS, 30/30 tests (final rerun after the lead added assembly/online-integrity regressions), including exact lexical binding coverage, independent-review gating and distinct verbal 打 senses.
- `npm run check`: PASS (TypeScript).
- Runtime/browser/package release verification remains with the implementation lead; this content-identity audit does not replace it.

Final verdict: independently reviewed lexical closure complete, with zero legitimate merges and all original source identities retained.
