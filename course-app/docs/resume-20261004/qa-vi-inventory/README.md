# 越南语覆盖清单独立复核：等待新来源检查点

当前 **覆盖与身份检查 15/15 通过，来源一致性有 1 项真实 drift 待重生成**。主清单实际为 46,463 条字段出现/静态候选；它不是唯一语义单位总数，不是全站逐屏执行证书，也不是教材越南语核对完成数。所有教材语义决策仍为 `pending-phase-B`。

独立工具使用 Python base64/gzip 解码真实 fetch 分块，使用 ElementTree 解析原 SVG，不调用作者的 SVG tokenizer 或 JSON walker；只写本目录，没有修改生产、builder 或作者清单。

| 实际来源与检查 | 独立复核结果 |
|---|---|
| 旧 HSK1：4 个真实分块 | 360 question ID、3,836 个原始叶值、923 个主清单候选出现 |
| 旧 HSK2：5 个真实分块 | 360 question ID、4,188 个原始叶值、720 个主清单候选出现 |
| 旧 HSK3：9 个真实分块 | 640 question ID、7,606 个原始叶值、1,335 个主清单候选出现 |
| 总题目与绑定 | 1,360 个稳定 ID、15,630 个叶值、原 question pointer/数组序号、选项原序、answer index、答案及排序片段全部一致；主 semantic-consumers 也有对应身份 |
| HSK1 越南语判断选项/答案 | 186 个 schema 叶节点全入主清单，其中 89 个 `Sai` 保留明确 schema 身份 |
| 现行 HSK1 听力 | 600 个 options/optionFeedback 字符串保留原 question ID 与 option index |
| 明示 VI 的 JSON 字段 | 24,827 个原字段叶值按组件、pointer、实际值逐项核对，无遗漏 |
| 全部原 SVG | 452 个资产、1,243 个 text/title/desc/可访问性 attribute 节点由独立 XML parser 完全重现 |
| 当前课程 SVG | 438 个 approved asset ID；412 个实际越南语 desc 节点全入主清单，独立图元消费者与外围 JSON VI 字段分开绑定 |

三份题库的解码 JSON/gzip 摘要、实际 producer 及 fetch 路径都匹配。旧题库的评分实际比较原 option string 与 answer string，因此越南语显示修订必须保留原 option index/value 身份。旧课号 15/15/20 不等于上传教材 15/15/18 的逐课对应，本次没有制造教材映射。

412 个 SVG 越南语节点是图内 desc/accessibility metadata，当前没有越南语 SVG body text。外围 `img.alt`、figcaption 与放大框 description 由 lesson JSON/renderer 分别提供。它们都保留为独立出现，不因相同字串合并，也不冒称已实测屏幕阅读器。

`omission-counterexamples.json` 记录三个只在内存中做的必要反例：移除 89 个 `Sai`、只在旁表留下 412 个 SVG 字串、从主清单移除 2,978 个外部题库出现，均能用真实源解码/XML 值检出。没有改写作者文件，也没有冒称重新执行了已经替换的旧 43,073 条清单字节。旧总数未覆盖这些生产者，不能当作全站完成覆盖。

当前唯一来源差异是 `course-app/tools/package-unified.mjs`。盘点声明来源为 `8dff803cc2f8d1956d5853ef40073c670e265cc0`，当前打包故障修复后的文件 SHA256 为 `efc2e61e946eb6a53ab2a59e099b0dc349079ea9c4ab4c237fe09da99334976b`；它与该旧源树和生成输入账均不同。其余 836 个输入完全一致。root 已明确待新的 engineering sourcecommit 后按新 HEAD 重跑作者清单与独立检查，无需改变为 Git blob 读取模式。

作者 builder 已将不存在的 `sourceViews` 描述改为实际 `sourceColumnBinding`/`fieldTargetRefs`；当前生成的 consumer 文件尚早于这项描述修订，下一次真实重生成后才验收其新字段。当前冻结是待办状态，不是 final 来源验收。

证据为 `provisional-review.json`、`pending-status.json`、`omission-counterexamples.json`；`pending-freeze-manifest.json` 固定本轮暂态字节。独立复核脚本为 `verify-current.py`。所有正式语义对照、ASCII-only 未标语言候选、动态模板可达性及缺失中文源定位仍需 B 阶段处理，本次没有做教材译文裁决。
