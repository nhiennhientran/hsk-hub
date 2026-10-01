# HSK1 需求与验收基线

基线：`71b39192133c82f684384f450dda6079d3253440`，工作分支 `work/hsk1-modular-step1-20261001`。本轮只做第1步：固定需求、抽取有效数据、工程骨架及必要结构检查；不修改旧runtime，不发布。不重新出题，不加教师后台、云帐号/收作业或AI批改。

机器可读同源矩阵：[`requirements.json`](requirements.json)。R编号固定；后续逐项追加执行证据，不能用旧版本通过声明替代新应用验收。

第2步执行证据：统一入口、路由、会话gate和生命周期已完成；R001/R010/R036/R037/R039/R041在JSON增加本步证据，最终完整需求状态仍为部分验证。下面保留第1步需求定义与基线口径，当前进度见 [`step2-acceptance.md`](step2-acceptance.md) 和 `progress.md`。

## 阶段与证据口径

| 阶段 | 目标 |
|---|---|
| 1 | 固定需求、可信数据与工程基线 |
| 2 | 统一应用入口、导航与生命周期 |
| 3 | 公共保存、备份与迁移基础 |
| 4 | 全部作业、评分与翻译截图 |
| 5 | 教材学习与公共音频 |
| 6 | 独立听力 |
| 7 | 混课词汇、复习与进度 |
| 8 | 跨模块、异常、手机与结构清理 |
| 9 | 冻结终验、发布与维护交付 |

本步只读VM按旧教材有效加载链核对：15课、45篇课文、342教材按课词条、40语法条；第1课另有3项语音。作业225题（75选择/75排序/75自由翻译）、95条核定排序表达；独立听力75题；词汇344义项记录/319词形、330有词音/14无独立词音；媒体索引405片段。342、344和319口径不同，不互相替换。

矩阵“数据”指基线数量/结构证据，“代码”指实现位置可见，“架构”指目标约束，“范围”指确认的要求。**这四类均不等于新应用功能验收通过**；本轮未重新完成语言审校、真人逐题耳听或实体设备审查。

## 需求—实现—验收矩阵

所有目标位置是九步最终结构；第1步只建立数据及骨架，尚未实现正式学习模块。旧实现路径均相对 `new-hsk1/hsk1/`（`../assets` 为 `new-hsk1/assets/`）。

| R编号 | 必须保留/满足 | 旧实现/证据 | 新目标位置 | 验收方法 | 目标步 | 本步证据 |
|---|---|---|---|---|---|---|
| R001 | 冻结用户确认需求、生产恢复点、候选源码和原教材/题库/媒体，变更可追溯；第1步只建基线和骨架。 | new-hsk1/hsk1/; tools/tests/; .github/workflows/ | docs/requirements.json; review/corpus-inventory.json; docs/progress.md | 核对基线SHA、原路径diff、数据/媒体哈希、9步范围；第1步不改旧runtime、不发布。 | 1 | 范围；新应用待验 |
| R002 | 保留15课教材原内容与任意课次访问；生词、45篇课文、拼音、语音、语法、汉字和原练习均可达。 | new-data.js; new-enrichment.js; corrections链; app-core.js; lesson.html | content/textbook.json; src/features/textbook/ | 比较有效数据和抽取JSON；15课逐模块浏览器回归，不以新增作业替代原练习。 | 1/5 | 数据；新应用待验 |
| R003 | 原生词保留中越/拼音搜索、单卡和全部翻面、词性、已记星标、详情开关/前后词、课文例句及词内逐字笔顺。 | app-core.js; ../assets/hsk2-parity.js; vocab-front-no-pinyin.css | src/features/textbook/vocabulary/; src/services/storage/ | 按库存逐操作；Enter/空格翻卡；搜索中越/pinyin；刷新星标恢复；详情字切换和关闭可用。 | 5 | 代码；新应用待验 |
| R004 | 教材生词保留单词原音和整课词汇连续播放；无独立原音准确禁用/说明，不用TTS冒充教材真人。 | textbook-segment-audio.js; textbook-audio-segments.js; ../assets/hsk2-parity.js | src/features/textbook/vocabulary/; src/services/audio/ | 真实播放整课及单词；边界、换课停止、无音按钮/提示核对；原音来源哈希一致。 | 5 | 代码；新应用待验 |
| R005 | 保留45篇课文的说话人、中文、拼音、越南语、场景页签/选择器、整段与逐句原音。 | new-enrichment.js; textbook-final-corrections.js; app-core.js; textbook-segment-audio.js | content/textbook.json; src/features/textbook/text/ | 45篇数量与来源对照；逐场景/逐句呈现及播放；核销明确教材差异，保留说话人和顺序。 | 1/5 | 数据；新应用待验 |
| R006 | 保留教材课文听力模式、隐藏/显示原文、原音控件与慢速跟读，第1—3课绕口令原音入口。 | textbook-audio.js; textbook-audio-guard.js; audio/1-7.mp3…3-7.mp3 | src/features/textbook/text/; src/services/audio/ | 切换听力/显示原文；暂停/重播/教材速度选项；1—3跟读播放和提示；与独立听力规则分开验。 | 5 | 代码；新应用待验 |
| R007 | 保留40条语法及第1课3项语音、中越解释/结构/例句/拼音与例句发音，保留小语助力和词性提示。 | app-core.js::LESSON1_PHONETICS/languageItems; new-enrichment.js; pos-tips.js; tts-only.js | content/textbook.json; src/features/textbook/language/ | 抽取40+3计数，逐项字段对照；语法/语音例句播放与系统无中文voice提示；新语言审查另记状态。 | 1/5 | 数据；新应用待验 |
| R008 | 保留教材汉字专项：笔画/笔顺/结构/偏旁；字词联动、笔画数、逐笔图、演示、练写提示与重置。 | ../assets/hanzi-curriculum.js; ../assets/hsk2-parity.js; hanzi-visibility-fix.js | content/textbook.json; src/features/textbook/hanzi/; public/hanzi-data/ | 15课汉字专项字段对照；字/词详情中演示、练写、重置；切入可见区后画布正确；触屏待实体检。 | 1/5 | 代码；新应用待验 |
| R009 | 保留原教材生成练习的基础词义/拼音题、课文理解题、层级切换、提交分数/答案解析和重做。 | app-practice.js::practiceQuestions/renderPractice/checkTier; new-practice-bank-packed.js(legacy disabled) | src/features/textbook/practice/; content/textbook.json | 从同份教材生成原题；每课两层级题量/答案对照并实际提交重做；不恢复已禁用旧HSK题库。 | 1/5 | 代码；新应用待验 |
| R010 | 保留课次选择、教材五节切换、前后模块/前后课、首页/选级入口、阅读完成标记和继续学习入口。 | index.html; lesson.html; app-core.js; learning-links.js; ../assets/lesson-menu-parity.js; ../assets/site-shell.js | src/app/router.ts; src/features/home/; src/features/textbook/ | 旧URL映射、课次/节参数、后退前进/刷新/继续；课程阅读标记与作业完成分开。 | 2/5 | 代码；新应用待验 |
| R011 | 全15课共225道作业：每课5道ABCD、5道词块排序、5道自由越译汉，题号、来源和教学范围保持稳定。 | stage2/bank.js | content/stage2-bank.json; src/features/homework/ | 数据检查225唯一ID、15×5/5/5；每课完成15题；若题意修改先核销来源而非重生成整库。 | 1/4 | 数据；新应用待验 |
| R012 | ABCD每题4选项、唯一核定答案；提交后显示对/总数、分数、正确答案、越语解析和错误选项原因。 | stage2/bank.js::choice; stage2/engine.js; stage2/app.js | src/domain/homework/; src/features/homework/ | 75题全选项答案检查；正确/错误/未答路径；15课反馈显示；语言自然性不能由答案布尔测试认证。 | 4 | 代码；新应用待验 |
| R013 | 75排序保留词块点选、撤销、重排、键盘操作和核定合理语序；提交后给正确句子及语序说明。 | stage2/bank.js::sort; stage2/engine.js::check; stage2/app.js | src/domain/homework/; src/features/homework/sort/ | 95条核定接受表达全部通过、每题明确错序拒绝；重复词块/空答/撤销/重排/键盘实测。 | 1/4 | 数据；新应用待验 |
| R014 | 75越译汉由学生自由输入中文；不评分、不判对错、不自动评语，学生页不加载/显示教师参考译文。 | stage2/bank.js::translation assessment=manual; stage2/engine.js::check/makeAttempt; stage2/app.js | src/domain/homework/; src/features/homework/translation/ | 检查manual correct/results为null；UI/进度/备份没有译文判分；任意有效学生原文可提交；学生dist无教师答案。 | 4 | 代码；新应用待验 |
| R015 | 每组5题全部有效作答后方可提交，缺题/空白给越语提示；已提交作答不被未完成新答覆盖。 | stage2/engine.js::submit/isAnswered; stage2/app.js | src/domain/homework/; src/features/homework/ | 各类型缺题、纯空白、重复提交、完整提交；组句需完整词块；错误提示可定位未答题。 | 4 | 代码；新应用待验 |
| R016 | 每课按选择→排序→翻译；前组完整提交即解锁，无及格线/全对门槛；重做和刷新不重新锁定。 | stage2/engine.js::PATH/canOpen/submit/restart | src/domain/homework/; src/features/homework/ | 0/5客观分也能下一组；未提交不能进入；重做/刷新/迁移完成状态一致；可任意选择15课。 | 4 | 代码；新应用待验 |
| R017 | 每课作业完成分母15，自动评分分母10；翻译只显5题提交情况；75听力成绩独立，词卡自评不算客观分。 | stage2/engine.js::totals/courseTotals; stage3/engine.js::listeningSummary/vocabularySummary; learning-integrated.js::runProgress | src/domain/homework/; src/domain/listening/; src/features/progress/ | 部分提交/全提交/低分重做时核对分母和统计；翻译/听力/自评分别展示，避免300项均计对错。 | 4/7 | 代码；新应用待验 |
| R018 | 首次成绩与最近成绩、重做历史分别保留，改正/重做不覆盖首次；听力同样保留first/latest。 | stage2/engine.js::first/latest/history; stage3/engine.js::submitListening | src/domain/homework/; src/domain/listening/; src/services/storage/ | 先错后对/多次重做/刷新/备份导入；首次保持原答和分数、最近变化；相容迁移不得伪造first。 | 3/4/6/7 | 代码；新应用待验 |
| R019 | 自由翻译未提交草稿与已提交版本分开；重做新草稿时上次提交稿仍能打开且不被覆盖。 | stage2/engine.js::draft/attempt/latest/history; stage2/app.js::receipt | src/domain/homework/; src/features/homework/translation/; src/services/storage/ | 提交A→重做写未完B→开截图仍为A；刷新/切课/导入后两份分别恢复；再次提交才更新提交稿。 | 3/4 | 代码；新应用待验 |
| R020 | 截图稿完整显示课次、学生姓名/班级、时间、5道题和学生原文；长答/换行不截断，可截图和打印/PDF。 | stage2/app.js::receipt; stage2/styles.css; help.html | src/features/homework/receipt/; src/styles/ | 15课收据实测；320/390/768/1104长中越混排及换行；打印预览；仅提示学生发送老师，不声称老师已收到。 | 4/8 | 代码；新应用待验 |
| R021 | 作答、翻译中文输入、长文本和换行自动保存；刷新、返回、切课及跨模块后原文恢复；中文IME不误提交/丢字。 | stage2/app.js; stage2/engine.js::MAX_TRANSLATION_LENGTH; learning-integrated.js | src/features/homework/translation/; src/services/storage/ | 1500字符中越混排+换行/输入中切换恢复；超长边界；composition流程模拟与真实手机中文输入分别记录。 | 3/4/8 | 代码；新应用待验 |
| R022 | 独立听力75题每课5题：听教材中文真人原音，选对应越南语4选1，独立评分与解析，来源可追溯。 | stage3/catalog.js::listening; stage3/media-index.js; stage3/player.js | content/stage3-catalog.json; src/domain/listening/; src/features/listening/ | 75唯一ID/15×5/选项及答案映射；75题实际作答、真实媒体ended；语义/人耳审查独立标记。 | 1/6 | 数据；新应用待验 |
| R023 | 独立听力五档速度0.65/0.75/1/1.25/1.5，默认1；可重复听，慢速/听次数不扣分。 | stage3/engine.js::RATES; stage3/player.js::setRate; stage3/app.js | src/services/audio/; src/features/listening/ | 真实audio.playbackRate核对五档；播放中换速/暂停重播；评分与播放次数无关；恢复默认/用户选择规则明确。 | 6 | 代码；新应用待验 |
| R024 | 独立听力中文转写和拼音提交前隐藏，提交后连同答案与越语解析显示。 | stage3/app.js::renderListening | src/features/listening/ | 提交前DOM/可访问文本不泄露；错误/正确提交后展示；换题/重做重新隐藏；教材听力模式另验。 | 6 | 代码；新应用待验 |
| R025 | 音频播放、暂停、重播、起止边界、换题/换课/离开停止、加载失败提示重试稳定，无串音和过期异步播放。 | stage3/player.js; textbook-segment-audio.js; textbook-audio-guard.js | src/services/audio/; src/features/textbook/; src/features/listening/ | 真实媒体事件和边界；慢加载/503/缺文件重试；播放中切模块；过期加载不能启动上一题；不同播放器互斥。 | 5/6/8 | 代码；新应用待验 |
| R026 | 独立听力可按选课/混课、全部题/需重做筛选，学习会话和选择范围保存；不由作业分数锁住听力。 | stage3/engine.js::createListeningSession; stage3/app.js; learning-integrated.js::prepareStage3 | src/domain/listening/; src/features/listening/; src/services/storage/ | 单课/多课/全选/空选择/错误筛选；首次及最近错题；刷新继续；作业未做时可进听力。 | 6 | 代码；新应用待验 |
| R027 | 混课词汇允许任意选择1—15课组合、全选/清选、打乱并明确所选课次与词量。 | stage3/engine.js::selectLessons/vocabularyDeck; stage3/app.js | src/domain/vocabulary/; src/features/vocabulary/ | 1课、7+10等非连续课、全15、空选择；切模块/刷新恢复选择；计数与真实义项一致。 | 7 | 代码；新应用待验 |
| R028 | 全册344按课义项记录、319不同词形；同形异义/读音不乱合并，合并相同义项仍保留来源课次。 | stage3/catalog.js::vocabulary; stage3/engine.js::vocabularyDeck | content/stage3-catalog.json; src/domain/vocabulary/ | 344/319与唯一senseId；多义词抽查和跨课deck去重契约；有效来源信息/指纹不丢失；不能把342教材行当344义卡。 | 1/7 | 数据；新应用待验 |
| R029 | 词汇筛选包括全部、未熟、需再练、到期/新词，支持中→越/越→中、先回忆再揭示。 | stage3/engine.js::FILTERS/DIRECTIONS/vocabularyDeck; stage3/app.js | src/domain/vocabulary/; src/features/vocabulary/ | 各筛选用非空自评种子核对；两方向先隐藏答案、揭示/翻页；空集给可操作提示。 | 7 | 代码；新应用待验 |
| R030 | 词卡自评again/hard/good和简单复习时间表保留；自评和客观对错分开，早复习不错误推进时间表。 | stage3/engine.js::calculateRating/rateCard/vocabularySummary | src/domain/vocabulary/; src/features/review/; src/services/storage/ | 固定时钟核对再次/困难/熟悉、重复自评、到期/早复习；重进会话和备份恢复；不扩成复杂自适应算法。 | 3/7 | 代码；新应用待验 |
| R031 | 330义项有词音、14项没有独立教材词音；明确无音状态，禁止伪造或随意跨课补音。 | stage3/catalog.js::vocabulary.audio; stage3/media-index.js; textbook-final-corrections.js | content/stage3-catalog.json; content/media-references.json; src/services/audio/ | 330+14=344；每音引用存在/哈希/边界；14无音卡UI逐项检查且无虚构media；人工词音语义检查另记。 | 1/5/7 | 数据；新应用待验 |
| R032 | 词汇保留教材/扩展/专名标识、义项、拼音、越语释义和原课来源；不以扩展词冒充必学生词量。 | stage3/catalog.js; textbook-final-corrections.js; pos-tips.js | content/textbook.json; content/stage3-catalog.json; src/features/vocabulary/ | 分类/extension/sourceSenseIds字段对照；来源页码与课次可查；界面计数解释；新语言审查不写成完成。 | 1/5/7 | 数据；新应用待验 |
| R033 | 统一进度呈现作业提交、首次/最近客观成绩、翻译保存、听力成绩和词汇自评/到期；继续入口指向真实保存位置。 | learning-integrated.js::updateMini/runProgress; stage2/engine.js; stage3/engine.js; ../assets/site-shell.js | src/features/progress/; src/app/router.ts; src/services/storage/ | 非空跨领域种子核对统计及继续位置；阅读标记不冒充掌握/作业完成；切换和后退状态正确。 | 2/7 | 代码；新应用待验 |
| R034 | 本地自动保存、JSON导出、导入前校验/预览、导入前恢复副本和换设备说明；兼容非空旧格式而不覆盖旧键。 | stage2/engine.js::importBackup/migrateLegacy/migrateStep1; stage3/engine.js::importBackup; stage2/app.js; stage3/app.js | src/services/storage/; src/services/storage/backup.ts; src/domain/migrations/; docs/storage-contract.md | 旧教材读星标、learning_v2、stage1_v3、stage2_v3、stage3_v1非空样本；导出→新环境恢复；旧翻译选择只能归档。 | 1/3 | 代码；新应用待验 |
| R035 | 损坏备份、错误应用/schema、内容指纹不匹配、过期导入预览、多标签冲突、容量不足/禁止存储均保护当前数据。 | stage2/app.js; stage3/app.js; stage2/engine.js; stage3/engine.js | src/services/storage/; src/services/storage/backup.ts; src/domain/migrations/ | 故意故障注入后前后数据哈希和恢复路径；不显示假保存成功；在内存中保留未保存内容并可导出。 | 3/8 | 代码；新应用待验 |
| R036 | 访问口令Ranlaoshimeimei和原首页/课堂入口继续可用；沿用会话解锁语义，不增加帐号系统。 | auth-patch.js; index.html; lesson.html; learning.html | src/services/auth/; src/app/router.ts; public/legacy-route-map.json | 错误/正确口令、Enter、刷新/会话；原URL入口和返回选级；受测正式域实际验证，不借测试域绕过算通过。 | 2/9 | 代码；新应用待验 |
| R037 | 学生端单HTML入口、TypeScript+原生ESM+Vite+CSS，构建/类型检查分开；教材、作业、听力、词汇等按领域组织。 | learning-integrated.js动态script桥接; stage2/app.js; stage3/app.js; lesson.html | index.html; package.json; vite.config.ts; src/app/; src/features/; src/domain/; src/services/ | 第1步骨架build/typecheck；后续学生dist只有一套应用，不运行旧双app桥接/补丁链；审查依赖和职责。 | 1/2/8 | 架构；新应用待验 |
| R038 | 只迁移有效纯规则与核定数据，保留稳定题号/义项号/指纹和评分/保存行为；不重出题或为行数强拆。 | stage2/engine.js; stage3/engine.js; stage2/bank.js; stage3/catalog.js | src/domain/; content/; tests/ | 原引擎作为行为对照：相同输入得同结果；适用既有规则测试转接；数据语义/95答案/媒体哈希守恒。 | 1/3/4/6/7 | 架构；新应用待验 |
| R039 | 公共storage/backup/audio/content提供小型明确服务；领域独立，不造通用框架、事件总线、插件系统或巨型store。 | stage2/app.js; stage3/app.js; stage3/player.js; learning-integrated.js | src/services/; src/domain/; docs/architecture.md | 依赖审查：规则不依赖DOM/storage/media，视图仅本领域，服务无页面ID；新功能修改点可说明。 | 1/2/3/5/8 | 架构；新应用待验 |
| R040 | 手机关键宽度320/390/768/1104适配，词块触控、越语换行、长译文/收据、中文输入键盘与控件位置可用。 | stage2/styles.css; stage3/styles.css; custom.css; tools/tests/integration-final-browser.cjs | src/styles/; src/features/; tests/browser/ | 4视口无横向溢出/截断，关键任务截图目检；WebKit与实体iOS/Android和中文IME分别记录，不互相代替。 | 4/5/6/7/8 | 范围；新应用待验 |
| R041 | 唯一router拥有URL/后退前进；模块显式mount→ready→unmount，加载中禁操作，退出停音/清监听/取消异步，不从DOM倒推路由。 | learning-integrated.js::runHomework/runStage3/hsk-learning-state; stage2/app.js; stage3/app.js | src/app/router.ts; src/app/lifecycle.ts; src/features/*/index.ts | 慢加载提前点击、快速切换、连续通知、反复挂载；ready依据真实初始化；相同状态不重复history写入。 | 2/8 | 架构；新应用待验 |
| R042 | 对同一冻结候选跑300任务、344词义、95排序表达、75听力真实媒体及旧功能/跨模块/故障回归；结果可定位来源。 | tools/tests/integration-final-*.cjs; .github/workflows/hsk1-integration-final.yml | tests/; docs/acceptance-matrix.json; docs/test-report.md | 数据结构全量快检；适用规则检查；Chromium/WebKit完整浏览器要求维持；题目数不因浏览器数翻倍。 | 1/8/9 | 范围；新应用待验 |
| R043 | 语言内容审查、75题真人逐题耳听、实体手机/Safari/Android和中文IME审查分别留真实证据，未执行保持待核验。 | tools/review/hsk1-listening-device-review.html; tools/review-file-check.cjs | docs/content-review.md; docs/human-device-review.json | 审查者/时间/问题/处理记录；不把ASR/PCM/hash/native ended或Playwright模拟写为人耳/实体通过。 | 5/6/7/8/9 | 范围；新应用待验 |
| R044 | 第9步才发布唯一受测dist到原入口；线上提交/资产与受测一致，实际网址冒烟、保留完整回滚点和验证程序。 | gh-pages原站; .github/workflows/; source manifests | docs/release-manifest.json; docs/rollback.md; dist/ | 锁定提交及dist哈希，部署后入口/口令/教材/作业/截图/听力/词汇/保存冒烟；回滚构建和地址恢复验证。 | 9 | 范围；新应用待验 |
| R045 | 交付简明越语学生说明、教师查看首次/最近成绩/截图/备份说明及维护指南；扩展新增课/题/义项/音轨有明确位置。 | help.html; tools/review/; LEARNING-UPGRADE.md | docs/maintenance-plan.md; docs/student-guide.md; docs/teacher-guide.md | 第1步定义维护路径；第9步用实际工程写可复现小修改示例与必要测试；不增加教师后台、云收作业、AI批改。 | 1/9 | 范围；新应用待验 |

## 基线恢复点与当前限制

| 用途 | 提交 | 口径 |
|---|---|---|
| 当前源码/失败调查基线 | `71b39192133c82f684384f450dda6079d3253440` | 本步读取与抽取来源 |
| 原生产恢复点 | `069f9d956c9a600a91e6b4ce82241ceccc184dce` | 后续发布前保留；本步未部署 |
| 独立作业第二步 | `2c6d3b38866dcfbcf101974302609c470f1d2443` | 已核准的前阶段冻结点 |
| 独立听力/词汇第三步 | `de823050e97cbab64144197f3bf9241321b73c59` | 已有数据/规则来源 |
| 首8课整合候选 | `8ffecf1031abb52b863c6a05b38f24a8ae5c2af6` | 历史候选证据，不是新应用终验 |

最新旧整合run `36858721288` 的会话核对结果为Chromium success、WebKit在 `integration-final-extra.cjs:136` 跨模块等待 `#listening-question` 超时；因此不能声称旧整合全站双浏览器终验完成。history重复写入已修，500次相同通知检查通过；本轮INIT-001已用本地Chromium 153受控延迟脚本复现提前点击无效；证据在 `review/init-race.json`。这确证初始化风险，仍不能断言它是历史WebKit超时的唯一根因。详见 [`known-issues.md`](known-issues.md)。
