# 六任务 CI 独立验收

[run 37226015769](https://github.com/nhiennhientran/hsk-hub/actions/runs/37226015769) 已完成独立验收：**236/236 unique native cases 实际单次 passed，68/68 Noto PNG 全部逐图读检通过**，无 retry/skip/flaky/unexpected/global error。六 ZIP exact digest/CRC/head/run 验证通过。验收 exact head `dd8b22ccb1c1a9c41bc1243887f7a60558635782` / tree `e2c89f9c2029cec09d8a8bbb1315e9cd99ea225c`，workflow SHA `843d4d60770a7a8333a5586dc36d9e58453dda89904e2e3e0e2b453647d1ae9f`。见 [完整独立报告](run-37226015769/review.md)、[机器证据](run-37226015769/audit.json)、[68 张逐件裁决](run-37226015769/visual-review.json)。当前 full core run `37226336569` 另行验收，不用旧 ce374/core860 替代。

实际 collection 基于 fixture source `8dff803cc2f8d1956d5853ef40073c670e265cc0` / tree `422f45046960d6148075ee81d891f0569839441c`，workflow SHA `b9202648285c9c97c8eb5e11b30741cc60083c7e2ada96e7ab99204c4ef24964`。七份 CLI 日志和 [expected-collection.json](expected-collection.json) 保存实际 project/file/title 身份，不以旧报告推断。

| 实际收集范围 | 每引擎 | 两引擎 |
|---|---:|---:|
| shared 学习流程 | 64 | 128 |
| 原 retained HSK1（现有密码 fixture wrapper） | 35 | 70 |
| 显式 test-session fresh backup | 1 | 2 |
| package closure | 9 | 18 |
| normal-network legacy entries | 3 | 6 |
| reviewed partial-sentence/fallback | 4 | 8 |
| printed field pinyin / empty header | 2 | 4 |
| 合计 | **118** | **236** |

本 workflow retained 已切到现有 `run-checkpoint.mjs` wrapper，执行原 35 条；不是此前排除密码案例的 34 条口径。fresh 另执行 1 条并单独保存报告。其最后的 generic `hsk1-retained-results.json` 是 fresh copy，不能再次计入。

[collect-expected.py](collect-expected.py) 只 collect、独立输出日志，不执行浏览器。[audit-run.py](audit-run.py) 接受真实下载的 `run-metadata-final.json`（作为第二参数传入），校验 exact tree/workflow/七目标 source、六 job、六 ZIP digest/CRC/成员安全、scope 专属 14 份报告的 CI metadata、236 精确且唯一 identities、每条实际结果/重试/skip/error、assembly exact source，以及四份 typed ledger 对应的实际 68 PNG SHA/尺寸。所有手工视觉裁决初始为 pending，不把完整 PNG 集合当成字形通过。

Uploader 会同时携带提交到仓库的旧 local JSON/PNGs。审计只读取当前 job scope 应执行的报告，并要求 reporter metadata 指向当前 run 和 head。shared/retained 包里的 local source-font 证据以及 package 包里可能携带的旧 flow 材料不用于认证。两个 package job 的 source-font reporter/output 必须来自本次实际执行，不能引用 local tofu。

每个 source-font case 截取 12 个 listening card 和五个 table card；17 PNG ×320/1440 ×Chromium/WebKit =68。逐图人工读取需要核对该图 identity、全部 field pinyin/中越 label、空 first header、窄屏内部表格滚动与桌面完整表布局，并写具体裁决。五张表没有真正空白 body cell，不扩大宣称。Noto 的实际安装日志与 68 原 PNG 实际字形都必须验证，才能闭合这一项视觉缺口。

CI 与组装都是 private checkpoint；本审计不进行部署或 release 授权。旧 core860 仍仅认证 ce374 的既有范围，不替代新236与68张图。
