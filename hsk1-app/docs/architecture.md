# 架构与第1步边界

本次采用独立 `hsk1-app/`：TypeScript、原生ES模块、Vite和CSS。复用有效教材、核定题库、媒体及纯规则；重整入口、路由、视图和公共服务。不加入React/Next.js、服务器、帐号、通用组件框架、插件系统、事件总线或巨型store。

**第1步只冻结数据与接口、建立可build/typecheck的工程状态页。** 入口为 `index.html → src/app/main.ts`；不实现正式教材/作业/听力/词汇视图，不实现最终router，不全量改写规则引擎为TS，不改 `new-hsk1/hsk1/` runtime，不发布。以下是后续目标契约，不是已完成功能。

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
| `src/services/storage/` | 本地持久化、失败/冲突保护、备份读写、恢复与旧格式适配入口 | 3 |
| `src/services/audio/` | 唯一媒体播放所有者；原轨/片段/TTS类型明确、取消、速度和错误 | 5/6 |
| `src/services/content/` | 读取并校验唯一JSON来源，按稳定ID查找；只读数据 | 1契约；后续实现 |
| `src/services/auth/` | 当前会话访问口令、解锁显示 | 2 |
| `content/` | 原教材有效数据、作业、听力/词汇、音频引用 | 1 |
| `review/`、`tests/`、`docs/` | 来源/哈希、检查证据、验收与维护；不当学生运行模块 | 1—9 |

领域拥有自己的状态和规则。共享服务可以保留教材、作业、听力/词卡多个领域记录及旧键，不要求合成一个大状态对象。领域之间通过应用路由及明确函数衔接，作答/翻卡/自评只改变本领域状态。

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

`stage2/engine.js` 与 `stage3/engine.js` 已为不读DOM/媒体/持久化的纯规则。后续先保持行为作ESM迁移、加必要类型，复用原输入/输出验证，不在第1步全量TS重写。按评分/作业、听力、词汇和迁移实际职责组织，不能为了减行数散拆。

公共音频服务拥有实际HTMLMediaElement、播放代次、异步加载、速度/范围停止与错误；视图只提出原轨/片段请求并观察结果。教材真人原音与语法/语音/汉字的浏览器TTS明确区分，14条没有独立教材词音不能伪造。播放中切换功能必须停止并取消旧请求。

存储契约在第1步定义，第3步实现；首次/最近、翻译草稿/已提交稿、阅读/作业完成必须独立。旧键、输入格式及待第3步生成的非空样本规格见 [`storage-contract.md`](storage-contract.md)；迁移需校验原题号与指纹，旧翻译选择记录只能归档，不能填成自由翻译已完成。失败保存保留内存稿并允许导出；导入先校验/预览、再保留恢复副本，旧原始记录不删除。

## 构建与最终迁移门槛

Vite build和TypeScript检查分别执行；开发可运行不代表类型通过或生产base正确。第1步只证明工程骨架与数据抽取可检查。功能步骤完成后才把学生dist接入原入口；到第8步去除学生运行中的旧双app、动态脚本注入、全局函数覆盖和重复样式/播放器。第9步冻结受测commit与dist哈希，发布同一构建、实际网址冒烟、保留回滚点。

自动数据/规则、真实浏览器媒体、语言审校、人耳听辨和实体设备是不同证据。旧阶段证据可追溯复用，但新UI/服务必须按需求矩阵验收，不能自动继承“全部通过”。
