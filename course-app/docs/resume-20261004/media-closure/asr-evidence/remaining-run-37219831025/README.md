# 26课 / 208轨实际 raw 诊断闭环

正式 run `37219831025`，head `3f7285359c2f7fc0c552157df68feb61c9758f53`。9 ZIP/208 原轨及其全量 16k PCM、26 当前教材 JSON 全部 SHA 匹配。模型、26固定依赖、选项、raw 和源比较完整记录均已保存。此批没有生成/批准精切。

| 目标层级 | 总数 | 唯一完整 raw 词边界候选 | 未匹配 | 多次观察 | 其他阻断 |
|---|---:|---:|---:|---:|---:|
| line | 597 | 340 | 250 | 1 | 6 |
| sentence | 396 | 238 | 148 | 6 | 4 |
| word | 624 | 477 | 107 | 21 | 19 |

行与子句有父子重叠，1055个 literal 候选不能相加成1055个独立精切。477个词义候选只对应 443 个不同 raw 范围；同音多词义不能伪计多次朗读。

严格 CJK 句子单位为818（422单句行+396多句子句）。旧标点计数823多出的5项是4个“……”行和1个舞台说明的末尾“）”；这不是教材正文缺失或自动删句。舞台说明本身也保留源条目、不得按正文说话片段自动剪裁。

10331个 raw word 中50个零/无效时长涉及23轨；14轨含非CJK语义，3轨同词频>=10，需源语域复核而非直接指称幻觉。301个唯一候选有额外raw风险，余下754个仍缺逐候选实际声学边界与独立审校。

当前全部208轨已有可播原音与诚实整轨/词组回退。未匹配、繁简/专名/数字差、重复、半词、零时长、跨度/语域残差均继续hold；不得据停顿、文字近似或单模型成功自动批准。此批0 production promotion、0真人听辨。

## 复核入口

- `artifact-download-ledger.json`：实际9 artifact IDs、ZIP路径/SHA与head。ZIP缓存不提交Git。
- `verified-collection.json`：逐原轨/全PCM/26源课SHA/模型版本/原始raw检查结果。
- 各批 `run.json`、`preflight.json`、`source-comparison-input.json`、`pip-freeze.txt`、`pip-install-report.json`、`tracks/*.json`：可保存的真实raw及依赖证据；不提交完整模型或原轨复制。
- 九份 `*-exact-source-diagnostics.json`：严格NFKC+CJK目标比较、原词timestamp引用与残差；不修教材、无词内时间插值。
- `diagnostic-summary.json`：分层计数、逐候选额外风险、35轨级guard、句数修正与原始SHA。

```sh
python course-app/docs/resume-20261004/media-closure/asr-evidence/verify-remaining-collection.py
python course-app/docs/resume-20261004/media-closure/asr-evidence/summarize-remaining-diagnostics.py
```

重跑首条命令需要尚存的实际ZIP缓存以亲验下载SHA；源track与raw JSON已保留，可另逐轨重新解码比对。后续精切需从此原始观察重新选择小范围、实际裁PCM、独立无prompt模型复核及原中文/相邻内容/边界审校，当前没有扩大原2句独立接受范围。
