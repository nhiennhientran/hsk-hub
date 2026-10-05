# B10 完整越南语来源清单独立复核

本次在实际冻结 HEAD `c197ca63cef12f98755a30c9d6cce3a183b3c41d`、tree `b83fd52aff2f547681cf9c126ee0b196377f0797` 上执行提供的新 collector，退出码 0。全部 840 个实际输入的文件 SHA 与该 HEAD Git blob 精确一致；原 837 个输入全部保留，新增 3 个 adapter/presentation TS 模块。原历史清单 39 个证据文件，以及新目录原有 5 个 builder/probe 文件均逐字节保留。

| 项目 | 实测 |
| --- | ---: |
| 输入文件 | 840 = 837 原范围 + 3 新模块 |
| 字段出现／静态候选、唯一 recordId、唯一 semanticKey | 55,430 / 55,430 / 55,430 |
| 消费者绑定 | 4,293 |
| AST 目标 | 11,308；256 code/HTML 文件与 8 个 inline/gzip 虚拟程序 |
| JSON 指针记录 | 43,109；63 JSON 文件的 24,827 个命名 VI 叶全部覆盖 |
| HTML 来源字段 | 601；UTF-16 源码位置和值／ID核对通过 |
| XML/SVG 字符串节点 | 1,243；其中 412 个 VI 候选 |
| 旧版题目与原叶 | 1,360 题／15,630 叶，options、segments、answer index 全保留 |
| parse/decode／身份重复 | 0 / 0 |
| 正式 VI 激活／语义审核通过数／原生浏览器执行 | 0 / 0 / 0 |

新旧出现数增加 8,967，已准确拆开：8,962 个来自历史 AST 遍历漏项恢复，B10 runtime 源码带来净 5 个静态候选变化。新遍历恢复对象 `Property.value` 和方法 `MethodDefinition.value`，因此大量既存词库/保留路线数据生产者也被纳入，不能只用四条已知漏项描述完整增长，更不能把候选增长当作新增语义或已审核内容。

真实不变源码 `dom.ts` 从 0 → 2，`lesson-view.ts` 从 85 → 87，四条已知漏项均已收回。`main.ts` 旧来源完整 AST 应有 175 条，历史只记录 157 条；新来源是 176 条，即 18 条旧对象值漏项 + 1 条真实新增 VI。原 157 条全部仍在，且发生来源位置漂移，没有被当作文本遗漏。新 main 文案仅是当前课程标题／保存题目快照说明。

独立复核覆盖所有直接 JSON 值与命名 VI 叶、有效教材 clone 变更、所有 AST 目标、标准 XML 解析结果、旧版实际 gzip 全叶、全部消费者 source/field/asset/ID@version 绑定集合、完整 recordId 与 semanticKey。4293 个消费者身份为 1093 词义 + 918 HSK2/3 活动 + 484 HSK1 ID@version + 1360 旧题 + 438 SVG 资产。完整冻结目标身份保存在 `final-target-identities.json.gz`。

所有 55,430 条仍为 `pending-phase-B`，三门课 active registry 都是 null。此结果只证明给定检测规则下的来源提取、身份与兼容性；不证明所有 ASCII 越文、任意动态分支、真实页面可见性、正式教材翻译正确性、原生 DOM／辅助技术或发布验收。HSK4 无本次对应官方教材。历史 46,463 清单保留其原来源身份，不替代这次新候选。
