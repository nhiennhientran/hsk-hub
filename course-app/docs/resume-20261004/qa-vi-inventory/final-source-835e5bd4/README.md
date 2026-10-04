# 新工程检查点的 VI 清单来源与消费者闭合

独立复验 **passed-source-and-consumer-inventory**。来源为 `835e5bd41045655cc2724ba2ba59235064ff92cf`，树为 `a80360230b94da2a40a83c405a6bc06ea2f155f3`。本次只追加 QA 文件，没有修改生产或作者清单。

| 独立核验 | 实际结果 |
|---|---:|
| 原覆盖 15 项 + 来源一致性 | 16/16 通过 |
| 来源工作文件、记录摘要、固定 Git 字节 | 837/837 一致，旧打包工具 drift 已闭合 |
| canonical 词义与活动身份/字段引用 | 2,495/2,495 通过 |
| 旧练习题库身份、原选项序号及原叶值 | 1,360 题／15,630 叶值通过 |
| 当前 approved SVG 消费身份 | 438/438 通过；412 个 VI desc 保留在主清单 |
| 全消费者身份图 | 4,293/4,293，无缺项、额外身份或重复 |
| 完整目标清单身份、位置、实际值摘要与待审状态 | 46,463/46,463 一致 |
| 作者最终冻结产物 | 38/38 文件字节一致；整组冻结及目标核验 8/8 通过 |

消费者图恰为 1,093 个 word-sense、918 个 HSK2/3 source activity、484 个 HSK1 activity id@version、1,360 个 retained practice question、438 个 approved SVG asset。918 个活动的绑定逐项等于实际 `targetRef`、field ID/targetRef 与 `lesson-view.ts mapped(ref)` 的来源机制；旧 `sourceViews` 占位为 0。

主目标清单的每个 record ID、semanticKey、component、file、pointer/range、UTF-8 原值 SHA256 均与主 `inventory.json.gz` 一致。三个外部题库的真实 4/5/9 块 fetch 链、原数组位置、原 option/answer/segments 与 feedback/explanation 都已进入主清单及语义消费者图，未仅留在补充旁表。

历史 `../pending-status.json`、`../provisional-review.json` 和原 consumer pending 报告原样保留。历史暂态冻结 SHA256 仍为 `a7114cbe8decb73133cc0d920b636e68e74251d9a8d147a16aff6263fce06513`；没有把当时的 1 项来源差异或 918 个待生成绑定改写成当时已通过。

正式教材 VI 比较仍未开始。46,463 是字段出现与候选数，含冻结/有效投影、metadata、代码字面量及动态模板；不能计为全站教材对标完成数。未标语言的 ASCII、动态可达性、缺失精确中文语境及无教材对应的 editorial 项仍须在 B 阶段收敛。SVG metadata 不等于已认证的屏幕阅读器输出，静态 consumer 关系也不等于逐屏浏览器执行。A9 的 native/视觉验收由其他报告负责。

主要证据为 `closure.json`、`independent-review.json`、`consumer-binding-review.json`、`freeze-and-target-verification.json`。作者冻结 `vi-inventory/final-freeze.json` SHA256 为 `2e9a5d5fc2a06c5367382f997f35cfb1ffce87bd65ec25b4bdd8af058a4d9aba`。

可从仓库根目录完整重跑上述独立检查；输出只写本 QA 最终目录：

```bash
python course-app/docs/resume-20261004/qa-vi-inventory/run-final.py
```
