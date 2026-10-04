# B10 HSK1 adapter：最终修订编号边界补充 v3

本版是 v2 后的有限补充。factory 原来允许最长 8,192 字符的 revisionId，而历史保存副本只允许 256 字符；一个已加载的超长修订可能在首次回答保存时失败。实现方在 factory 校验中补上 `revisionId.length > 256` 拒绝条件，并在现有 registry unit 增加 257 字符负例。本版匹配这次最终源/测试输入。

独立边界 probe 实际验证：256 字符 revisionId 能创建合成 registry，并经真实 homework30 controller 逐题回答、提交、primary store 保存及兼容层再校验；原评分仍为 10/10。257 字符在 factory 返回投影前拒绝；历史 presentation 的 257 字符编号也拒绝，已保存候选不变。

作者 27 个 targeted unit 和主代码/浏览器 fixture 两项 TypeScript 检查在本版输入上重新执行通过。`bounded-diff.json` 通过撤去唯一 guard 字符串重建 v2 registry 的完整 SHA，确认该生产文件只有这项变化；另外记录作者测试的精确补充和 v2 输入逐文件比较。十个原评分五库/engine/mixed 保护文件与 HEAD 及 v2 一致。

v2 已执行的 14 个独立 pipeline probes、5,519 个 mapper 指针、700 个原 options index 和 6 项浏览器 collection 保留为之前版本的实际证据；本版没有把它们再次复制或冒称重新执行。v2 中除明确记录的 registry guard/作者负例外，相关其他输入字节保持一致；`inherited-v2.json` 记录其源及证据身份。作者 27 个 tests 本次仍重新覆盖真实提交/历史等原测试族，额外独立 probe 专门覆盖新边界。

本次没有执行 active 修订资产分支或原生浏览器；collection 仍沿用 v2 的 6 项收集记录、原生执行为 0。官方译文接受、母语审校、人工听辨和部署均为 0，default registry 仍为 `active: null`。POS/来源标签继续待审。保存副本结构有效不认证教材语言或提交真实性。

v1/v2 文件均未回写。本目录 freeze 仅绑定本版补充证据与最终源/两项作者测试 SHA 集合；后续最终生产对照应使用本版 source SHA，并连同 v2 的范围限制阅读。
