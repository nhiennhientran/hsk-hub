# 当前完整核心 CI 独立验收：37226336569

[实际 run](https://github.com/nhiennhientran/hsk-hub/actions/runs/37226336569) 的四个 job 均 completed success。Exact head `dd8b22ccb1c1a9c41bc1243887f7a60558635782` / tree `e2c89f9c2029cec09d8a8bbb1315e9cd99ea225c`。**872/872 unique main cases 全部实际单次 passed retry0**；skipped/unexpected/flaky/global errors 均为 0。10 个实际下载 ZIP 全部通过 GitHub digest/实际 SHA256、CRC、路径/成员安全和 exact run/head 核验。

| 实际报告 | 条数 | 运行秒数 | 单次 passed/retry0 |
|---|---:|---:|---|
| unified/chromium/shard1 | 175 | 995.46 | 全部 |
| unified/chromium/shard2 | 175 | 1366.00 | 全部 |
| modular/chromium | 86 | 382.39 | 全部 |
| unified/webkit/shard1 | 175 | 994.51 | 全部 |
| unified/webkit/shard2 | 175 | 1399.06 | 全部 |
| modular/webkit | 86 | 371.78 | 全部 |
| 合计 | **872** | — | **全部** |

这不是此前 860 的硬编码推断。实际 independent collection 和本轮 remote equivalence 均为 unified 350/engine，两 shard 各 175、disjoint exact union；modular 86/engine。八份 collection CLI 日志、tracked fixture/config/verify source 的 exact head SHA 均保留。六份 main reporter 的每条身份逐一匹配实际 collection，每条 result 原始状态/重试/错误逐项检查。

旧 ce374/run372207 的实际 860 passed identity proof 直接从本轮 Git head 读取并以 SHA 固定，每条身份均包含在本轮 actual passed 集合中。旧 600 baseline 同样完整保留；新增 source catalogue 63 ×两宿主 ×两引擎=252，覆盖全部15课 ×四宽度及跨课/历史 guard；gallery 2 ×两宿主 ×两引擎=8，实际执行原45scene/48crop binding、hide aria、route/audio lifecycle。新 font2 + partial4 ×两引擎=12 也实际执行。**没有把目录 collect 或环境失败当作产品通过。**

| 实际身份保留范围 | 当前 | 旧860 | 旧600 | Catalogue | Gallery | 本次新增 |
|---|---:|---:|---:|---:|---:|---:|
| unified/chromium | 350 | 344 | 279 | 63 | 2 | 6 |
| modular/chromium | 86 | 86 | 21 | 63 | 2 | 0 |
| unified/webkit | 350 | 344 | 279 | 63 | 2 | 6 |
| modular/webkit | 86 | 86 | 21 | 63 | 2 | 0 |

focused WebKit 原生启动定位案例的 actual report 为单次 passed/retry0，且严格核 `webkit | media.spec.ts | HSK 2 lesson 3 scene 4 all original sentences obey native boundaries` 身份；它已在 main 中，因此不增加 872 分母。两个 preflight 日志分别实际记载53 passed，属于重复执行；原 JSON 被后续 main reporter 覆盖，不把它们当独立覆盖。CI 按 matrix 条件跳过的步骤不是测试 case skip，main 六报告实际 skipped 均为0。

| 10 个已核实际 ZIP | Artifact ID | 字节数 | SHA256 |
|---|---:|---:|---|
| hsk123-reports-chromium-shard1 | 11312114953 | 122256 | `63e60bc7cbbe03c9eb7a699e4de8a9500ebc09bf5a1782e00377518083deea74` |
| hsk123-pilot-screens-chromium-shard1 | 11313325001 | 19073934 | `f98cbd81bd4f7b43a18cd974110451dea7465c4f8e9ddda281ff267d324cea94` |
| hsk123-reports-chromium-shard2 | 11312393783 | 171328 | `f7733ecda2fc08771647399e68482de0f03a38a078b042e6ee104fda00413c39` |
| hsk123-pilot-screens-chromium-shard2 | 11312662705 | 19862796 | `4fdf2adbf284d95c6488ff8fe14ecb4c7df18c2fb2785bf131849dbcf51539af` |
| hsk1-standalone-scene-chromium | 11313440501 | 19496293 | `f895aca2fab4eeaca47a1c297217917a0a220085e5421aea4af50a81408f051b` |
| hsk123-reports-webkit-shard1 | 11313105631 | 102086 | `debb37de425f931e8c2bd86c2dac79fc732d19057473fca61a658ec4dcb060d9` |
| hsk123-pilot-screens-webkit-shard1 | 11312269354 | 21178285 | `23926ac78064564287119ae48d2867599e13eaacec082f1f5d4072fe5e559f39` |
| hsk123-reports-webkit-shard2 | 11312746539 | 181544 | `945832cce6dea555653d287220876e3cc43d3432c10bb015ad33e5ecd0b07f9a` |
| hsk123-pilot-screens-webkit-shard2 | 11312541972 | 21558117 | `b7ad9a94c92235e359e48867a328eb6631e5e39a058be4ec8782876f3a59f9bb` |
| hsk1-standalone-scene-webkit | 11312382636 | 21242064 | `d0cfd9cc1d27959aad4b6743b97f4d720333d276d7eff5a883a5b7f62dc79746` |

[audit.json](audit.json) 保存六原始报告 SHA、872 个逐结果记录、四 job 和四真实日志的 SHA/关键行、身份保留及 overlap；[reports/](reports/) 保存未改写 raw reporter/equivalence/focused JSON，[passed-identities.json](passed-identities.json) 保存实际身份。审计脚本另经不同 reviewer 只读复核，详见 [script-independent-review.md](script-independent-review.md)。本轮实际 audit exit0、`issues=[]`、`allNativeGatesPassed=true`。

与同 exact head 的 [flow run236验收](../run-37226015769/review.md) 交集精确12条，详见机器审计内全身份；两 run 分别通过，不能宣称 872+236=1108 unique。两集合 unique identity union 是1096，表示精确project/file/title身份并集，不扩大为独立学习功能数。package/legacy复核24条已在flow236范围中，也不再相加。

字体正式证据来自同 exact tree 的 flow run：**68/68 fresh Noto PNG 全部逐件实际读检通过**，24 stem py 与五空首表头完整覆盖两宽度 ×两引擎。见 [逐图裁决](../run-37226015769/visual-review.json)、[68原PNG与ZIP映射](../run-37226015769/portable-screen-map.json)。没有把旧run或local tofu替代本轮字形认证。

本 core 又逐张读了10个新样本并保存原字节，涵盖两宿主/两引擎的 headerless 数字表、current L4原PNG、scene show/hide、中文/VI/pinyin。见 [逐样本与UI观察](visual-sample-review.json)。每份原ZIPmember==下载解压字节==原始便携副本，SHA可重核。**10是样本数，不声称逐图读取全部45场景。**

| 本轮图样本 | 实际读检 |
|---|---|
| [hsk123-pilot-screens-chromium-shard1--unified-hsk1-source-l04-320-table-0-part-0.png](screens/hsk123-pilot-screens-chromium-shard1--unified-hsk1-source-l04-320-table-0-part-0.png) | Headerless original number table left scroll slice: Chinese zero/one/two etc and líng/yī/èr/shí tones readable, intentional blank cells preserved; full table verified separately. |
| [hsk123-pilot-screens-chromium-shard1--hsk1-scene-hide-390-hidden-chromium.png](screens/hsk123-pilot-screens-chromium-shard1--hsk1-scene-hide-390-hidden-chromium.png) | Unifed Chromium390 hide state: original dialogue and scene image absent, UI Chinese/VI glyphs readable. Top practice VI suffix clipped in horizontal navigation; speaker labels crowded by sentence audio buttons. |
| [hsk123-pilot-screens-webkit-shard1--hsk1-scene-hide-390-reload-webkit.png](screens/hsk123-pilot-screens-webkit-shard1--hsk1-scene-hide-390-reload-webkit.png) | Unified WebKit390 reload/show state: actual textbook classroom scene photo visible with bilingual page3 caption; dialogue Chinese, pinyin and VI readable. Top practice VI suffix clipped in horizontal navigation. |
| [hsk123-pilot-screens-webkit-shard1--unified-hsk1-source-l04-1440-activity-11.png](screens/hsk123-pilot-screens-webkit-shard1--unified-hsk1-source-l04-1440-activity-11.png) | Unified WebKit1440 choice card: Chinese 王一飞老师有___个学生 and corresponding VI prompt, labels, history/source context readable and contained. |
| [hsk1-standalone-scene-chromium--modular-hsk1-source-l04-320-activity-11.png](screens/hsk1-standalone-scene-chromium--modular-hsk1-source-l04-320-activity-11.png) | Standalone Chromium320 choice card: Chinese/VI prompt and controls readable with contained wrapping. |
| [hsk1-standalone-scene-chromium--hsk1-scene-hide-390-reload-chromium.png](screens/hsk1-standalone-scene-chromium--hsk1-scene-hide-390-reload-chromium.png) | Standalone Chromium390 reload/show state: actual classroom photo, pinyin and bilingual dialogue/caption visible; current mobile standalone navigation wraps its practice caption. |
| [hsk1-standalone-scene-webkit--modular-hsk1-source-l04-1440-table-0-part-0.png](screens/hsk1-standalone-scene-webkit--modular-hsk1-source-l04-1440-table-0-part-0.png) | Standalone WebKit1440 headerless 0–99 table: full ten columns and ten rows visible; original blank cells retained, Chinese/VI caption and tones readable. |
| [hsk1-standalone-scene-webkit--hsk1-scene-listen-1280-hidden-webkit.png](screens/hsk1-standalone-scene-webkit--hsk1-scene-listen-1280-hidden-webkit.png) | Standalone WebKit1280 listen-hidden state: original dialogue and image absent, controls and CJK/VI readable; sentence audio buttons crowd speaker labels. |
| [hsk123-pilot-screens-webkit-shard1--unified-hsk1-source-l04-1440-activity-01.png](screens/hsk123-pilot-screens-webkit-shard1--unified-hsk1-source-l04-1440-activity-01.png) | Unified WebKit1440 current source-v3-original-crops L4 warmup: real older-man textbook PNG visible, Chinese/VI instruction/caption and history source context readable. |
| [hsk1-standalone-scene-chromium--modular-hsk1-source-l04-320-activity-01.png](screens/hsk1-standalone-scene-chromium--modular-hsk1-source-l04-320-activity-01.png) | Standalone Chromium320 current source-v3-original-crops L4 warmup: real older-man textbook PNG visible and fits card; Chinese/VI instruction/caption readable with contained wrap. |

以下 UI 事项在 dd8b 原图中仍存在，已明确移交 B14 文案/布局批，并要求 C15 发布前在修复后的实际浏览器再次验证；旧截图不能作为修复后证明。它们没有使本轮教材字体字段或 native state case 失败，也不能因此宣称整页布局无瑕。

- Unified 390 初始横向导航中，`nav.feature-nav a[data-view="practice"] span[lang="vi"]` 的 `Luyện tập & ôn tập` 后缀被视口截断。两引擎原图副本与 SHA 在样本映射中，手工定位矩形 `[260,156,118,78]`（x,y,w,h）标明原 PNG 审阅区域，**不是 CI 记录的 DOM bounding box**。中文和可见 VI 字形正常，无 tofu；当前 CSS 使用横向滚动，应结合最终文案修整换行或滚动可发现性。

- L6 editable table 内原生闭合 select 默认提示 `请选择 · Hãy chọn` 末尾在固定列宽被截短。严格选择器 `.activity-card[data-activity-id="hsk1-original-2026-l06-p042-classroom-table-01"] select`；flow fresh WebKit1440原图的第一控件审阅区域 `[208,453,176,57]`。完整教材 Chinese/VI field/header、24 py 字形可读；这是通用 UI 提示的排布。原图路径/SHA 已在 `uiObservations` 中固定。

- Hide/listen 状态的 `.textbook-line[data-line-id] > strong` speaker 与 `button[data-line-audio]` 行内布局拥挤，原音 button 遮到部分 speaker 后缀。原图已保留，original text/gallery 隐藏状态、aria与route/audio回归均实际通过；B14仍需修整该控件排布。

本审计限定于 dd8b/tree e2c 客户端；后续 tools-only package guard 或语言修正有各自 exact freeze/gate，不把本证书扩展到未来源码。生产 gh-pages 未改变；此处不部署、不授权 release16 或上线。
