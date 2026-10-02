# HSK3 lesson6 independent review

Reviewer: implementation lead, separate from author. Independent AI review, not native-speaker certification.

- Visually inspected all textbook PDF59–68 (printed47–56) pages and answer PDF8–9. Reviewed every Chinese/Vietnamese/pinyin field and assessment:4 full texts/26 lines,26 numbered headwords plus 北京南站 yielding31 POS records,3 grammar points/9 examples/9 tasks,10 integrated fill-ins,3 pictured dialogues,5 classroom prompts and all10 rows of the4–6 learning summary. Warmup images, 坐上 tip and12306 culture-video topic retained.
- Found two source-answer conflicts: answer PDF8 lists C for printed48 text1 question2 and printed52 text4 question1. Textbook options and full dialogue/narrative clearly support B (又快又舒服 / 高铁上很舒服). The original audio ASR also supports B. Retained the book questions and B, adding bilingual visible editorial notes identifying the supplied answer conflict; did not change the supplied answer PDF.
- Replaced an unnatural 换了打算 target with the natural noun construction 有了别的打算 and matching Vietnamese. Changed two added listening questions to distinct help/route comprehension targets. All five ordering items and manual-question separation rechecked; no Chinese answer is embedded in manual prompts.
- Corrected clothing classifier meaning in the review translation. Printed vocabulary readings 行xíng, 放假fàngjià, 常用cháng yòng and relevant optional sentence readings checked; verb/noun and adjective/verb source labels remain separate.
- All8 original6-1…6-8 MP3 files matched SHA256 and passed a fresh full ffmpeg decode. All8 complete ASR outputs checked against book text; homophone/name errors are not treated as authoritative. No claim of full human listening or native review.
- Exactly30 original homework and4 independent listening questions. Pilot structural validator passes with zero issues.

## Exact answer-conflict evidence

Answer source: supplied 《新HSK教程3》客观题答案.pdf, PDF page8, no separate printed page number. Its labels are `P48, 课文1` item(2) C and `P52, 课文4` item(1) C. The source PDF is unchanged and remains private.

- Textbook PDF60 / printed48: 李文觉得高铁怎么样？ Options A 高铁票很贵; B 又快又舒服; C 买票不方便. Supplied answer C; text-based correction B.
  - Printed supporting text (PDF60): 高铁又快又舒服，你一定会喜欢的。
  - Original track 6-1: SHA256 `1f99ef107dc1c539b5bb547d04c9c2b23e8f16355713b9326ae18789393ea9a2`; auxiliary ASR JSON SHA256 `8234ed8e31c5a55df5b2723efc0b909f82f035d1da28f03c39c1aaf29a76cd11`. Full transcript checked; it repeats the quoted comfort statement. All original bytes fully decode.
- Textbook PDF64 / printed52: 白家月觉得坐高铁怎么样？ Options A 高铁站很远; B 高铁上很舒服; C 高铁上人很多. Supplied answer C; text-based correction B.
  - Printed supporting text (PDF65): 我觉得坐在高铁上跟坐在家里的沙发上一样，又安静又舒服。坐累了就站一会儿，饿了就点外卖。
  - Original track 6-7: SHA256 `deb41b9e7f1d48194dc341e4deecc167f44b58e5607cfd432f0a9faa91e8ddec`; auxiliary ASR JSON SHA256 `2ff24aa6b1edf0b9e304421f88c62af483ccfa0bce7e090b93234246fd685784`. Full transcript checked; it repeats the quoted comfort statement. All original bytes fully decode.

Decision is explicitly labeled 按课文核订 on the site. Audio alignment here is from complete automated transcription cross-checked against printed source, not a direct human-listening claim; neither C is presented as a valid alternate answer.
