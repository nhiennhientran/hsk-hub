# HSK2/3 逐 ID 原音与精细片段闭合台账

2026-10-04。`runtime-media-partition-ledger.json` 从33课当前中文内容、三个已接入片段manifest和10组正式raw诊断生成；每一个词义/句子 ID 都有当前原轨、哈希、源关联范围、播放器请求、精切状态、回退标签、hold原因和证据路径。词、源行、多句子句、实际可播原轨各自计数。

| 范围 | 词义条目 | 精词 | 整轨词组回退 | 含CJK源句单位 | 精细句片段 | 完整课文回退 |
|---|---:|---:|---:|---:|---:|---:|
| 旧4课：HSK2 L1–3 / HSK3 L1 | 74 | 61 | 13 | 95 | 95 | 0 |
| 真实pilot：HSK2 L4–6 | 51 | 0 | 51 | 83 | 2 | 81 |
| 真实剩余9批：26课 | 624 | 0 | 624 | 818 | 0 | 818 |
| 当前全33课 | **749** | **61** | **688** | **996** | **97** | **899** |

原计划1001“句”来自非空标点切分。与996含CJK源句差出的5项逐项保留在`nonCJKCompatibilityUnits`：4个“……”源行，及舞台说明“（李老师给学生讲题。）”的末尾“）”。这些不是额外汉字句子、不是丢失教材内容，也没有接受其朗读边界。舞台说明的含CJK部分本身仍保留、单列语域hold。尾括号的ID明确是台账后缀，不冒称教材或runtime既有句子ID。

未精细化的原29课为675词义（51+624）、901含CJK句单位（83+818）；只有指定的2句得到独立固定范围机器验收，剩899句回退。旧13词加675词得到688未精词。原29课的906标点单位正是901+上述5项，不能把其全部当作906句已听辨语音。余批1055个literal候选包含父行/子句重叠，477词义候选又只443个不同raw范围，均不能合计为独立精切成果。

| 示例稳定ID | 当前实际状态 | 可播行为及证明范围 |
|---|---|---|
| `hsk2-fltrp-2026:l04:text2:line3` | 新接受的固定机器复核句片段 | 原4-3.mp3的16k帧159680–197921；实际Chromium边界/seek/stop/history通过 |
| `hsk2-fltrp-2026:l05:text2:line8:sentence2` | 新接受的部分子句；保留原ordinal2 | 原5-3.mp3的572480–614240；显示“第2句原音”，母行/第1句没有伪精切 |
| `hsk2-fltrp-2026:l04:word16` | “颜色”原词条整轨已审，重复次数未知 | 当前保留原组轨回退；不增加single-pronunciation/repetition授权，不计新精词 |
| `hsk2-fltrp-2026:l07:word01` | 唯一literal观察但概率低/精切未审 | 可播放所绑定的原词组7-2.mp3；轨可播不等于已证明该词独立发声或安全词首词尾 |
| `hsk2-fltrp-2026:l10:text3:line7` | 原“……”源行，没有建立spoken片段 | 原课文轨可播；保留教材原文，不将省略号绑定停顿并冒称句切完成 |

264原轨的当前文件SHA/字节数全部实检一致。232轨此前已实际完整解码并比对worker PCM SHA，本次另对32旧轨完整解码落下16k PCM SHA/时长；全部可定位完整原文件。这只证明文件、轨和原组回退可用，不能替代本词/本句内容验证。台账因此分开记录`original.available`、`bindingEvidenceScope`、`targetOriginalSemanticPresence`与`precisionAccepted`。ASR未匹配不会被写成原声不存在；目前没有给出任一HSK2/3独立target确定缺失的内容证据，未知继续保持未知。HSK1的数字等独立媒体ledger继续单列，未混进本表。

两个新句范围的独立源/PCM复核见`qa-audio-asr-pilot/post-crop-review.json`（169检查），独立契约/并发/源ordinal复核见`partial-overlay-review.json`（30源检查+81负变异）。低概率raw词和仅6次观察使用的5字繁简映射完整保留；原中文、拼音和raw未改。18项必要unit及最终独立build后的4项真实Chromium回归通过；WebKit本地0项，仍待正式远端CI。机器验收不等于真人/母语者、声调或设备普遍认证，上线仍待用户确认。

旧H3英文附录原PDF未恢复（旧SHA33a9c743…），明确保留在`source-recovery/hsk3-original-recovery.json`。新官方VI版本中文/PY/POS/编号的独立视觉验收`qa-hsk3-official-source/review.json`只作分离的补充中文来源，不冒认找回原英语版。旧46个ASR/波形证据引用也没有伪恢复；新固定模型原轨/crop证据有自己实际run、版本、SHA和检查记录。

重建入口：

```sh
python course-app/docs/resume-20261004/media-closure/asr-evidence/generate-runtime-media-partition-ledger.py
```

该命令逐个检查当前原文件与当前教材、严格核对已接受源词句、重新完整解码旧32轨，再输出两份可审JSON。它没有promotion或教材改写功能；waveform、ASR、教材关联、runtime回退和独立机器验收始终分别记录。

独立全量台账复核已通过：`qa-remaining-media-ledger/independent-review.json` SHA `52200e951ea9235c89cae78f387a5074ffce285a2d65566ab86b9e3866723c7d`。亲验1745个含CJK stable targets+5兼容项、264当前原轨SHA/bytes、232真实raw SHA/固定revision/无prompt及每ID实际resolver请求/held分区；没有扩大precision或个体出声/真人验收范围。冻结清单SHA `b2dd021131bb6fa3bca0659cc7037bed7bd3206fe12cd1d650bff96331546b65`。
