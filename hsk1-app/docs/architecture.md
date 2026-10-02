# 架构与实施边界

本次采用独立 `hsk1-app/`：TypeScript、原生ES模块、Vite和CSS。复用有效教材、核定题库、媒体及纯规则；重整入口、路由、视图和公共服务。不加入React/Next.js、服务器、帐号、通用组件框架、插件系统、事件总线或巨型store。

**第1步只冻结数据与接口、建立可build/typecheck的工程状态页。** 入口为 `index.html → src/app/main.ts`；不实现正式教材/作业/听力/词汇视图，不实现最终router，不全量改写规则引擎为TS，不改 `new-hsk1/hsk1/` runtime，不发布。以下是后续目标契约，不是已完成功能。

第2步已实现统一外壳、单一路由、7个按需ESM预览入口、原会话gate和mount/ready/unmount。loading禁用操作，旧任务取消并隔离，失败保留路由重试；完整视图与存储/媒体服务仍按第3—7步接入。`content/course-index.json`仅从新content生成课程摘要，build检查是否过期，不是新的教材编辑来源。具体证据见 [`step2-acceptance.md`](step2-acceptance.md)。

第3步已实现公共存储、格式适配、迁移、备份预览与恢复；“进度”保留预览入口，明确点击才加载数据工具及内容目录。领域规则作为有来源指纹的ESM移植，纯正文保持不变，不加载旧全局app。完整作答、媒体和复习视图仍在第4—7步接入。证据见 [`step3-acceptance.md`](step3-acceptance.md)。

第4步已接入真实作业。`services/learning/session.ts`由应用懒加载且持有一个公共存储实例；作业控制器只改变homework，视图订阅保存状态，退出先采集最终DOM草稿并flush。数据工具复用此实例；confirm/restore可接受视图signal以阻止晚导入，视图卸载不销毁学习状态。`receipt.ts`只读取首次/最近提交快照。

第5步已接入真实教材五节与公共媒体。应用懒加载唯一AudioService；视图以局部signal拥有请求，真实playing启动确认、片段停止及TTS互斥由服务负责。`services/learning/reading.ts`复用共享session，只更新reading及教材继续位置；模块打开、阅读自标完成与作业成绩独立。原教材练习在`domain/textbook`纯生成/评分，不改变独立practice记录。证据见[`step5-acceptance.md`](step5-acceptance.md)。

第6步已接入独立75听力。`services/content/listening.ts`校验唯一目录及原音引用；`domain/listening/controller.ts`调用保留的practice纯引擎，按原选项索引评分，首次/最近与当前轮次分开。视图只管理界面和所属播放请求，复用应用Audio与保存会话；真实播放成功才记次数，加载中暂停后首次继续也准确计数。保存/时钟通知不替换已聚焦的单选控件。见[`step6-acceptance.md`](step6-acceptance.md)。

## 目录与职责

| 位置 | 所有权 | 目标阶段 |
|---|---|---|
| `src/app/main.ts` | 唯一启动入口，调用应用启动 | 1骨架；2正式启动 |
| `src/app/` | 页面外壳、唯一 `router.ts`、当前挂载句柄和初始化状态 | 2 |
| `src/features/home/` | 15课及继续学习入口 | 2/7 |
| `src/features/textbook/` | 原教材生词、课文、语音/语法、汉字、原练习视图 | 5 |
| `src/features/homework/` | 选择、词块排序、自由翻译、提交与截图视图 | 4 |
| `src/features/listening/` | 独立听力题、会话、转写隐藏与反馈视图 | 6 |
| `src/features/vocabulary/`、`review/`、`progress/` | 混课卡、筛选、自评复习和各领域统计视图 | 7 |
| `src/domain/` | 纯规则、类型、评分、解锁、指纹校验和迁移函数 | 3/4/6/7 |
| `src/services/learning/session.ts` | 应用生命周期学习会话、防抖/合并保存、可重试失败及最终flush | 4 |
| `src/services/storage/` | 本地持久化、失败/冲突保护、备份读写、恢复与旧格式适配入口 | 3 |
| `src/services/audio/` | 唯一媒体播放所有者；原轨/片段/TTS类型明确、取消、速度和错误 | 5/6 |
| `src/services/content/` | 读取并校验唯一JSON来源，按稳定ID查找；只读数据 | 1契约；后续实现 |
| `src/services/auth/` | 当前会话访问口令、解锁显示 | 2 |
| `content/` | 原教材有效数据、作业、听力/词汇、音频引用 | 1 |
| `review/`、`tests/`、`docs/` | 来源/哈希、检查证据、验收与维护；不当学生运行模块 | 1—9 |

领域拥有自己的状态和规则。保存时用一个原子容器封装独立的reading/homework/practice/navigation及原始来源；通用存储服务只处理写入/版本/恢复，不承担评分、卡片或路由业务。领域之间通过应用路由及明确函数衔接，作答/翻卡/自评只改变本领域状态。

## 内容唯一来源与抽取

| JSON | 内容 | 保留的证据 |
|---|---|---|
| `content/textbook.json` | 15课有效 `vocab/scenes/grammar/phonetics/hanzi/xiaoyuTips` | ID、来源、内容指纹；342教材行、45课文、40语法+3语音；15课汉字专项 |
| `content/stage2-bank.json` | 225作业及95条核定排序表达 | 原题号、来源、核定答案和指纹；翻译仍为manual |
| `content/stage3-catalog.json` | 75听力、344义项/319词形和原目录 | 原题号/义项号、音段、分类、来源、指纹 |
| `content/media-references.json` | 405片段metadata、原轨、教材音段、14无词音记录 | 原mediaFile/audio引用和原轨路径；不在第1步复制/重新编码音频 |
| `review/corpus-inventory.json` | 基线、计数、source/artifact的路径/字节/SHA256/gitBlob、题/词记录 | 可再生成和比对的清单 |
| `review/corpus-validation.json`、`corpus-changes.json` | 结构/映射检查、尚未核实项和有效补丁差异 | 只证明注明的结构/引用检查，不认证语言或人耳听感 |

旧教材必须按 `lesson.html` 实际顺序获得**有效数据**：`new-data → new-enrichment → textbook-data-corrections → textbook-audio-segments → pos-tips → textbook-integration-corrections → stage3/catalog → textbook-final-corrections`。语音来自 `app-core.js::LESSON1_PHONETICS`；汉字专项来自 `new-hsk1/assets/hanzi-curriculum.js`；原练习由 `app-practice.js::practiceQuestions` 从教材生成。不能只取 `new-data.js` 或把旧禁用题库重新激活。

教材342按课词条、344义项记录和319不同词形各有意义。新内容服务复用这些关系；若修明确错误，保留来源与变更记录，不整库重出题。教师参考译文不得进入学生构建。当前stage2 bank为核定作业来源；旧raw与225题中220条字段存在差异，不能拿raw重建最新作业。

第1步catalog抽取工具专用于冻结旧source及建立迁移对照；当前JSON是该基线的可复核快照。后续切换后，`content/`成为独立唯一编辑来源，日常维护直接校验/修改新JSON及其来源记录，不能从旧patch链重生成并覆盖已维护的新内容。旧抽取工具继续作为有版本标记的基线比对工具；新增内容校验应直接读新content，保持迁移对照与生产内容职责分开。

## 路由和模块生命周期

第2步由 `src/app/router.ts` 唯一拥有URL、旧入口映射、后退/前进和继续位置。标准路由表示功能、课次、教材节/作业组；不读取DOM反推状态。领域视图不得自行调用 `history.*`；相同语义路由不重复写地址。

每个功能模块导出明确的 `mount(host, context)`，返回本次挂载句柄：`ready: Promise<void>` 和 `unmount()`。这只是少量应用函数契约，不发展为自制通用框架。

- `mount` 建立视图与加载状态，操作按钮暂禁用；准备内容、验证状态、绑定监听并完成首次渲染后才 `ready`。
- 应用在 `ready` 后启用操作、提供可观察就绪标识；失败显示可重试错误。测试等待真实就绪，另测就绪前提前点击。
- 切换先 `unmount`：保存当前草稿、停止所属播放、清计时器/观察器/监听、终止请求和未完成任务；异步回调需检查取消信号或挂载代次。
- 快速导航只允许最新挂载提交结果；旧加载完成不能替新页填题、播放旧音或启用旧按钮。
- 监听可用每次挂载的 `AbortController` 管理；卸载必须幂等。

旧 `learning-integrated.js` 先放可点HTML，再顺序加载stage2/stage3脚本。其“双app+动态script桥接”是迁移对照，不作为新工程长期运行方式。本轮INIT-001在受控本地Chromium 153中复现了提前可点击、点击无效、ready后再次点击才出题的风险（`review/init-race.json`）；是否是历史WebKit失败的唯一根因仍未核定。

## 规则与服务边界

`stage2/engine.js` 与 `stage3/engine.js` 已为不读DOM/媒体/持久化的纯规则。第3步将正文保持一致地移植到`src/domain/homework/engine.js`和`practice/engine.js`，使用ESM及必要声明类型；`provenance.json`及测试核对实际正文和原SHA256。后续修改新规则及对应测试，旧文件仅作冻结兼容对照，不需要同步修改旧学生app。按实际职责组织，不能为了减行数散拆。

公共音频服务拥有实际HTMLMediaElement、播放代次、异步加载、速度/范围停止与错误；视图只提出原轨/片段请求并观察结果。教材真人原音与语法/语音/汉字的浏览器TTS明确区分，14条没有独立教材词音不能伪造。播放中切换功能必须停止并取消旧请求。

存储契约在第1步定义，第3步已实现并建立12个非空样本。首次/最近、翻译草稿/已提交稿、阅读/作业完成独立。接口和具体格式见 [`storage-contract.md`](storage-contract.md)；迁移核验原题号与实际题意指纹，旧翻译选择记录只能归档。存储用Web Lock内原raw比较及单次setItem，current与一层recovery原子写入；失败保留当前稿和预览候选，可分别导出，原旧键不删除。练习控制器以edit更新本领域；应用会话300ms合并保存，失败不自动循环重试。卸载取消视图任务但保留内存稿，中文IME已覆盖模拟，实体设备留第8步。

## 第5步本地媒体与汉字

`tools/course-assets.ts`从冻结media路径复用93原轨，开发提供HEAD/Range，构建复制到`dist/course-assets`；不重复提交原MP3、不转码。汉字专项及词详情需要267字，250原本地文件+17按原数据库2.0.1版本补充；来源、哈希与数据/库许可见`review/hanzi-supplement.json`。`assets:check`独立核对全部媒体/笔顺副本与SHA。

Hanzi Writer固定3.7.3原正文，ESM内不建立旧学生全局。因无公开destroy，ManagedHanziWriter只适配指针监听生命周期、取消quiz/render和销毁renderer；升级时须核对内部接口及销毁测试。专项重点字与其余本课词内字分组，详情只列当前词内字。

## 构建与最终迁移门槛

Vite build和TypeScript检查分别执行；开发可运行不代表类型通过或生产base正确。第1步只证明工程骨架与数据抽取可检查。功能步骤完成后才把学生dist接入原入口；到第8步去除学生运行中的旧双app、动态脚本注入、全局函数覆盖和重复样式/播放器。第9步冻结受测commit与dist哈希，发布同一构建、实际网址冒烟、保留回滚点。

自动数据/规则、真实浏览器媒体、语言审校、人耳听辨和实体设备是不同证据。旧阶段证据可追溯复用，但新UI/服务必须按需求矩阵验收，不能自动继承“全部通过”。

## 第7步混课词汇、复习及进度

`services/content/vocabulary.ts`复用冻结目录并核对344义项/319词形、330原词音/14明确无音项及引用指纹；不新增音源。`domain/vocabulary/controller.ts`调用既有practice纯规则；`features/vocabulary/view.ts`由vocabulary/review两个入口复用，只有显式开始才替换队列。当前卡始终从已保存review.lessons/senseIds/direction恢复，偏好变化与筛选成员变化不会改写在学队列。拼音是当前视图开关，不扩展旧schema。

`services/learning/progress.ts`只读投影阅读、作业首次/最近、翻译草稿/已交和独立听力、词卡自评/到期；首页及进度复用同一会话与展示组件，继续链接以真实已保存卡/题位置为准。没有新增持久化键、重复评分或学习算法。

## 第8步候选清理与系统验收

首页移除临时entry预览工厂，直接拥有课次网格及真实进度；删除AudioService.stopExternal和旧媒体DOM扫描。教材速度、作业输入上限/菜单解锁直接使用既有规范规则。保留汉字生命周期适配和旧规则/迁移对照；不改原生产目录。构建后student:check逐一检查同一HTML别名、唯一启动脚本以及全部产物/source-map来源，防止旧桥接和教师答案源混入学生dist。跨模块、故障、四视口及证据限制见[第8步验收](step8-acceptance.md)。

第8步针对真实双引擎即时刷新丢稿新增瞬态脏稿标记和beforeunload确认保护；session唯一退出监听显式先调用当前作业视图的DOM草稿采集，再判断脏稿，避免Chromium原生事件的注册顺序差异。仍保留300ms合并和原WebLock原子写入，不以异步pagehide承诺完成落盘。用户确认离开、系统杀进程/断电仍可能丢未确认保存稿，明确记录该边界。
