# Source-linked website comparison

All370 current textbook/source fields have exact current values and individual decisions in `website-comparison.json`. The underlying scope was independently extracted by another worker and each selected pointer resolved against actual files/display projection. This review accepts the105 official source IDs and supplies concrete source-linked wording proposals; the website currently still contains the old values.

There are55 proposed changes in108 effective textbook fields and77 in262 current source fields. These132 proposals include21 POS display-label policy changes and repeated shared instructions/options. They must not be reported as132 unique mistranslations.41 occurrences already match the accepted source/projection;197 are editorial and have no exact VI print counterpart within the reviewed nine pages.

| Current example | Proposed official value | Source |
| --- | --- | --- |
| Tôi có hai người con | Chị có hai con | PDF34/footer018/title |
| Cô ấy rất bận. | Dì ấy rất bận. | PDF35/footer019/text1 line2 |
| Tôi có hai anh trai, còn bạn? | Chị có hai anh trai. Em thì sao? | PDF38/footer022/text2 line1 |
| Nhà tôi có bốn người: bố, mẹ, em gái và tôi. | Nhà em có bốn người: bố, mẹ, em gái và em. | PDF38/footer022/text2 line4 |
| Năm nay cháu năm tuổi. | Cháu năm nay năm tuổi. | PDF40/footer024/text3 line4 |
| bố; cha | bố, ba | PDF38/footer022/word10 |
| con; trẻ em | con, trẻ con, trẻ em | PDF41/footer025/word15 |
| Cách biểu đạt số đếm | Cách diễn đạt các con số | PDF36/footer020/grammar2 title |
| Con trai Vương Nhất Tuyết năm nay mấy tuổi? | Con trai của Vương Nhất Tuyết năm nay lên mấy? | PDF41/footer025/question2 |
| Cách viết và đọc số từ100 đến dưới10.000 | Cách viết và cách đọc các số từ100 (kể cả100) đến10.000. | PDF37/footer021/number subheading; exact spaces are in JSON |

The title,21 vocabulary glosses/POS,14 dialogue bodies, goals, grammar prose, instructions, structured role prompts, question translations and numeric caption have accepted source bindings. Compound website titles and support text are explicitly labelled projections: only the source-derived component is official. Dialogue bodies omit the speaker prefix only because the current textbook renderer displays a separate Chinese role.14 exact accepted Vietnamese speaker names are provided in `speakerDecisions`; preserve the Chinese role and add a separately modelled Vietnamese role or compose the full official line once.

POS proposals retain the existing Chinese prefix and use the printed raw abbreviation as the Vietnamese primary value, for example `代词 · đt.`. This is a display projection, not a printed complete bilingual label. Do not change the existing Chinese/PY/semantic `pos` identity based on an inferred expansion. **多** needs special care because its raw abbreviation and explicit gloss differ by taxonomy. The existing Chinese/PY display revision already changes this target's `posLabel`; amend/compose that existing presentation change without a duplicate touched target/field. Its frozen producer value is `形容词 · Tính từ`, while the current effective parent is `代词 · Đại từ`.

The concurrently introduced inactive official-VI registry currently allows textbook fields `vn/vn_title/place_vn/desc`, and does **not** allow `posLabel`. The21 POS proposals require an explicit protected raw-POS display policy/field extension before implementation. They cannot be slipped into that existing manifest schema. Vietnamese speaker additions likewise need explicit display support; they do not authorize changing the existing Chinese `s` field.

Reuse must follow identities:

- Bind every accepted dialogue once, then project into textbook VN, current role prompts at activities21/23/27, duplicated grammar examples, actual word-detail scene examples and generated practice. These are context-specific matches, not free text substitutions.
- Bind vocabulary by stable bookWordId and catalogue/senseId.35 catalogue presentation bindings are supplied. A textbook display clone does not update active mixed/review catalogue cards; they need a validated presentation clone. Preserve frozen fingerprints and the five historical grading banks.
-120 generated-practice leaf occurrences come from an actual `practiceQuestions()` call.51 have concrete content parents; the rest include editorial, Chinese and PY fields. Regenerate current ephemeral questions after applying the parent corrections; do not count120 as unique VI phrases or rewrite archived assessment questions.
- The36 current activity objects are **13 source-v3-original-crops /11 source-v2 /12 source-v1**, despite the lesson's top-level v3. Every current activity has at least one proposal in this report. Use each actual `id@version` when planning its successor, retain old nonempty records/context snapshots, and never infer historical activity version from the lesson's top-level version.
-108 retained original-route effective fields have corresponding canonical decisions. Unified packaging replaces the lesson entry with the common engine. Do not mutate seven frozen legacy correction layers or assume every development route is publicly served.

Source edition locators need explicit labels. The accepted crop/source metadata points to the older Chinese edition, where footer024 is physical PDF39. The uploaded VI edition's footer024 is physical PDF40. Two feedback notes currently say only `PDF trang39`; proposals retain that original locator and explicitly add the VI one. The generic current/archive source-note renderer also says `PDF trang…` without edition. Correct its explanatory UI in B14; do not rewrite crop provenance or historical `context.source.pdfPage` to the Vietnamese offset.

Six shared UI-site changes are separately flagged for B14: the three number headings, the matching second sentence of the 二/两 explanation, 生词→Từ mới, and 小语助力→Tiểu Ngữ giúp sức. The separately read exercises heading has an additional recommendation. Verify shared use across other lessons before integration.

There are19 accepted source items with no direct current proposal:9 page furniture/lesson-marker items,3 full scene settings,3 number-read instructions,2 grammar-section labels and the example/bonus labels.86 unique accepted source IDs support a proposal, including the separately read exercises UI heading outside the326-site extraction. This is a coverage distinction, not proof of an incorrect translation. The website's short locations `Ở nhà / Ở công ty / Trên phố` translate its short Chinese place labels; do not replace them with a different full printed sentence. Add a separate full-setting field if complete setting coverage is required. Retain editorial numeric glosses, explanatory answer feedback, open-answer samples and extra vocabulary as editorial; no nonexistent printed VI should be manufactured for them.

This review made no runtime changes. It does not certify all197 nonprinted fields as linguistically correct, does not close B14 global copy review, and does not claim new browser/font acceptance. The previous A9 actual CI/Noto screenshots continue to prove their own exact bytes; post-language changes need their own affected checks and final C15 validation.

Final recheck found that the parent/author concurrently changed five producer/tool files while introducing inactive VI infrastructure. `verification.json` lists their original and current hashes and explicitly sets `consumerProducerFreezeStillExact=false`. Official PDF, author transcription and all370 current content/display values remain equal to this reviewed baseline. The new default registry was read and its checked-in `active` value is still null. These changed runtime producers require their own integration review; this proposal is not a certificate for them.
