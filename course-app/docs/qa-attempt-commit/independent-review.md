# Attempt commit 独立代码审查

审查对象是主任务在当前工作树新增的 `commitCourseAttempt`、作业提交路径和自由听力单题提交路径。本人只读生产代码并写此报告，未修改生产文件、root 单元测试或 A7 worker 浏览器文件；没有用旧 CI 结果认证本次新修复。审查时 HEAD 和七个相关文件 SHA-256 保存在 [independent-review.json](independent-review.json)。

本轮发现的三个具体问题都已由 root 修正，并重新读取确认。当前未发现“保存失败的提交仍被后续普通保存固化”、旧 first 被覆盖或失败后草稿被删除的路径。实际浏览器强回归仍以 A7 worker 的报告为准。

## 已修正的发现

| 项目 | 原有风险 | 复核结果 |
|---|---|---|
| 作业提交等待期间 compositionstart 取消 | connected form 因 aborted 直接 return，submit/fieldset 保持 disabled | root 已移除该提前退出；本页 failed candidate 解锁并允许 retry，退役 form 仅以 !isConnected 退出；catch abort/clear pending 并恢复本页控件 |
| 表单之外的“重新作答”按钮 | pending submission 时仍可另起 redo/flush 流程 | root 已随 submit 同步禁用 redo，成功、本页失败和 catch 均恢复；redo 原回调的 disabled guard 阻止重入 |
| 导入旧听力轮次的非法选项序号 | validateState 接受非负整数 3，但实际题只有 3 个选项；grade 在 catch 之外抛异常且无用户信息 | root 已改为 isAnswered(question, round.answers[id])；H2/H3 真题 probe 验证 3 被拦、合法 0 可提交；提示重新选择答案 |

第三项是已有导入状态的边界，并非此次候选保存新增的回归。它在控件锁住前触发，原来不会丢草稿，但会出现未处理 promise 和无提示的提交失败。修复现在在 grade 之前阻止该路径。

Probe 使用实际 `course-app/content/hsk2/lesson-01.json` 和 HSK3 同课 `listen01`，不是复制实现的假选项。两题 options.length 均为 3；直接调用 validateState 接受上述 round，而直接 grade 会抛“请先完成本部分”。新增 isAnswered guard 使该非法状态不再抵达 grade。详细结果已记录 JSON。

## 保存语义

1. `store.snapshot().data` 是 structuredClone。记录新 attempt、单题 submitted 和删除 draft 都发生在候选上，不先写入 live state。
2. `saveCandidate` 在入锁前捕获 editVersion / expectedRaw，在锁内再次检查 signal 和版本；commit 再比对真实 storage，只有精确、可读的 write/readback 才采用候选。quota、abort、较新的输入、旧 tab 冲突或缺锁都不会把未确认 attempt 放入 live state。
3. 因此失败后即使 ordinary save 成功，它保存的仍是草稿和旧记录。成功后 ordinary save 保存已经确认的 attempt 是合理行为。
4. helper 的 profile 比对和 questionIds 答案逐项比对绑定了成绩与实际草稿；不接受用另一个当前答案或学习档案提交旧评分。
5. expectedRound 核对 kind、单题数量、key、startedAt、index、queue、当前 questionId 以及“尚未 submitted”，随后比对当前 round answer。等待期间任何 store.edit 由 saveCandidate epoch 拦截。selected / limit 等设置不需要重复作为提交身份比较：新轮次经过 store.edit，且当前 view 的 start/pager 在 pending 时被锁住。
6. 第一个 questionId 只在 expectedRound 的单题路径使用；普通 homework / independent-listening 多题仍用 drafts 和全部 questionIds 比对。

## 视图生命周期、双点击与重试

作业保存使用 renderHomework 捕获的 assignmentStore，避免异步结束后读到另一级的全局 store。render cleanup abort pending，新渲染前移除旧 form；提交回调在 await 后只操作仍 connected 的原 form。grade 在 disable 前执行且处于 catch 内；不完整输入、评分或保存异常都不会把当前 form 永久锁住。

作业同一次提交先同步 disable submit 和 redo，因此双点击无法生成第二个候选。失败解除字段和按钮，原 answers/live drafts 保留，可以修答案或直接 retry；成功仍要求使用“重新作答”开启新草稿。

自由听力使用 submitting guard、displayedRound 身份、pending signal 和 retired 状态；等待时暂停音频，禁用 radio field、start、play 和 pager。失败恢复本题控件；成功采用 store 中与本次 attempt.id 一致的 confirmed round 后 draw，而不是继续使用未确认的本地 submitted 标记。旧 play 回调还检查 activeRound 和 submitting，避免新轮次或提交等待阶段追加播放次数。

该听力路径的 abort 只由 dispose 发起，dispose 同时设置 retired 并移除 root，因此其 aborted 提前退出不会遗留仍可见的锁住表单。作业的 compositionstart 是可见页面中的 abort，已单独修复恢复逻辑。

## 历史成绩与 first/latest

`recordAttempt` 的语义未变：first 仅在没有旧 first 时建立；latest 替换为新 attempt；submissions 只在候选里增加一次。保存失败不采用候选，所以旧 first/latest/submissions 及原草稿保持不变；保存成功才删除对应普通 draft。

grade 仍冻结 profile、answers、questions、contentRevision 和手写 assessment。手写 correct=null、automatic 分数、每个 attempt 的 total 和提交时间不因本次改动重算。renderReceipt 从 attempt.questions 的历史快照读取题目及答案；没有 questions 的旧历史仍采用已有原始兼容分支，不用当前题目重新解释旧成绩。

root 所写 18 个新增单元病例已阅，包括 H2/H3 × homework/individual 的 quota、等待、abort、较新答案、旧 first、后续普通 save、陈旧 round、profile 和无锁。本文没有将阅读测试文件写成“本人重复执行通过”；root 的单元/构建日志和 A7 的浏览器执行结果是独立证据。

## 顺带核查：HSK1 旧版本图片归档

怀疑路径是“旧 source-v2 L4 context 的 SVG ID 被 current resolver 解析为空”。静态界面链核查表明该路径 **不存在**：

- `mountSourceActivities` 从 getSourceLesson 取得当前 lesson；只有当前 card(a) 的图片分支调用 resolveSourceFigure。
- archive 的 update 分支直接渲染 row.context 的标题、说明、题干、来源、table、fields、history 和 draft；没有 img/figure/resolver 调用。
- snapshotContext 保留旧 figure ID/SHA，但并不保存自包含的 SourceFigure file/alt 元数据。
- 旧 L4 source-v2 有 10 个 SVG；current source-v3-original-crops 有 13 个 crop，旧 IDs 的确不在 current catalogue。10 个旧 SVG 文件和 figureURLs 的旧 URL 映射仍保留。

准确限制是：当前只读归档 UI 原本就不展示图片，旧 ID/SHA 仍保留在数据中；不是 current resolver 错替换或消失旧图片。若以后要求归档完整展示旧媒体，需显式增加可信的历史图册或版本化 resolver，并匹配旧 SHA；这属于新增展示能力，不是本次 attempt commit 修复必须改动的路径。

