# B10 HSK1 adapter：最终输入独立工程复核 v2

在 v1 四个工程缺口已修复的基础上，本轮重新绑定最终源文件字节，重新执行 14 个独立真实 pipeline probes、作者 27 个 targeted unit、主代码 TypeScript、浏览器 fixture/config TypeScript 和 Playwright collection。全部最终检查通过；collection 是三项测试分别配置 Chromium/WebKit，**6 项收集，0 项浏览器执行**。没有接受或启用官方教材译文，registry 仍为 `active: null`。

本次发现的测试配置问题：浏览器 fixture TypeScript 初次执行出现 4 项 TS2591，无法识别 `node:url` 和 `process`；实现方在专用 testconfig 明确 `types: ["node"]` 后，本轮独立复跑通过。初次诊断文本保存在 `initial-typecheck-failure.log`，不把首次失败写成通过；失败前 config 没有单独捕获 SHA。主代码类型检查当时通过。

另一个只读差异是 active loader 原先没有复用 default registry 的 root schema/白名单校验。实现方新增纯 `validateOfficialViConfig`，default/load 均先调用。最终 targeted unit 对 active 配置的错 schema、未知 root 字段、缺 entry、错 hash 做负例；这只接受配置守卫，**不声称 active 构建资产加载、缺失或损坏路径已全面执行**。

新课程总览消费者按 `course-index-lNN` owner 投影 `titleVi`；静态调用入口与专门单元测试确认中文标题和原 count 字段保留。专用 HTML harness 使用真实 receipt/archive/listening 模块和合成 registry，属于隔离测试材料，不是生产路由或语言审核。其脚本、配置和 spec 被记录为本轮输入；仅 typecheck/collection 不能证明渲染和浏览器行为通过。

`mapper-check.mjs` 实际生成 runtime mapper 字段，逐一解析原字节 JSON 指针、对比有效 VI 值、检查白名单与唯一 target，并对原 options 数组和原 index 另作检查；同时对作者 proof 的全部 descriptor 做逐项比较。结果如下：

| 登记学习字段 | 数量 |
|---|---:|
| 教材显示 | 841 |
| 课程总览 | 15 |
| 听力 | 995 |
| 词汇义项 | 344 |
| 旧作业 | 774 |
| 30 题作业 | 2,550 |
| 合计 | 5,519 |

5,519 个唯一 target 和原指针全部匹配。来源是原 textbook 811 个、既有 textbook display revisions 30 个、course-index 15 个、stage3 catalog 1,339 个、stage2 bank 774 个、homework30 bank 2,550 个；700 个选项叶均与实际原数组/index 一致，未登记含汉字的原答案选项。target set SHA 为 `e9815ffcd606eab61be3984942423c21997ce707e4236a05861369e3c365ff05`。

这些是当前 adapter 明确注册的学习叶，**不是整个网站的越南语总量**，也不是官方语言核对接受数。POS/posLabel 与 source.label 保留待审，不在本次 mapper 中。

v1 的四项缺口和原复测条件见前一版 `initial-findings.json`。本轮独立 14 probes 保留 capped history、旧 baseline/新 latest、跨课 reset、同钟逻辑提交、越界/跨上下文、中文选项与重复标签拒绝、完整 paired import/reset/restore、中断恢复、竞争 tab 和实际 UTF-8 字节预算检查。复核使用内存 storage 与模拟锁，不宣称真实浏览器 quota 容量。

`read-ledger.json` 记录明确输入的执行前后 SHA、相对 v1 的变化、保护文件与 HEAD 对照及所有命令/退出码；本目录 freeze 只绑定本轮独立 QA 证据，前一版文件未改。五库和五个评分/mixed 保护文件与 HEAD 字节一致，原答案、指纹、音频、中文/拼音及 ASR raw 没有由本轮改写。未知历史 revision 的保存副本通过结构校验不认证教材语言或提交真实性。

仍需后续阶段完成：真实页面/构建包及浏览器交互、正式教材 author/independent review、active 修订资产验收、启用与回滚 reader 策略。原生执行、教材译文接受、母语审校、人工听辨及部署均为 **0**。
