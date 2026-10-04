# 两句已验原音的真实跨引擎 CI 复核

实际 run [37226015769](https://github.com/nhiennhientran/hsk-hub/actions/runs/37226015769) 的两个 package 作业均成功。Chromium 与 WebKit 各实际执行 4 项，合计 **8 passed、0 failed、0 skipped、0 flaky、0 retry**；逐报告及原生附件独立检查各 **51/51**。这些数字来自下载后的真实报告，不是计划数。

远端 head `dd8b22ccb1c1a9c41bc1243887f7a60558635782` 与本地 `4d08a314fd0be96536b32982f4eabe598b8bbd48` 的树同为 `e2c89f9c2029cec09d8a8bbb1315e9cd99ea225c`，已分别读取 Actions run 与远端 Git commit 验证。workflow 的内容 SHA-256 为 `843d4d60770a7a8333a5586dc36d9e58453dda89904e2e3e0e2b453647d1ae9f`，Git blob SHA-1 为 `840e0845dfd84c4b1c792637ecdbcd2167a54b44`，两种摘要指向同一文件。fixture、config、加载器、两个新清单及三个旧清单与此前固定版本一致。

| 真实测试范围 | Chromium | WebKit |
|---|---:|---:|
| L4 本句原音：来源、边界、整篇回退、seek/stop/路由/历史 | passed | passed |
| L5 第 2 句：原序号 2、无整行或第 1 句精切、边界及回退 | passed | passed |
| “颜色”保留待核验及所在生词组按钮 | passed | passed |
| 故意错误新校验值：两句关闭，旧词精切与整篇回退保留 | passed | passed |

首轮自然播放的非静音、非 seeking 原生事件如下。精确整数帧范围来自先前独立机器审校；原生事件时间属于浏览器媒体时钟。

| 已接受来源 | 帧范围（16 kHz） | 规定范围（秒） | Chromium 实际观察 | WebKit 实际观察 |
|---|---|---|---|---|
| `hsk2-fltrp-2026:l04:text2:line3` | 159680–197921 | 9.98–12.3700625 | 9.981244–12.369849 | 9.980221536–12.369953139 |
| `hsk2-fltrp-2026:l05:text2:line8:sentence2` | 572480–614240 | 35.78–38.39 | 35.780713–38.389887 | 35.7802905–38.389998276 |

四次自然播放的实际附件都只有对应原 MP3 URL，无媒体 error，末端观察到 paused/ended；完整后续原生附件保留自然播放前缀与再次播放操作。所有 JSON 附件从真实 Playwright base64 body 解码，按原字节 SHA-256 保存。两个 MP3 也直接从同一固定 Git 树读取，SHA-256 与两句清单的 `sourceHash` 完全一致。这不等于给每次浏览器网络响应另做摘要。

两份实际 ZIP 的摘要、字节数、全部 194 个成员 CRC、共享解压报告与本目录便携报告均逐字节核对。GitHub artifact ID 分别是 Chromium `11311643900`、WebKit `11311798066`，均明确绑定本 run/head。

原异步并发缺陷及修复证据仍在 `../qa-audio-asr-pilot/`：修复前第二调用可提前返回；最终加载器的共享 Promise 在延迟真实 digest、摘要失败及新可选 chunk 失败时都严格等待，保留旧 registry。两个 package 作业日志真实显示这四个必要 loader 单元回归通过。此处把历史独立 actual-body 证明与本轮真实 unit log 分开保存；没有声称浏览器额外注入了延迟 race。

`runtime-media-partition-ledger.md` 不在旧 `8dff803…` 的树中，已在本次等价 `4d08a314…` 树中，因而也在同树远端 CI head 中。本次未修改生产、fixture 或清单，未自行 git add/commit。

验收范围限于上述两条已接受机器片段的运行和回退行为。专项由 package 作业重新构建独立 outDir 并用 preview 运行；生产形态组装包的 public-path/播放验收由其他报告负责。它不新增精准音频，不核定“颜色”的重复次数，也不构成人耳发音、声调或设备输出认证。本报告仅断言两个 package 作业及 8 项专项成功，不代替全部 6 个作业的总验收或上线确认。

主要证据：`review.json`、`artifact-verification.json`、`package-job-steps.json`、两个 `*-job-log-excerpts.json`、`chromium/` 与 `webkit/` 中的原始报告、检查结果和附件。`freeze-manifest.json` 给出全部本目录文件的摘要。

从仓库根目录可复核已保存报告：

```bash
python course-app/docs/resume-20261004/qa-reviewed-sentences-ci/verify-browser-report.py --report course-app/docs/resume-20261004/qa-reviewed-sentences-ci/chromium/browser-results.json --project chromium --source-commit 4d08a314fd0be96536b32982f4eabe598b8bbd48 --output /tmp/hsk-reviewed-ci-chromium-recheck
python course-app/docs/resume-20261004/qa-reviewed-sentences-ci/verify-browser-report.py --report course-app/docs/resume-20261004/qa-reviewed-sentences-ci/webkit/browser-results.json --project webkit --source-commit 4d08a314fd0be96536b32982f4eabe598b8bbd48 --output /tmp/hsk-reviewed-ci-webkit-recheck
```
