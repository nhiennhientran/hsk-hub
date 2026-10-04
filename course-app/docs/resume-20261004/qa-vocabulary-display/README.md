# 独立教材展示例句索引与历史兼容复核

当前批准的 34 项展示修订通过独立内容绑定及历史兼容检查。新旧例句锚点并存的拒绝校验已由 root 修复，最终 25 个目标测试全部通过；本轮工程复核验收通过。

## 已实测通过的范围

- 原五参数纯函数调用保持兼容；第六个可选参数仅加入经校验的展示修订。浏览器 loader 获取与主教材相同的 sidecar，四个请求传递同一 AbortSignal。
- 原教材、344 个稳定 sense、330 个原音请求及 14 个无独立原音记录均保持原值。三个原始输入文件与工程来源提交 `f8ef8ed5cf094dd230a30fd9c2dc0797497472c5` 的字节精确相同。输入先复制以防异步调用者变更；全部原始指纹通过后才调用展示修订函数。
- 逐一比对 34 项修订后的目标值、全部返回例句与主教材展示内容。60 个 sense 的例句内容或索引发生展示层变化，原 sense、record、lesson、audio 身份不变。
- 坐的原 grammar example 2 映射到展示 example 3；呢的原 example 1、2 映射到展示 example 1、3；想的原负句锚点映射到教材批准的“我哥哥不想休息。”。
- 原历史队列包含全部 344 个 sense，对其中 60 个受影响 sense 实际评分后导出、导入：评分与计划键、剩余 284 个待评分项、32 组不同时间/筛选/方向的实际队列以及继续评分结果精确相等。
- 作者的 23 个目标测试实际通过，含原 SHA、过期 expected、重复原句、未经批准替句、异步输入修改、只读、HTTP 失败及历史恢复负例。

## 实际消费者与验收边界

实际阅读 `hsk1-app/src/features/vocabulary/view.ts:renderCard`、HSK1 shared bridge 以及 `course-app/src/main.ts:drawCard`：混合词卡展示中文、拼音、越南语及原音，没有例句渲染。`examplesForSense` 当前属于 API 索引，不能把此次接入描述为混合词卡上的用户可见例句修复。

主教材词详情 `hsk1-app/src/features/textbook/vocabulary.ts:openDetail` 会直接显示修订后的当前课文首个包含词形的句子。全部相关绑定已核对，其中 30 个详情展示例句发生变化；本次未改变该渲染器，也未新增词卡功能。

本次不包含实体设备认证、混合词卡原生例句显示认证、新官方越南语全面对标，或历史来源/词义身份改写。

## 已修复的真实拒绝校验缺口

`anchor-ambiguity-review.test.mjs` 使用真实 `createVocabularyContent` 和当前冻结数据，仅在内存 sidecar 中加入原旧负句。批准新句与原旧句同时存在时，当前实现先找旧句，接受 overlay 并绑定旧句。将旧句放在开头、结尾均未拒绝；`anchor-ambiguity-before-fix.log` 记录两个实际失败。当前批准的 sidecar 不含这种并存，实际内容映射仍正确。

root 将原句与明确批准的替句统一收集为匹配位置，要求恰好一处匹配，因此两者并存或重复均拒绝；未发生展示修订的纯函数路径保持原样。修复后作者 23 个目标测试与本独立 2 个负例全部通过；完整 344 sense、60 处实际历史评分、32 组计划队列及 30 个教材详情例句检查也重新通过。生产文件 SHA256 为 `11285cbb3907225e79413ab0a902602935b16e312ea7bee9eaaccdb825bd8cbe`；34 项批准 sidecar 原字节未改。

## 可复现证据

- `verify-content.mjs`：只读输入，实际运行内容 API、原音解析、历史备份恢复及计划队列检查，生成 `content-binding-review.json`。
- `author-target-tests.log`：作者 23 个目标测试的真实执行结果。
- `anchor-ambiguity-review.test.mjs`、`anchor-ambiguity-before-fix.log`：独立最小负例及修复前真实失败结果。
- `final-target-tests.log`、`final-content-probe.log`：修复后 25 项目标测试及完整内容/历史检查的实际结果。
- `guard-review.json`：原缺口、root 修复、最终拒绝校验与全部已审文件的 SHA 冻结记录。
