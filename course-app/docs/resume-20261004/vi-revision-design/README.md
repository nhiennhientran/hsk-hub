# 官方越南语修订的最小工程接入设计

状态：`design-only / awaiting-A9-freeze`。本轮只阅读真实内容、控制器、记录和导入路径；没有审校新教材译文，没有修改生产文件。已有清单、三课试点定位和全部字段仍以 `../vi-inventory/` 为准，不能把本设计标成语言验收。A9 收尾后的源码 SHA 才是 B 阶段修改基准；本目录 `read-ledger.json` 记录本轮实际读取的工作树身份。

推荐采用两个引擎的薄适配服务、一个共同修订清单格式。一级原评分库、音频身份、控制器的指纹算法和随机选项原序号继续作为评分依据；官方译文通过显示服务提供。二、三级在 `loadLesson` 后应用经过验证的当前文案投影，新提交沿用既有完整题目快照。这样能对齐当前教材，同时保留旧记录的原含义。

## 真实约束与最小处理

| 内容路径 | 已读到的实际行为 | 最小接入 |
|---|---|---|
| HSK1 教材 | `createTextbookContent` 先验证 raw book/media/catalog，再应用现有 34 项 `textbook-display-revisions.json`；pure constructor 默认仍是原书 | 保留这 34 项的侧车。新 VI 修订以其**有效显示结果**为父版本，白名单只允许被审核的 VI 叶字段，不覆盖现有中文/拼音修订 |
| HSK1 教材词义详情 | `wordSenses()` 来自 stage3 原 catalog；词条 `word.vn` 改写不能自动改变详情中每个 `sense.vi` | 同时投影已证明对应的 `catalogId/senseId`；音频 lookup 仍用原 record ID。不同义项分别审核 |
| HSK1 词卡/混卡 | vocabulary 服务验证 stage3 全记录。普通 sense 指纹只依赖中文/ID，但 `mixedCardFingerprint` 对完整 `sourceRecords` 取指纹，包含 VI | 原 catalog/cards/sourceRecords 仍交给原控制器。渲染时按 record ID 投影 VI；浏览顺序、anchor、schedule、ratings、raw sourceRecords 不改 |
| HSK1 听力 | listening fingerprint 包括 promptVi、transcript、options、answer；`current.options` 保存原 index 后才随机排序 | 显示服务按 question ID + **原 option index** 取文字。答案、input value、optionFeedback 对应 index 均不重排；字幕按原行序号绑定 |
| HSK1 作业与档案 | stage2 指纹含题面/选项；homework30 attempt 保存固定 questionFingerprints；`createReceipt` 的题面由当前 bank 另传，记录仅有答案/评分/时间 | 控制器仍用原 bank。新 graded 显示需下述独立 presentation binding；没有绑定的旧 receipt 从原 bank 显示，档案继续使用原 authority task，不能改成当前官方版后声称是旧题原文 |
| HSK1 source 活动 | `id@version` 保存完整 context。同版本 context 的任何变化都会在 `editSourceDraft` 被拒绝 | 涉及 context 的 VI 修订全部升 activity.version，保留旧 context/draft/history。新增官方越文来源放修订 manifest，原 `source.textbookSHA256` 不伪改成新 PDF |
| HSK2/3 词库 | canonical senseMap 决定去重；混卡取 lesson-local word 文案 | 按 `sense.sources.wordId` 的已审核复用边同步投影。canonical label 与每个 lesson occurrence 都有各自 expected 值；官方语境不同允许有明确的不同译法，不能按相同字形批量合并 |
| HSK2/3 作业/听力 | `grade()` 深拷贝 questions，生成 `questionRevision`，保留原 first；receipt 读取保存的 q | 只投影**当前** Question；原 options 顺序、answer、tokens、ID/audio 不变。新提交自动保存修订后题目；旧 Attempt.questions 不再经过显示服务 |
| HSK2/3 教材活动 | ActivityRecord 只有 values/checkedAt/updatedAt，没有当时题面快照 | 纯措辞且值/选项/评分含义不变，可保持 ID。题意或答案身份改变则新建 activity/field ID，保留旧 record。不得声称旧记录原题面也被保存 |

现有二、三级听力页有 `attempt?.questions?.[0] ?? q` 的兼容回退。B 接入时须明确：旧已提交记录没有 snapshot 就显示原始作答值和“旧记录没有题目快照”，另有当前解释时单列；不把新 q 当旧提交时题文。当前作业 receipt 已按此原则处理缺失 snapshot。

## API 与修订清单

以下是拟实现的接口契约，不是已经存在的函数。建议一级新服务 `hsk1-app/src/services/content/official-vi-revisions.ts`，二、三级新服务 `course-app/src/official-vi-revisions.ts`。两者共享数据格式，但分别了解本引擎的真实 owner/field，避免将一级 fingerprint 投影规则误套给二、三级。

```ts
interface ViRevisionContext { readonly revisionId: string; readonly manifestSHA256: string }
loadViRevisions(signal?: AbortSignal): Promise<ValidatedViRevisionRegistry>
projectTextbook(rawValidatedDisplay: TextbookContent): TextbookContent
projectVocabularyCard(rawCard: VocabularyCard): VocabularyDisplay
projectHomework(rawQuestion: HomeworkQuestion, context: ViRevisionContext): HomeworkDisplay
projectListening(rawView: ListeningCurrent, context: ViRevisionContext): ListeningDisplay
projectLesson(rawLesson: Lesson): Lesson
projectLexicon(rawLexicon: Lexicon): Lexicon
```

一级 `projectHomework/projectListening` 返回独立显示 DTO，不能返回假冒原 bank/catalog 的对象。渲染层的中文、音频、答题值和反馈正确性来自原对象；VI 文字来自 DTO。词卡所有 `sourceRecords` 仍是 raw，按实际 record ID 解析展示义项和 meanings。二、三级 `projectLesson/projectLexicon` clone 后只改白名单叶字段；raw JSON 的引用证据（含本轮 523 个 HSK3 additionalSourceEvidence）和媒体值完整保留。缓存按 `courseId + baselineSHA + activeRevisionId`，不要沿用只按 level 的旧缓存而漏掉修订。

一级教材 wrapper 只 clone `lessons`，并装饰 `wordSenses()`/显示例句；原 `resolveWord/resolveScene/resolveLine/resolveAudio` 委托原服务。不对含函数的整个 Content 对象使用 structuredClone，也不把新 VI catalogue 混进原 media/catalog 校验。

manifest 建议包含：schemaVersion、revisionId、parent display revision、源文件 SHA、官方 PDF SHA、变更列表、逐项外部复核证据及其 SHA、未覆盖 owner 清单/覆盖口径。每项用 `engine/component/lesson/ownerId/field` 定位；没有原生 ID 的例句或表格格子，使用稳定父 ID + 原位置 + 中文/source 锚点，并要求唯一匹配。数组位置必须是原 source index；不能用随机后的 visible index、仅文字匹配或模糊首项。一次审核的一组 owner 应原子应用。

逐项必须记录旧有效值 expected、教材原 VI/newValue、对应中文/语境、printed/PDF 精确页和 section、判断类别、已证明 consumer 绑定、作者和独立复核。相同义项的重复 consumer 也要明确列 expected/source owner，不用全局 replace。状态包括 match、official-wording-variant、meaning-error、official-book-erratum、editorial-no-direct-book-counterpart、unresolved-source。无教材原句的 UI/教学提示只能标 editorial。

sourceAnchor 用明确分支：directOfficial 记录教材原 VI 和实际原页；terminologyDerived 记录术语依据页并声明并非教材原句；editorial 明示没有直接教材对应句，保留上下文及审校理由，不编造页码/教材原文；unresolved 不进入 active 修订。来源类别影响来源守卫，不能要求 editorial 填一个虚构的教材原句才能过校验。

运行前拒绝 stale expected、错误 course/lesson/source SHA、重复/外来 owner、越界原 index、同一父链重复目标、非法字段、unknown review evidence、仅数字覆盖而无 ID 集合、缺任何已声明 consumer。拒绝修改 grading answer/index/order/assessment/ID/fingerprint/audio/Chinese/pinyin；此类真实语义问题进入独立版本迁移 proposal，不能塞进 VI 措辞修订。修改显示选项后要检查歧义、重复选项及原正确答案在新表述下仍然成立。声明 active 的侧车缺失/损坏时该模块加载失败，不静默回退。未审核 owner 保留基准值并明示 pending，不能因此宣称全站对标完成。

## 一级新提交的显示版本保存

纯 DOM 投影不足以保存新 receipt 的原译文。实际 `HomeworkAttempt` 没 UUID/题目 snapshot，`ListeningSubmission` 也只有 answer/correct/at/fingerprint。时间戳或全局 attempt 摘要都不足以区分两次固定时钟下、相同答案但不同显示版本的提交。不能修改原 attempt 形状：homework30 校验器有 exact 字段白名单，stage2/practice 导入器仍依据原 bank 指纹。

推荐在一级 `AppData` 加**可选** `viPresentation`，由新 `services/content/vi-presentation-state.ts` 验证：

* 按 `homeworkVersion/lesson/part` 保存与原 first/current/latest/history **并行的 slots**，每 slot 持有唯一 bindingId、原 attempt 的 canonical digest 和 frozen questionFingerprints、revisionId、显示 owner refs。historySlots 与原 history 同步 append/slice(-20)；first 即使脱离 capped history 仍保留。
* listening 按 question ID 的 first/latest slots，以及 current round ID/question ID 绑定。新 round 建立时捕获显示版本；旧 round 无绑定仍从原库显示，不在 reload 时套用新版本冒充当时文案。
* 官方 VI 的显示 payload 按 revisionId + owner ID 去重保存，只保存实际需历史展示的字段，保留 original option index；不重复存答案、个人资料、音频或全部教材。它是可导出的只读文案 snapshot，**不是评分权威或身份认证**。限制字节和条数，按尚存 slots 清理不再被引用的 payload，避免挤占原作答容量。
* 旧 backup 没有该字段必须精确接受；缺 binding 是旧基准，不能猜测/自动补为当前官方版。新 backup validate 需逐 slot 和当前保存的原 attempt/round 比对、检查 owner/原 index/引用完整性；错配应拒绝整个候选导入，写入前完成验证。未知历史 revision 允许结构化 snapshot 查阅，但不得声称得到当前官方来源认证或重算分数。

原 engine 仍先在候选数据中提交，再在**同一次** `store.edit` 填 parallel binding；必要的 controller hook 只负责把显示 metadata 放入该原子 mutator，禁止改 fingerprint 算法、原 bank 输入或随机序号。不要由 view 再写一个 localStorage key、第二 store 或事后第二次 save。现有 HSK1 live-unsaved/导出/显式 retry 行为保持：quota 时原提交和显示绑定同在未保存候选，不能先显示“版本已保存”。held lock、离页、import/reset/restore 和完整双域 backup 都由现有 store/paired 协调器处理该 AppData 字段。

这是当前新版读旧备份的兼容性设计，不承诺原旧程序能导入新增字段。旧 compatibility 对 unknown AppData 字段会拒绝。启用新绑定前须把同一 modular storage key 的所有现行宿主部署为兼容 reader，验证并发旧标签页的 conflict 路径；回滚部署也保留该 reader。不得通过丢弃 `viPresentation` 来让旧程序读取，否则新 receipt 会丢失当时显示版本。

新作业 redo/draft 在首次明确用户修改时绑定本次显示版本；只读加载、查看旧 receipt 不产生脏数据。旧已提交 first 保持旧 slot/null；当前 latest 在新提交时绑定新版本。历史档案默认继续原 authority 内容，当前官方解释可独立显示，但不得改变 `archivedAnswerText` 对旧原 index 的解释。

## 文件所有权与执行顺序

`implementation-files.json` 给出精确拟新增/修改/只读文件和互斥 owner；本轮均未实现。一级服务/历史 metadata、二三级 lesson adapter、来源 manifest、UI 和 package 各自独占，不能两个代理同时改共享 main/content/controller。五个冻结 bank、原 engine.js、原 mixed fingerprint、既有旧档案全部列只读；一级 controller 仅允许明确 metadata hook。

现有 package snapshot 已覆盖两引擎 src/content，新增代码和 JSON 放这些范围即可。还须由 package owner 将 active VI revision/manifest/review SHA 纳入 content/release manifest，并实际验证统一/standalone 全入口加载同一版本。现有 public path 白名单不能为了侧车随意放宽；使用已允许的 Vite hashed assets，验证缺 asset 的真实 HTTP 失败。当前 source-input/image/audio SHA 全部保留；如果后来确有 SVG 内 VI 修订，必须按新增 asset revision 单独处理，不能声称 A9 原包字节仍是最终 B 包。

1. A9 冻结后重算基准 SHA，复用现有 VI inventory/consumer graph。实现严格 registry + 两个薄服务，先以临时合成 fixture 验证 stale/foreign/duplicate/index/parent-chain；没有教材审核通过前不设置 active revision。
2. 三课试点 H1 L4/H2 L2/H3 L10 独立视觉审校和 consumer 复核。先接教材/词卡/当前二三级 Question；一级 graded 内容待 parallel binding/导入恢复闭环通过再启用。source 活动按真实 context 改动升 version。
3. 按课批审核正式字段、词表、译文附录、UI/editorial、实际旧入口对应项。每批附冻结 input/source/manifest/review SHA 和 expected-value proposal；保持未知项 pending。旧 HSK3 20 课不能按新 18 课序号覆写，HSK4 无本次三书对应源。
4. 每批运行 meaningful guards 和 affected consumers 原生流程；最终再做全 owner/consumer 闭环、新旧 inventory 差异、两引擎 browser/旧档案/非空备份/跨级隔离/包入口验收。重新生成最终 package/source snapshot，先给用户确认再上线。

关键历史验收至少覆盖：旧 first 无 binding + 新 latest 有 binding；两次同时间/同答案不同版本；超过20次后的 first/history 保留；随机 visible B 对应原 index3 的提示/答案一致；新 revision 下恢复旧听力 round；旧无 snapshot H2/3 提交不被当前题面代替；source 同 ID 新 version 旧 context 原样；quota/held lock/离页/双标签/import/reset/restore/完整 paired backup 都保留文案绑定与原提交的同一状态。一次有效的这些边界检查比重复48套相同 assertions 更有价值；每个被修订 owner 的实际显示仍须完成定位和复核。

本设计不更改 A7 的 43 文件冻结、不更改最终 package，也不申请上线。下一步由 root 在 A9 通过后安排实现和教材试点。
