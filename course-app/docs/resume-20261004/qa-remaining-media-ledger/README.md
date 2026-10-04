# A6 剩余原音台账独立核查

接受范围仅为：计数、stable ID、现行 source/原轨身份、真实 resolver 请求、逐目标 held 分区和诚实回退。作者冻结 `runtime-media-partition-ledger.json` SHA256 为 `859eb81ddd524752401c71a5225d2eee559e72dbced5d06ae4bc2b07556df349`，原轨 availability SHA 为 `6762490778e59232b8a26326dfcba4f89eaedc70499a720830987f34e8651f04`。本审查没有修改生产或作者文件，没有听辨、声调/母语者/设备认证，也没有批准任何新增精切。

## 实际口径

| 分区 | 词义 ID | 保留精词 metadata | 词回退 | 严格 CJK 句单位 | 已接受句片段 | 句整轨回退 |
|---|---:|---:|---:|---:|---:|---:|
| 旧 HSK2 L1–3、HSK3 L1 | 74 | 61 | 13 | 95 | 95 | 0 |
| HSK2 L4–6 pilot | 51 | 0 | 51 | 83 | 2 | 81 |
| 其余 26 课、9 批 | 624 | 0 | 624 | 818 | 0 | 818 |
| 合计 33 课 | **749** | **61** | **688** | **996** | **97** | **899** |

实际 canonical 目录 226+523=749 senses，每个目前恰有一个 lesson-local word source。749→749 stable-ID/sourceText/audioTrack/中文/拼音绑定通过；不要因此把同形多义项当作不同朗读次数。全词库按 `(level, lesson, head, group-track)` 有 44 个重复义项位置，表示元数据中同组同形复用，不能用于证明实际朗读次数。旧 61 个已保留词范围在当前 manifest 中恰是 61 个不同 track/start/end；新 26 课 477 个词义候选仅对应 443 个不同 raw 范围。

33 课有 738 课文行。JS 的 split/trim 和旧标点计数都得到 **1001 个 pieces**，严格 NFKC+CJK 口径为 **996**，由 535 单句行+461 多句子句组成；199 个多句父行与子句重叠，另有4个零CJK行。不能称1001是严格CJK句，也不能将父行和子句相加称完成片段。五项差异完整保留源中文：

* `hsk2-fltrp-2026:l10:text3:line7`、`:l13:text2:line5`、`:l15:text1:line2` 和 `hsk3-fltrp-2026:l10:text2:line7` 的“……”各被旧计数当成一块。
* `hsk3-fltrp-2026:l10:text3:line5` 的“（李老师给学生讲题。）”末尾“）”被旧计数另算一块。舞台说明源项仍在996中保留，不能据元数据宣布是被说出的对白或自动剪裁。

所以原 **688词/906句** 的词口径保持，句906只是1001−旧95的旧标点余额。严格新余额是996−旧95−新增2=**899**，正好等于pilot81+剩余818；没有删教材句子。675个尚未精切词=pilot51+剩余624，加旧hold13成为688。

## 实际检查及结果

`verify-runtime-resolver.mjs` 实际执行现行 `validateSegments`、`validateReviewedSentenceSubset`、`mergeSegmentData`、`originalSegment`、`sentenceSegments`、`isSingleSentence`。它不模仿另写一个 resolver。全749词/738行逐ID检查，旧61word/78parent/33child/13hold保留，新合并79parent/34child，**真正渲染的独立句ID是97**，不是79+34=113。新 L5 text2 line8 只有第2句有请求；母行和第1句没有精切请求，ordinal2保持。

全部749词的现行 audioTrack 都解析为 vocab，Track.text 与 word.sourceText 相等；全部课文原轨 kind=text 且 text编号相等。当前原264 MP3文件 SHA/bytes 与 manifest全部一致。这里独立重算文件身份，没有重复声学听辨或媒体全解码；作者availability的32旧轨新解码及232轨既有完整PCM证据作为明确来源分别保留。232个实际小模型raw文件SHA、固定模型 revision、无prompt/无previous conditioning选项也独立读取核对。

`verify-author-ledger.py` 对作者749word、996CJK句、5兼容块的集合、原文字段、来源、track/file/SHA、availability、精切范围和 resolver ID全量对比。全部688词/899句都是 precision=false、start/end=null、original全轨回退且有hold原因。pilot及九份remaining诊断的每条引用/原SHA/targetID匹配；旧13项仍保留原hold，不假装有新raw。已声明confirmed absent=0的范围是**没有据ASR失败断言个体原target不存在**，并非749词全部已被证明说出。

九批诊断实际有624词、597父行、396子句，共1617 target rows。唯一literal候选是477词/340行/238子句=1055，有父子重叠；340唯一父行中255属于单句，再加238子句，共493个非父子重复的**CJK单位候选**，仍全是held，不能改称493精切完成。301个唯一候选附加raw风险、754个无此附加风险也都缺候选实际边界及独立裁切审校。50个零/无效时长、非CJK残差、重复/半词、长跨度等原因按原诊断保留。

## 标签、缺源与尚待工作

现行词详情未精切时显示“本词独立原音尚待核验，可听所在整组原音。”和“听所在生词组原音”；实际请求来自该词 metadata 指定的整组原轨，主音频控件另标“整组生词原音”。有 metadata 所在组依据，**没有个体出声认证**。当前 renderer 没有独立的 absent-original-target 状态。没有本次原音内容证据确定某个 HSK2/3 word 原target不存在，不能把107个ASR未匹配词改成none-source或虚构不存在的ID。本审查未发现必须立刻修改生产的确定故障。

五个非CJK兼容块以“未建立spoken fragment、全轨仍可播”单列归档。若后续实际原音/source审校确认某ID没有原target，则应为那个ID加入明确absent-original状态并改掉“所在组”措辞；只有 metadata/ASR unmatched 不足以触发这个判定。所有本文unknown都不能翻译成不存在或已完成。

以下仍是实际未关闭范围，不会因台账被接受而消失：

1. **688词和899严格CJK句尚未全部精切。** 唯一raw观察、全PCM解码、SHA正确均不足以自动promote。按具体目标继续源语境/重复朗读/实际onset-tail/邻句侵入/真实crop及独立无prompt证据审查；不能凭安静区间或插值制造时间。
2. **旧13个hold单独复核。** 既有 source/小中模型识别、同音/数字等歧义仍保留；完整范围名单在作者ledger和本目录 resolver-review 的 legacyUnresolved 中，不并入26课诊断成果。
3. **旧46个音频支持文件引用没有恢复。** 本轮仅保留原已接受metadata/authority，并未重新恢复其ASR/波形/裁切文件；来源见 `../media-closure/asr-evidence/recovery-status.json`。新2句的独立source-frame gates和新raw另有实际证据，不能倒推46旧文件也已找回。
4. **旧H3 Chinese/English附录来源恢复仍blocked。** 新官方VI的中文/PY/POS/序号独立验收SHA9f015…与旧SHA33a9…分离；不冒称旧英文原页已经重新阅读。这个来源局限不代表264音频文件缺失，也不改变未知个体原target的判定。
5. **真人听辨、母语者/声调、实体设备仍false。** 本报告只运行Node/Python源码身份核查，不是新增原生浏览器/听力结果。

## 文件和复跑

* `independent-counters.json`：独立子审查的33课、738行逐项JS/Python口径比较、5例外、九批源ID/文本/拆句/冻结课SHA；SHA `1d28a2cf8c9b8e64ad509db622e130c870529f0e845c21c05e9c90035ccf9735`。
* `resolver-review.json`：实际resolver、749word/738line完整请求、fallback、97句ID和当前源文件SHA。
* `canonical-bindings-review.json`：749 canonical sense→lesson-local source绑定。
* `audio-asset-review.json`：264原MP3的独立actual SHA/bytes，明确未由本审查重新decode。
* `remaining-diagnostic-id-review.json`：9批1617原targetID、类别及493非父子重复句候选口径；0promotion。
* `independent-review.json`：全作者冻结逐项验收范围及明确限制；`freeze-manifest.json` 冻结本目录证据。

从仓库根目录运行：

```sh
node --experimental-strip-types course-app/docs/resume-20261004/qa-remaining-media-ledger/verify-runtime-resolver.mjs
python course-app/docs/resume-20261004/qa-remaining-media-ledger/verify-author-ledger.py
```

第一条会更新本目录resolver报告；第二条锁定当前作者ledger/availability SHA，输入变化会写报告前拒绝。这里接受的是1745个语义ID及5兼容块的**透明分区台账**，不是1745段原音精切/逐页新source认证。
