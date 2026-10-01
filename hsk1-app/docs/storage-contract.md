# 存储兼容契约

适用旧基线 `71b39192133c82f684384f450dda6079d3253440`。第1步从实际源码定义旧格式；第3步已实现新容器、校验/迁移/备份及12份匿名非空样本。按实际身份校验，不按键名后缀猜schema。完整作答界面与输入保存仍在第4—7步接入，跨模块及故障在第8步复测。本步证据见`step3-acceptance.md`。

## 实际键与身份

除明确sessionStorage外均为localStorage；值为JSON字符串。“无”表示该格式没有内嵌字段，不能将键后缀自动充当schema/app。

| 实际键 | schema / app身份 | 关键结构 | 源码 |
|---|---|---|---|
| `hsk1_ranteacher_progress_v1` | 无 / 无 | `{[lessonId]: {visited?, complete?}}`；阅读访问及自标阅读完成 | `new-hsk1/hsk1/app-core.js::getProgress/markVisited/toggleComplete` |
| `hsk1_ranteacher_mastered_v1` | 无 / 无 | `{["课号-词形"]: boolean}`；教材词卡星标，不是客观答题分数 | `new-hsk1/assets/hsk2-parity.js::MASTER_KEY/getMastered`；HSK1的LEVEL=1 |
| `hsk_module_progress_v1` | 无 / 无 | `{["hsk1:课号"]: {modules: ["vocab",…], updatedAt}}`；与其他级别共享，必须保留非HSK1行 | `new-hsk1/assets/site-shell.js::markModule` |
| `hsk_recent_lesson_v1` | 无 / 无 | `{code,id,sec,title,url,updatedAt}`；全站最近阅读位置，code可能不是HSK1 | `site-shell.js::markModule/injectContinueCard` |
| `ran_hsk1_learning_v2` | `2` / 无 | `{schema,lessons,words,questionReviews,preferences,updatedAt}`；旧translation是选择题 | `new-hsk1/hsk1/learning-engine.js::blank/group` |
| `ran_hsk1_stage1_v3` | `3` / 原blank无app；迁移可接受显式 `hsk1-stage1` | `{schema,lessons,profile:{name,className},words,questionReviews,preferences,archive,updatedAt}`；样板仅第3课 | `stage1/engine.js::blank`；`stage2/engine.js::migrateStep1` |
| `ran_hsk1_stage2_v3` | `3` / `hsk1-stage2` | `{app,schema,lessons,profile,words,questionReviews,preferences,archive,updatedAt}`；作业状态 | `stage2/engine.js::APP/KEY/blank` |
| `ran_hsk1_stage2_v3_recovery` | 同stage2内部身份 | 导入前完整stage2恢复快照；不是作答草稿键 | `stage2/app.js::inspect/import/restore-previous` |
| `ran_hsk1_stage3_v1` | `1` / `hsk1-stage3` | `{app,schema,sequence,updatedAt,preferences,listening:{records,session},cards:{schedule,review}}` | `stage3/engine.js::APP/KEY/blank` |
| `ran_hsk1_stage3_v1_previous` | 同stage3内部身份 | 导入前完整stage3原始JSON字符串；容量失败时旧app可仅内存保留 | `stage3/app.js::PREVIOUS_KEY` |
| `ran_hsk1_integrated_nav_v1` | 无 / 无 | `{mode,lesson,href,at,extra,homeworkLesson?,homeworkParts?:{[lesson]:part}}` | `learning-integrated.js::NAV_KEY/saveLast` |
| `hsk_portal_unlocked_v2`（sessionStorage） | 无 / 无；literal `"1"` | 当前会话正式gate判定标志 | `auth-patch.js::SESSION_SITE_KEY/isUnlocked` |
| `hsk1_ranteacher_unlocked`、`hsk_portal_unlocked`（sessionStorage） | 无 / 无；literal `"1"` | HSK1及旧公共会话别名；auth-patch校准这些别名 | `auth-patch.js::SESSION_KEY_H1/markUnlocked/initGate` |
| `hsk2_ranteacher_unlocked`、`hsk3_ranteacher_unlocked`、`hsk4_upper_ranteacher_unlocked`、`hsk4_lower_ranteacher_unlocked`（sessionStorage） | 无 / 无；literal `"1"` | 同一口令在当前tab会话的其他级别别名 | `auth-patch.js::markUnlocked` |
| `hsk_site_unlocked_v1`（localStorage） | 无 / 无 | 废弃持久解锁标志；旧auth-patch启动会清除，不可恢复为长期解锁 | `auth-patch.js::LEGACY_LOCAL_KEY/clearLegacy` |

存储按origin隔离；独立HTML、本地预览、其他域和正式网站不会自动共享记录。备份导入是换设备/环境的明确路径，不能描述成云同步。访问口令及会话gate不放入成绩备份，也不将旧长期解锁flag当新会话授权。

## 作业字段与提交版本

| 格式 | 课组 `lessons[lesson][kind]` | 提交快照 |
|---|---|---|
| learning_v2 | `draft,orders,first,attempt,corrections,completed,history`；kind有choice/sort/translation/listening | first/attempt为 `{answers,results,correct,total,at}`；history旧格式仅 `{correct,total,at}` 汇总。没有latest字段 |
| stage1_v3 / stage2_v3 | `draft,orders,first,attempt,latest,completed,history`；PATH为choice→sort→translation | `{assessment,answers,results,correct,total,at,questionFingerprints}`；history保留最多20完整提交。stage1迁移限制第3课且验证题目身份 |

- `draft`：当前编辑答案；choice为选项原索引，sort为完整或部分词块索引数组，free translation为原字符串。原文/换行保留，完成检查与评分规范化不应改写学生原文。
- `orders`：词块显示/初始排列，不能把显示位置当答案索引。
- `first`：首次完整提交，不被重做/订正覆盖。`latest`：最近一次完整提交；learning_v2只在可核定迁移时从first/attempt重建，不能声称旧格式本来含latest。
- `attempt`：当前轮已提交快照。重做清draft/orders/attempt，保留first/latest/history/completed；`latest`或提交历史才是已保存截图稿的来源。
- `completed`：完整提交的完成状态，与正确率分开；新作业0/5仍可解锁下一组。旧learning_v2的completed原依赖答全对/订正，迁移按当前核定提交与顺序重新解释。
- 自由翻译 `assessment="manual"`、`results=null`、`correct=null`，不进10题自动评分分母；输入最多12000字符，profile字段最多200字符，适用既有规则保持行为。
- 导入题目答案必须校验稳定ID、字段型别、所属组、指纹和完整5题。不能相信备份中的分数/布尔对错；适用原引擎重新核定分数。题号相同、题意不同不能继承成绩。

当前 `content/stage2-bank.json` 从当前有效stage2 bank抽取，是核定作业来源。库存发现225题中220条与原raw字段存在差异，详见 `review/corpus-changes.json`；**不能用旧raw重新构建最新版题库，再按相同题号恢复成绩。**

## 听力与词卡字段

stage3的 `preferences` 仅支持 `module,lessons,listeningMode,vocabularyFilter,direction,shuffle,rate`；module为listening/vocabulary，rate为五档核定速度。

| 位置 | 实际字段与语义 |
|---|---|
| `listening.records[questionId]` | `{first,latest,attempts}`；每个submission为 `{answer,correct,at,fingerprint}`；首次/最近分离 |
| `listening.session` | `{id,lessons,mode,questionIds,optionOrders,fingerprints,position,responses,startedAt,finishedAt}` |
| `session.responses[questionId]` | `{selected,submission,listenCount}`；selected用原选项索引；听次数不扣分 |
| `cards.schedule[senseId]` | `{fingerprint,level,lastRating,dueAt,ratedAt,reviewCount}`；rating为again/hard/good |
| `cards.review` | `{id,lessons,filter,direction,senseIds,position,revealed,ratings,fingerprints,startedAt,finishedAt}` |
| `review.ratings[senseId]` | `{rating,at,previous,advanced,early,schedule}`；导入重算时间表并与schedule核对 |

词形不是义项身份：新词卡保存按senseId，不把同形异义自评合并。learning_v2的 `words` 用由词形/拼音/旧义构成的JSON字符串键，记录含 `zh,lastRating,level,due,reviewedAt,reviews,lapses,source`；旧rating是known/again，不是stage3的三档。其 `preferences.vocab` 含lessons、direction（zh-vn/vn-zh）、pinyin、filter（all/new/wrong/due）、search和session；听力旧会话在 `preferences.listenSession`。这些旧结构可归档和展示来源，不能未经明确词义映射就伪装成stage3 schedule或session。

## 第3步迁移与数据保护规则

1. 只读所有原始学习键的字符串，校验后生成新应用领域状态；保留旧raw与恢复副本，不删除或覆写旧键。共享跨级别键仅处理HSK1相关记录，保留其他级别行。新应用持久化键/容器及schema在第3步实现时确定并记录，不能根据后缀猜格式。
2. stage2有效状态优先；不存在时再核对stage1第3课或learning_v2。已有损坏新/旧记录不得静默当空记录覆盖，保留raw可导出并给越语说明。
3. learning_v2仅对当前bank显式 `legacyCompatible=true` 且完整可核定的choice/sort/listening迁移；不满足时只保留有效草稿或归档。旧translation选择记录完整归档，**新free translation保持未提交**，不能填答案、成绩、completed或截图稿。
4. 既有stage2迁移 `archive.legacy/migration`、`archive.step1/step1Migration` 是来源保留结构；新迁移继续解释来源且避免层层重复拷贝。stage1只接受原schema3（app缺省或hsk1-stage1）、仅第3课，并校验真实题号/指纹。
5. stage3使用app/schema、question/sense身份与会话指纹核对。不可把stage2 listening历史直接当stage3独立题成绩，也不可用“同课次”推断题义相同。
6. 导入流程：读取→检查/预览→确认当前状态和预览版本未改变→保留导入前恢复副本→替换对应领域。新统一备份的错误应用/schema、未知ID、非法或不完整答案、指纹不匹配和与重算不符的派生评分均拒绝。旧领域备份沿原规则重算并明确警告；不能靠无签名本地JSON识别“合法答案与合法评分同时被改”的来源真实性。旧单领域导入只替换所属领域，新完整备份明确替换所有学习领域。
7. 保存失败/双tab冲突时停止覆盖、显示真实未保存状态，内存稿可导出；不能显示假成功。恢复副本也可能因quota失败，需明确内存副本限制。先前stage2 192MiB、stage3 4MiB等校验边界是现有兼容事实，新公共层不能无说明缩小已支持合法记录。
8. 自动保存/备份只保存本地状态；“已保存”不表示老师收到。会话gate按session语义处理，不随进度备份导入恢复。

## 非空样本（第3步已生成）

以下样本已使用固定时间、匿名合成输入及当前核定ID生成到`tests/fixtures/migration/`；共12件，索引/容量/SHA256见`manifest.json`。`fixtures:check`默认只核对，显式`fixtures:generate`才重生成。实际学生数据保留raw，不能作为公开测试制品。样本未模拟新学习UI的全部输入/媒体行为。

| 样本组 | 必须有的非空状态 | 验收重点 |
|---|---|---|
| 阅读/星标/共享shell | 第1及15课visited/complete、至少两词星标、HSK1模块和一个非HSK1记录、最近教材节 | 阅读/星标保持；不算作业成绩；其他级别行不改；继续入口可达 |
| learning_v2 | 已提交choice/排序、未提交草稿、旧translation选项提交、旧words自评与vocab/listenSession偏好 | 兼容与不兼容题分别处理；旧翻译只归档；首答/最近不伪造；原raw字节保留 |
| stage1_v3 | 第3课两客观组和自由翻译提交A、重做中的草稿B、profile/history；app缺省/显式各一例 | 校验L3/指纹；A和B分离；其他课/错误app拒绝 |
| stage2_v3 | 至少两课首错后对、first≠latest、完整history、翻译长答与换行、未完新草稿、archive/profile、recovery | 首次/最近/完成分开；截图读已提交稿；导出在新环境恢复相同内容 |
| stage3_v1 | 听力first错/latest对、至少一次未提交选项/听次数会话、词卡三档schedule、部分review、非连续选课/速度/方向 | first/latest、queue/position、指纹、选课和时间表准确；词义不混并 |
| integrated_nav/gate | 第10课translation继续位置、听力/词卡选择；解锁和未解锁会话分别测 | 旧URL继续位置可核对；gate不混入学习备份、不转永久解锁 |
| 故障与恢复 | 损坏JSON、错误app/schema、未知ID/改指纹、非法题答、stale预览、双tab、quota/禁止存储 | 原raw与当前稿不损坏；拒绝/未保存提示准确；能导出/恢复；不假设空数据 |

样本通过与新版浏览器恢复证据附到需求R018/R019/R021/R030/R034/R035/R036；各项仅记录本步存储范围的部分验证，不将保存服务通过扩写为完整学习UI、中文IME或实体设备通过。

## 新容器与公共接口（第3步实现）

| 位置/格式 | 字段与行为 |
|---|---|
| localStorage `ran_hsk1_modular_v1` | `{app:"hsk1-modular",schema:1,revision,updatedAt,data,recovery}`；旧键不修改 |
| `data` | 独立`reading{lessons,mastered,modules}`、`homework`(stage2规则状态)、`practice`(stage3规则状态)、`navigation`及`legacyRaw{真实旧键:原字符串}` |
| `recovery` | `null`或`{data,revision,updatedAt,reason}`；保留替换前完整当前稿，不复制上一次recovery；恢复同样保留恢复前稿，因此可切回 |
| 新JSON备份 | `{app:"hsk1-modular-backup",schema:1,exportedAt,data}`；导出当前内存数据，不混入session或gate |
| 旧恢复/previous键 | 校验并在legacyRaw逐字节保留；不自动替代损坏主来源 |

`createStore({storage,blank,validate,lock,now?})`负责通用持久化，不解析领域题目。`snapshot`读取独立副本，`edit`校验本地变化，`save`在锁内写入；`previewBackup`/`previewReplacement`建立候选，`confirm`再次检查本地editVersion及原raw，`restore`恢复一层快照。`exportBackup`导出当前内存稿，`exportPreview`导出尚未成功保存的候选，`exportOriginal`下载损坏主记录。`observeExternalChange`只报告冲突，不自动覆盖内存稿；`reloadDiscardingDraft`明确弃稿重读；`dispose`阻止等待锁的晚写入。

写锁名为`ran-hsk1-modular-write`。Web Locks串行协调使用该锁的同origin新应用tab；不能阻止DevTools或其他不合作写入者。锁内比较完整raw，不能仅看revision；一次setItem同时提交current/recovery，写后核对完整字符串。异常时不rollback、不清旧键、不去掉恢复副本再冒险重写。不支持锁时仅查看/导出，存储读取拒绝或损坏主记录阻止覆盖。跨origin依靠显式备份导入，不是云同步或老师收到了。

容量沿领域规则：homework为192MiB，practice为4MiB；legacyRaw每一来源按旧格式上界核验，不给组合容器另设更小总限，不宣称真实localStorage有同等容量。实际配额失败保留内存稿/候选，恢复副本也可能使写入超额，不能返回假成功。

当前旧bank的10个`legacyCompatible=true`标记，仅8个与旧题实际身份一致；L3 choice03/sort03题干已变。适配层增加旧身份manifest核验，不改冻结content、不重出题；这两组不能迁移完整成绩，只保留核定一致的草稿及原来源。未知题意或词义不按相同ID/词形推断。首次/最近由提交快照定义，不以系统时间戳单调排序重新推断（系统时钟可能回拨）。
