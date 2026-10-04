# 最终 B 准备快照

工程来源为 `835e5bd41045655cc2724ba2ba59235064ff92cf`，tree 为 `a80360230b94da2a40a83c405a6bc06ea2f155f3`。实际当前 HEAD 与声明相同。按真实工作输入重跑 builder、18 项 validator 和补充原叶核查，837 文件均与该版本字节一致，drift 为0。没有使用新增 gitblob 读取模式，也没有修改生产内容。

| 结果 | 最终实测 |
|---|---:|
| 字段出现/静态候选 | 46463 |
| 唯一 recordId / semanticKey | 46463 / 46463 |
| 词义身份 | 1093 |
| H2/3 source activity | 918，真实 targetRef/fieldTargetRefs 关联全部落盘 |
| H1 source ID@version | 484 |
| 保留旧版 question ID | 1360，全部15630原叶、options/segments/answer index保留 |
| 当前 approved SVG asset | 438，其中412个VI desc元数据节点 |
| 分类 consumer bindings | 4293 =2495词义/活动 +1360旧题 +438资产 |
| 动态 template producer | 498；不是每个运行分支的穷举 |
| 检查 | 18/18通过；全部教材语言审核状态仍 pending-phase-B |

`final-target-identities.json.gz` 保存完整46463字段目标及4293消费者身份；`inventory.json.gz` 保存其实际值与来源。`semantic-consumers.json` 的918活动使用真实 sourceColumnBinding，旧占位 sourceViews 为0。旧 bank三个真实fetch链分别4/5/9块，SVG直接按approved manifest/SHA核实，不混入未加载替代分块或旧图元。

旧8dff prepared快照及其后1项package工具drift的身份记录保留于 `supplement-pre-checkpoint-status.json`、`SUPPLEMENT-PREPARED.md` 与 `supplement-before-final-rebuild-identities.json`。当时实际通过的日志保留原生成时间。当前结果是修复保存新工程checkpoint后的真实重跑，不用历史通过替代它。

三课输入仍是 H1 L4 752字段、H2 L2 458字段、H3 L10 588字段，共1798字段／747命名owner群组。精确教材VI、原页视觉证据、判断及改动尚未收集/批准。source-prep的原页转写不计正式VI语言审核。

试点必须落实 `supplement-consumer-coverage.json` 的9项兼容要求，尤其H1五冻结bank和mixed/controller指纹、原随机index、旧receipt显示版本、source context新version及H2/3无snapshot旧听力回退。旧H4没有本次官方教材，只能editorial/unmapped；旧版与新版同课号不视为同内容。

本轮是作者的最终来源和覆盖快照。独立复验由 `../qa-vi-inventory/` 保存，不在本目录自签语言accepted。正式B、发布构建和上线仍由根任务按其各自条件推进。
