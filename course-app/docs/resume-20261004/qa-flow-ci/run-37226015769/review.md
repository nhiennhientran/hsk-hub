# 六任务 CI 独立验收：37226015769

[实际 run](https://github.com/nhiennhientran/hsk-hub/actions/runs/37226015769) 的六个 job 均 completed success。验收 exact head `dd8b22ccb1c1a9c41bc1243887f7a60558635782` / tree `e2c89f9c2029cec09d8a8bbb1315e9cd99ea225c`。本轮 236 个唯一 native cases 全部实际单次 passed，retry/skipped/unexpected/flaky/global error 均为 0。六份实际 ZIP 的 GitHub digest、下载字节 SHA256、CRC、路径安全、成员唯一和 exact head/run 均通过。

| 执行范围 | Chromium | WebKit | 合计 |
|---|---:|---:|---:|
| shared | 64 | 64 | 128 |
| retained | 35 | 35 | 70 |
| fresh | 1 | 1 | 2 |
| package | 9 | 9 | 18 |
| legacy | 3 | 3 | 6 |
| reviewed | 4 | 4 | 8 |
| font | 2 | 2 | 4 |
| 合计 | 118 | 118 | **236** |

retained 的 35 条来自其实际 CI copy，fresh 的 1 条单独执行。最后的 generic retained JSON 与 fresh copy 完全同字节，未重复计入。artifact 中从已提交文档带来的历史 local JSON/PNG 均不能替代本轮 scope 专属报告；审计逐报告要求 CI run/head metadata 相同。

| 六份实际 ZIP | Artifact ID | 字节数 | SHA256 |
|---|---:|---:|---|
| hsk-flow-package-retained-hsk1-chromium | 11312192190 | 5727954 | `3e6ae42f7180452f481d8774ef6fd7427fd2cec29b82c3364d777f919fd01512` |
| hsk-flow-package-shared-webkit | 11312132742 | 3095299 | `6ec65e7c9c382a2daf27b39fe071291d67245cd59d7be68bb2cbd01d59a641c7` |
| hsk-flow-package-shared-chromium | 11312047913 | 2897733 | `5fdddb635b1aed42ca0c620c4e8e53d6d9152f1500edb82b13cd7c574eaa8bc2` |
| hsk-flow-package-retained-hsk1-webkit | 11311813400 | 6097928 | `c69eda0fe412dd2cc9e36d2bc62d189e6f71122e47e5ccace3fdfb119199f151` |
| hsk-flow-package-package-webkit | 11311798066 | 7110716 | `c3fd3ce822335063e02a5a84693c95b12cece03bb15cc837dc8b36d593784200` |
| hsk-flow-package-package-chromium | 11311643900 | 6614845 | `a47b86087ede1a9ed0674dc8ee37aeab225a29905444f1adcbcece2a7f4264af` |

68/68 本轮原 PNG 均逐张以 original 尺寸打开读取，**字体视觉门已闭合**。四份 typed ledger 分别对应两宽度 × 两引擎；每份精确 24 个 stem pinyin、五张空 first header 表、17 个实际 PNG。字段与七份 current source JSON 精确匹配，PNG identity/SHA/尺寸和手工逐件裁决再次由脚本比对。两 package job 的真实日志均包含本轮 checkout head 和成功安装 `fonts-noto-cjk`，没有用 local tofu 证据作字体认证。

所有目标 Chinese/VI 标签、24 py 的声调/标点/全角空格括号均可见；五表的 first header 无文字或占位点，桌面视图可读完整列和原行。五表没有真正空 body cell，不作额外宣称。320 图的右列位于内部横向滚动区，截图裁切只覆盖左侧；1440 图另核完整列。L6 editable 表内固定宽度的原生闭合 select 默认提示末尾被截短，是已记录的控件外观限制，未遮挡教材字段、表头或拼音。

本结论限定于该 exact tree 的执行与目标字体图片。package/legacy 独立复核的 24 cases 已包含在本表中，不再相加。两个组装报告的状态均为 private checkpoint，`sourceDirty=false`；本次不是 release16 gate 或上线许可。当前完整核心 run 37226336569 另核，旧 ce374/core860 不替代它。

详见 [机器审计](audit.json)、[逐图裁决](visual-review.json)、14 份原始报告及组装报告。审计 `issues=[]`、`visualIssues=[]`、`allNativeGatesPassed=true`、`visualGatePassed=true`。

| 图序号 | 引擎 | 宽度 | Activity identity | 逐图裁决 |
|---:|---|---:|---|---|
| 1 | chromium | 320 | `hsk1-original-2026-l03-p017-summary-skills-01` | pass — CJK/VI readable; empty first header has no dot/text; nine row labels visible. Mobile crop shows left table region with intended internal horizontal scroll. |
| 2 | chromium | 320 | `hsk1-original-2026-l06-p042-classroom-table-01` | pass — CJK/VI readable; first header truly blank; two named-person rows and input boxes visible; wide-table right columns intentionally outside leftmost crop. |
| 3 | chromium | 320 | `hsk1-original-2026-l06-p042-classroom-table-example-01` | pass — CJK/VI readable; blank first header retained; one example row with Tiểu Ngữ and C/sủi cảo readable; mobile internal-scroll view. |
| 4 | chromium | 320 | `hsk1-original-2026-l07-p053-classroom-example-01` | pass — CJK and tone pinyin shíjiān readable; VI Thời gian/Ăn trưa readable; first header blank; one original example row retained; right columns outside mobile crop. |
| 5 | chromium | 320 | `hsk1-original-2026-l07-p053-classroom-table-01` | pass — CJK/VI readable; first header blank; all three Người/person rows visible; right columns intentionally outside mobile crop. |
| 6 | chromium | 320 | `hsk1-original-2026-l12-p087-text-1-listening-01` | pass — Both current field labels and VI readable; exact Wáng Yīfēi nàr de tiānqì and Wáng Yīfēi juéde tone text present; fullwidth blank parentheses/period render with CJK font; wraps fit card. |
| 7 | chromium | 320 | `hsk1-original-2026-l12-p089-text-2-listening-01` | pass — Both Yáng Tónglè zuótiān/jīntiān field pinyin and Chinese/VI labels visible; accented Latin and fullwidth blank parentheses render; mobile wrap stays within card. |
| 8 | chromium | 320 | `hsk1-original-2026-l12-p090-text-3-listening-01` | pass — Both Yáng Tónglè juéde and Yīshēng duì...Jīntiān...ba pinyin visible; quotation marks, CJK and VI label wraps readable, no tofu. |
| 9 | chromium | 320 | `hsk1-original-2026-l13-p096-text-1-listening-01` | pass — Both Bái Jiāyuè...Wáng lǎoshī and Wáng lǎoshī...nàlǐ mài bu mài shǒujī pinyin visible; Chinese and VI accents readable; wraps fit. |
| 10 | chromium | 320 | `hsk1-original-2026-l13-p098-text-2-listening-01` | pass — Both Wáng Yīxuě yào hē / hái xiǎng chī pinyin visible with tone marks; CJK/VI labels and punctuation readable; no clipped stem. |
| 11 | chromium | 320 | `hsk1-original-2026-l13-p099-text-3-listening-01` | pass — Both Liú Míng xiǎng chī/hē pinyin visible; Chinese and VI corresponding labels readable; tone marks and blanks render. |
| 12 | chromium | 320 | `hsk1-original-2026-l14-p104-text-1-listening-01` | pass — Both Chén Tiānzhōng...Wáng lǎoshī and zài huǒchē shang pinyin visible; Chinese/VI labels and parenthesis blanks render; wrap fits mobile card. |
| 13 | chromium | 320 | `hsk1-original-2026-l14-p106-text-2-listening-01` | pass — Both fullwidth blank prompts, Tóngxuémen/Hànyǔ and Chén Tiānzhōng/Wáng lǎoshī tones, Chinese and Vietnamese labels visibly readable with contained mobile wrapping. |
| 14 | chromium | 320 | `hsk1-original-2026-l14-p108-text-3-listening-01` | pass — Míngnián/Liú Míng/Wáng Yīxuě/nǚ’ér and háizimen/máng tones, both fullwidth blank groups, Chinese and Vietnamese visibly readable; no field overflow. |
| 15 | chromium | 320 | `hsk1-original-2026-l15-p113-text-1-listening-01` | pass — Lǐ Wén/nǎge cài and quoted Dàjiā pinyin, Chinese quote marks and both Vietnamese prompts visibly readable; mobile wrapping contains fields. |
| 16 | chromium | 320 | `hsk1-original-2026-l15-p114-text-2-listening-01` | pass — Ānní/nánpéngyou/qùnián and Wáng lǎoshī/Lǐ Wén tones readable; both Chinese and Vietnamese blank prompts wrap inside mobile card. |
| 17 | chromium | 320 | `hsk1-original-2026-l15-p116-text-3-listening-01` | pass — Bái Jiāyuè/Ānní/Běijīng and Wáng lǎoshī/Běijīng readable with all tones and fullwidth blanks; Chinese/Vietnamese contained mobile layout. |
| 18 | chromium | 1440 | `hsk1-original-2026-l03-p017-summary-skills-01` | pass — All three desktop columns and nine body rows visible with readable CJK/Vietnamese labels and controls; first header truly blank, no dot/text. |
| 19 | chromium | 1440 | `hsk1-original-2026-l06-p042-classroom-table-01` | pass — Four complete desktop columns, two named-person rows and six answer controls readable; blank first header has no dot/text, CJK and Vietnamese tone marks present. |
| 20 | chromium | 1440 | `hsk1-original-2026-l06-p042-classroom-table-example-01` | pass — Blank first header and one Tiểu Ngữ example row preserve C/A/B order; Thứ Hai/Ba/Bảy and sủi cảo/bánh bao/mì fully readable. |
| 21 | chromium | 1440 | `hsk1-original-2026-l07-p053-classroom-example-01` | pass — Blank first header, original single time row and all three time values visible; shíjiān/wǔfàn tones and Vietnamese headers readable. |
| 22 | chromium | 1440 | `hsk1-original-2026-l07-p053-classroom-table-01` | pass — Blank first header with three distinct person rows and all nine controls visible; complete Ăn trưa/Nghỉ ngơi/Tan học headers readable and contained. |
| 23 | chromium | 1440 | `hsk1-original-2026-l12-p087-text-1-listening-01` | pass — Desktop Wáng Yīfēi/nàr/tiānqì and juéde both readable; Chinese/Vietnamese prompt glyphs and blanks visible, controls contained. |
| 24 | chromium | 1440 | `hsk1-original-2026-l12-p089-text-2-listening-01` | pass — Desktop Yáng Tónglè/zuótiān/jīntiān tones readable; Chinese and Vietnamese day prompts complete, no field clipping. |
| 25 | chromium | 1440 | `hsk1-original-2026-l12-p090-text-3-listening-01` | pass — Desktop Yáng Tónglè/juéde and Yīshēng/Jīntiān quoted sentence readable with tones, fullwidth blanks and Chinese/Vietnamese labels. |
| 26 | chromium | 1440 | `hsk1-original-2026-l13-p096-text-1-listening-01` | pass — Desktop Bái Jiāyuè/Wáng lǎoshī and nàlǐ/mài/shǒujī tones present; both complete Chinese/Vietnamese prompts fit card without overflow. |
| 27 | chromium | 1440 | `hsk1-original-2026-l13-p098-text-2-listening-01` | pass — Desktop Wáng Yīxuě/yào hē and hái xiǎng chī tones and fullwidth blanks visibly present; Chinese/Vietnamese prompts readable. |
| 28 | chromium | 1440 | `hsk1-original-2026-l13-p099-text-3-listening-01` | pass — Desktop Liú Míng/xiǎng/chī/hē both fields and Vietnamese ăn/uống readable; blank groups and controls contained. |
| 29 | chromium | 1440 | `hsk1-original-2026-l14-p104-text-1-listening-01` | pass — Desktop Chén Tiānzhōng/Wáng lǎoshī and huǒchē tones readable; both Chinese and Vietnamese travel prompts complete. |
| 30 | chromium | 1440 | `hsk1-original-2026-l14-p106-text-2-listening-01` | pass — Desktop Tóngxuémen/Hànyǔ and Chén Tiānzhōng/Wáng lǎoshī/shénme tones readable; CJK/Vietnamese labels complete with contained wrapping. |
| 31 | chromium | 1440 | `hsk1-original-2026-l14-p108-text-3-listening-01` | pass — Desktop Míngnián/Liú Míng/Wáng Yīxuě/nǚ’ér and háizimen/máng tones visible; fullwidth blank and Chinese/Vietnamese labels wrap within card. |
| 32 | chromium | 1440 | `hsk1-original-2026-l15-p113-text-1-listening-01` | pass — Desktop Lǐ Wén/nǎge cài and quoted Dàjiā tones readable, both Chinese/Vietnamese prompts complete with quote/blank punctuation. |
| 33 | chromium | 1440 | `hsk1-original-2026-l15-p114-text-2-listening-01` | pass — Desktop Ānní/nánpéngyou/qùnián and Wáng lǎoshī/Lǐ Wén tones readable; Chinese and Vietnamese blanks complete without field overflow. |
| 34 | chromium | 1440 | `hsk1-original-2026-l15-p116-text-3-listening-01` | pass — Desktop Bái Jiāyuè/Ānní/Běijīng and Wáng lǎoshī tone marks readable; Chinese/Vietnamese prompts and blank glyphs present. |
| 35 | webkit | 320 | `hsk1-original-2026-l03-p017-summary-skills-01` | pass — WebKit mobile blank first header and all nine CJK/Vietnamese row labels readable; right columns lie within intended horizontal scroll crop, no placeholder dot. |
| 36 | webkit | 320 | `hsk1-original-2026-l06-p042-classroom-table-01` | pass — WebKit mobile blank first header, two named-person rows and input boxes visible; CJK/Vietnamese labels readable, right columns inside intended table scroll crop. |
| 37 | webkit | 320 | `hsk1-original-2026-l06-p042-classroom-table-example-01` | pass — WebKit mobile blank first header and Tiểu Ngữ/C example row readable; Thứ Hai and sủi cảo tone marks visible in intended left table crop. |
| 38 | webkit | 320 | `hsk1-original-2026-l07-p053-classroom-example-01` | pass — WebKit mobile blank first header and original single time row visible; shíjiān/wǔfàn and Ăn trưa/Thời gian readable in intended horizontal scroll crop. |
| 39 | webkit | 320 | `hsk1-original-2026-l07-p053-classroom-table-01` | pass — WebKit mobile blank first header and three separate Người 1/2/3 rows visible; Ăn trưa and CJK row labels readable, table right columns intentionally scroll off crop. |
| 40 | webkit | 320 | `hsk1-original-2026-l12-p087-text-1-listening-01` | pass — WebKit mobile Wáng Yīfēi/nàr/tiānqì/juéde tones and both blank groups visibly readable; complete Chinese/Vietnamese prompts wrap inside card. |
| 41 | webkit | 320 | `hsk1-original-2026-l12-p089-text-2-listening-01` | pass — WebKit mobile Yáng Tónglè/zuótiān/jīntiān and Chinese/Vietnamese day prompts readable; blanks and native dropdowns contained. |
| 42 | webkit | 320 | `hsk1-original-2026-l12-p090-text-3-listening-01` | pass — WebKit mobile Yáng Tónglè/juéde and Yīshēng/Jīntiān quoted sentence all tones visible; Chinese/Vietnamese labels wrap inside card. |
| 43 | webkit | 320 | `hsk1-original-2026-l13-p096-text-1-listening-01` | pass — WebKit mobile Bái Jiāyuè/Wáng lǎoshī/nàlǐ/mài/shǒujī tones and both Chinese/Vietnamese prompts readable without field clipping. |
| 44 | webkit | 320 | `hsk1-original-2026-l13-p098-text-2-listening-01` | pass — WebKit mobile Wáng Yīxuě/yào hē/hái xiǎng chī tones and fullwidth blanks visible; CJK/Vietnamese fields readable with contained wrapping. |
| 45 | webkit | 320 | `hsk1-original-2026-l13-p099-text-3-listening-01` | pass — WebKit mobile Liú Míng/xiǎng chī/xiǎng hē tones and ăn/uống labels readable; Chinese prompts, blanks and dropdowns complete. |
| 46 | webkit | 320 | `hsk1-original-2026-l14-p104-text-1-listening-01` | pass — WebKit mobile Chén Tiānzhōng/Wáng lǎoshī/huǒchē tone marks visible; CJK and Vietnamese prompts wrap inside card with complete blanks. |
| 47 | webkit | 320 | `hsk1-original-2026-l14-p106-text-2-listening-01` | pass — WebKit mobile Tóngxuémen/Hànyǔ and Chén Tiānzhōng/Wáng lǎoshī/shénme readable; Chinese/Vietnamese labels and blanks visibly complete. |
| 48 | webkit | 320 | `hsk1-original-2026-l14-p108-text-3-listening-01` | pass — WebKit mobile Míngnián/Liú Míng/Wáng Yīxuě/nǚ’ér and háizimen/máng tone glyphs readable; both prompts and blanks contained. |
| 49 | webkit | 320 | `hsk1-original-2026-l15-p113-text-1-listening-01` | pass — WebKit mobile Lǐ Wén/nǎge cài and quoted Dàjiā sentence tones readable; Chinese/Vietnamese quotation and fullwidth blank glyphs complete. |
| 50 | webkit | 320 | `hsk1-original-2026-l15-p114-text-2-listening-01` | pass — WebKit mobile Ānní/nánpéngyou/qùnián and Wáng lǎoshī/Lǐ Wén tones readable; CJK/Vietnamese labels complete inside card. |
| 51 | webkit | 320 | `hsk1-original-2026-l15-p116-text-3-listening-01` | pass — WebKit mobile Bái Jiāyuè/Ānní/Běijīng and Wáng lǎoshī/Běijīng tones readable; both fullwidth blanks and prompts visibly complete. |
| 52 | webkit | 1440 | `hsk1-original-2026-l03-p017-summary-skills-01` | pass — WebKit desktop all three columns and nine CJK/Vietnamese rows visible with eighteen controls; first header blank, no placeholder dot/text, complete glyphs. |
| 53 | webkit | 1440 | `hsk1-original-2026-l06-p042-classroom-table-01` | pass — WebKit desktop blank first header, four full headers and two named-person rows readable; all answer labels/control boxes visible. Native closed-select default prompt suffix is clipped by fixed column width, recorded cosmetic scope limitation. |
| 54 | webkit | 1440 | `hsk1-original-2026-l06-p042-classroom-table-example-01` | pass — WebKit desktop blank first header and complete Tiểu Ngữ C/A/B example row readable; all weekday and food labels preserve tone marks. |
| 55 | webkit | 1440 | `hsk1-original-2026-l07-p053-classroom-example-01` | pass — WebKit desktop blank first header, one original time row and all three time values visible; shíjiān/wǔfàn and Vietnamese headers fully readable. |
| 56 | webkit | 1440 | `hsk1-original-2026-l07-p053-classroom-table-01` | pass — WebKit desktop blank first header and three person rows with all nine answer controls visible; complete CJK and Ăn trưa/Nghỉ ngơi/Tan học labels readable. |
| 57 | webkit | 1440 | `hsk1-original-2026-l12-p087-text-1-listening-01` | pass — WebKit desktop Wáng Yīfēi/nàr/tiānqì/juéde tones and fullwidth blanks readable; complete Chinese/Vietnamese prompts and dropdowns contained. |
| 58 | webkit | 1440 | `hsk1-original-2026-l12-p089-text-2-listening-01` | pass — WebKit desktop Yáng Tónglè/zuótiān/jīntiān tone glyphs readable; both Chinese/Vietnamese day prompts complete with blanks. |
| 59 | webkit | 1440 | `hsk1-original-2026-l12-p090-text-3-listening-01` | pass — WebKit desktop Yáng Tónglè/juéde and Yīshēng/Jīntiān quoted pinyin readable; both Chinese/Vietnamese prompts wrap within card. |
| 60 | webkit | 1440 | `hsk1-original-2026-l13-p096-text-1-listening-01` | pass — WebKit desktop Bái Jiāyuè/Wáng lǎoshī/nàlǐ/mài/shǒujī tone glyphs visible; complete Chinese/Vietnamese prompts and blanks readable. |
| 61 | webkit | 1440 | `hsk1-original-2026-l13-p098-text-2-listening-01` | pass — WebKit desktop Wáng Yīxuě/yào hē/hái xiǎng chī tone marks visible; complete Chinese/Vietnamese labels and fullwidth blanks readable. |
| 62 | webkit | 1440 | `hsk1-original-2026-l13-p099-text-3-listening-01` | pass — WebKit desktop Liú Míng/xiǎng chī/xiǎng hē tones, CJK prompts and ăn/uống labels readable; fields fit card. |
| 63 | webkit | 1440 | `hsk1-original-2026-l14-p104-text-1-listening-01` | pass — WebKit desktop Chén Tiānzhōng/Wáng lǎoshī/huǒchē tones and both Chinese/Vietnamese travel prompts visibly complete. |
| 64 | webkit | 1440 | `hsk1-original-2026-l14-p106-text-2-listening-01` | pass — WebKit desktop Tóngxuémen/Hànyǔ and Chén Tiānzhōng/Wáng lǎoshī/shénme tones visible; both prompts and blanks complete with contained wrapping. |
| 65 | webkit | 1440 | `hsk1-original-2026-l14-p108-text-3-listening-01` | pass — WebKit desktop Míngnián/Liú Míng/Wáng Yīxuě/nǚ’ér and háizimen/máng all tone and apostrophe glyphs visible; CJK/Vietnamese prompts and blanks readable with contained wrap. |
| 66 | webkit | 1440 | `hsk1-original-2026-l15-p113-text-1-listening-01` | pass — WebKit desktop Lǐ Wén/nǎge cài and quoted Dàjiā tones readable; Chinese/Vietnamese quoted labels and blanks complete. |
| 67 | webkit | 1440 | `hsk1-original-2026-l15-p114-text-2-listening-01` | pass — WebKit desktop Ānní/nánpéngyou/qùnián and Wáng lǎoshī/Lǐ Wén tones visible; complete CJK/Vietnamese prompts fit card. |
| 68 | webkit | 1440 | `hsk1-original-2026-l15-p116-text-3-listening-01` | pass — WebKit desktop Bái Jiāyuè/Ānní/Běijīng and Wáng lǎoshī tones readable; both Chinese/Vietnamese prompts and fullwidth blanks visibly complete. |
