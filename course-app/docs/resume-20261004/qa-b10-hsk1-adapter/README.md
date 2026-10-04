# B10 HSK1 adapter：独立工程复核 v1

本轮复核接受已记录输入范围内的单元工程行为；四个实际负例已修复并复测。默认 `official-vi-registry.json` 仍为 `active: null`，没有接受或启用官方教材译文。此结论不替代后续真实页面、构建包和启用资产验证。

`probe.mjs` 是独立观察脚本，直接运行现有原评分 engine、controller、兼容校验、primary store 和完整双域备份协调器；使用作者的合成 registry 工具构造来源证据，不把合成证据当作官方教材来源。`results.json` 保存 14 个独立 probe 的最终结果，`targeted-unit.log` 保存另外执行的作者 25 个测试结果。`read-ledger.json` 标出本轮实际输入和保护文件身份；执行前后字节一致性只覆盖该明确列表。

| 实际发现 | 初始行为 | 修复后独立复测 |
|---|---|---|
| 跨课听力范围重置 | 保留课次已提交，但绑定引用导致候选被拒绝 | 第 1 课移除；第 2 课回答保留；历史副本保留，当前队列按真实剩余题缩减 |
| 20 条 capped history 后首次绑定合并 | 同钟同答案 21 次提交，first 可改为 latest | 错误合并拒绝；正好 20 次的 first=history[0] 合法 |
| 保存副本改写中文选项 | `/options/0` 指向“你们”时仍允许 VI 替换 | 实读原选项，拒绝中文选项作为 VI 叶 |
| 修订导致两个相同选项标签 | 两个 `Tạm biệt.` 被接受 | 全批拒绝，报告选项歧义 |

初始四项的源文件没有单独冻结。当时实现仍在编辑，不能回溯宣称初版输入 SHA 已验证；初始可复现条件和作者确认在 `initial-findings.json` 记录。最终修复版由本轮执行前后 ledger 绑定。

其他独立实际结果包括旧 baseline 首次保持 null、以后新显示最近提交单独绑定；旧 round 在新 registry 下继续 baseline；跨上下文或越界原选项 index 拒绝；非空完整双域备份导入、reset、restore 保留原评分与文案对应；primary 写入后模拟中断完整回滚，source 写入后模拟中断完整完成；两合作 primary tabs 竞争后，冲突 tab 的原答案与文案仍作为一致的 live-unsaved 候选可导出。

UTF-8 实测副本为 **7,805,513 字节**时接受，完整 AppData 为 **7,842,959 字节**；副本 **10,394,763 字节**时拒绝。这是兼容层与完整候选传输的容量约束验证。内存 storage 没有真实浏览器 quota，不能据此声称浏览器允许保存 7.8 MB；既有 H1 quota 失败保留 live-unsaved 的语义由 targeted unit 检查，本轮没有新增原生 quota 容量结论。

本轮只读确认了原评分五库和保护的 engine 文件与当前 HEAD 字节相同，渲染器调用保持 raw grading authority 与显示 DTO 分离；receipt 按 first/latest 提供文案数组，archive 按原 history 位置读取绑定，listening 显示选项按原 index 投影。本轮没有执行 DOM/原生浏览器测试，不能据此宣称截图、打印、可访问性或完整入口已经验收。

尚待集成验收的范围：独立/统一构建的真实入口、receipt/archive/listening 实际渲染与 shuffle 交互、非空浏览器备份恢复及真实锁/离页场景；active revision 构建资产缺失或损坏；正式教材逐项 author/independent review；启用前的新旧 reader/回滚策略。保存副本可保留未知历史 revision，其结构化通过不证明教材语言或提交真实性，也不构成完整防篡改认证。

没有提交、部署、开启 active 或改写五库；本轮新增文件只在此 QA 目录。原生浏览器执行、母语审校、教材译文接受、人工听辨均为 **0**。
