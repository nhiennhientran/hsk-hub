# Phase A9 实际工程闭环清单

这是只读验收对照表，不是正式 release gate。`actual-gates.json` 对照当前授权计划 A1–9、旧计划16项及579页来源索引；每项证据记录实际路径、SHA、候选身份、计数粒度和未完成原因。根线程负责最终冻结、运行与阶段切换。本审查没有修改运行代码、正式验收文件、教材内容或生产站点。

当前 core 候选 `ce374837090017fd76e7e65ea8e6e1d95851a8db`，tree `09f9b5dd4ebb456c960103d679584f5b7bdc06c6`，在 [CI 37220700329](https://github.com/nhiennhientran/hsk-hub/actions/runs/37220700329) **860/860 实际通过**：688 unified、172 standalone，600旧身份、252新来源目录、8场景图库。零 skipped/retry/flaky。53+53 focused preflight 只有日志证据、WebKit startup1另有JSON，均不重复加入860分母。具体六份报告、ZIP和八张远端 Noto 样图由 `../native-catalogue/ci-37220700329-audit.json` 与 review 记录。

| 授权阶段 | 已接受范围 | 剩余闭环 |
| --- | --- | --- |
| A1 基线/恢复 | 真实2da生产1446 blobs；五个冻结HSK1文件；旧600身份、非空历史保护 | 最终合并源提交、远端核实与新冻结 |
| A2 HSK1 L1–3 | 原页/答案独立审阅、65活动/43字段/12原图、双宿主双引擎四宽度DOM | 新L3空表头专门字体图 |
| A3 HSK1 L4–8 | L4当前13原图；旧21 source-v2对象与10SVG保留；L5–8来源和接入 | 新L6/L7空表头专门字体图 |
| A4 HSK1 L9–15 | 15课总484活动/513字段/193官方key/150原图；24印刷拼音、17可选口语字段、版本与DOM | 24字段专门字体PNG复核 |
| A5 HSK2/3来源 | 已接受33课；H2附录；H3新版523稳定词义来源/POS及18课实际接入 | 旧中文H3英语附录仍未恢复，需保留明确来源限制，不能声称全部579页重新审阅 |
| A6 图/音/笔画 | 45场景/48原图绑定；357原MP3；671字形；两句精确源帧机器审阅；232剩余轨的来源/诊断 | 两句新runtime双引擎4例/引擎；其余诊断按现有9批形成实际accepted/held/fallback结论 |
| A7 学习流程 | 独立接受64个实际Chromium流程；48课1440题/240组保存；132听力、749词义遍历 | 当前合并源补充双引擎CI；原HSK1完整35例/引擎 |
| A8 兼容/恢复 | 4项合成存储检查；原HSK1 34 native、显式session备份1；private包9 native；27独立负例；1380旧公共文件逐字节保护 | 正常CDN旧入口3例/引擎；当前clean package9例/引擎；真实原35备份fixture |
| A9 工程冻结 | ce374 core860、有限远端字体样图；新fixture collection/typecheck；已接受打包守卫 | 新六job实际报告、源/包精确身份、专门远端字体PNG、媒体处置及最终冻结 |

579是六份**原中文教材/答案册**的579个唯一文件页键（518教材+61答案），索引各shard哈希完全匹配；不是三份新官方越南语教材的522页，也不是579页已全部独立语义接受。索引中340页仍写pending，后续独立批次报告单独保存，不能仅凭旧摘要推翻已接受批次，亦不能反向填成全页通过。额外新版H3词表审阅没有改写原来源，原英语附录缺口仍被明确识别。

音频粒度也分别保留：原H2/3 61精词、13hold、78父行、33子句对应95实际句子单位。新两句是两个指定源帧片段；颜色整词轨不是新增单次发音精切。688待精词义/660缺少父行范围的旧盘点不能由208轨ASR成功或两句native通过自动清零。可靠整轨可供学习，尚未审阅的诊断不能直接叫精准完成。人体听辨、声调、母语者、实体设备认证仍为false。

## 当前CI增量审查

`ci-delta-review.json` 记录当前workflow SHA `b9202648285c9c97c8eb5e11b30741cc60083c7e2ada96e7ab99204c4ef24964` 的有条件接受，未冒用旧SHA `94de…` 的34例排除版本。既有私有fixture wrapper实际收集原35例/引擎，配置和原spec使用同一HSK1 Playwright；WebServer默认configDir、绝对JSON路径与根cwd的copy均成立。新增partial显式outDir和owned字体config配套；mixed-preview与字体嵌套PNG上传目录已覆盖。

本审查实际只做collection/typecheck：retained70、partial8、字体4；两个新fixture的tsc均exit0。计划六job的native范围为每引擎64+35+1+9+3+4+2=118，合计236，**均是待执行数，不是通过数**。4项Node合成检查另列。先完整提交source/config/spec，再运行和审阅实际最终JSON、包inventory与远端字体PNG；代码或worktree继续变化后需记录新identity。

`course-app/docs/unified-final-acceptance.json` 当前不存在。本审查没有创建它，也没有标记16项passed。旧计划第16包含发布后线上验证，而当前packager要求生成release前16个status全passed；最终C15/C16必须明确发布前readiness和发布后实测记录的顺序，不能提前伪填线上成功。此事项不阻止已授权Phase A/B执行；生产发布仍须用户确认。
