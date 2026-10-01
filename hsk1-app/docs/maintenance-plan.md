# 维护计划与基线功能库存

本文件定义九步后的维护方式；当前仅完成第1步的需求/结构基线。正式功能、数据兼容、线上发布和最终维护示例分别留到目标阶段，不能把计划写成已执行结果。

## 当前实际运行入口和功能库存

下表依据旧页实际script顺序和覆盖函数读取，不以文件名推断当前功能。路径相对仓库根；`H` 表示 `new-hsk1/hsk1/`，`A` 表示 `new-hsk1/assets/`。

| 实际入口/实现 | 当前功能与必须保留操作 | 新维护位置/阶段 |
|---|---|---|
| `H/index.html`、`app-core.js::renderHome` | 15课卡片、任意课访问、每课五节直达、阅读完成标记、返回选级 | home/textbook/router；2/5 |
| `H/lesson.html`、`app-core.js`、`A/lesson-menu-parity.js` | 课次菜单、五节切换、前后节/课、首页、任意教材访问 | textbook/router；2/5 |
| `H/app-core.js`、`A/hsk2-parity.js` | 生词搜索/翻面/全翻、词性、星标、详情/关闭/前后词、课文例句、词内字切换 | textbook/vocabulary；5 |
| `H/new-enrichment.js`、`app-core.js::renderText` | 45课文、场景页签/下拉、说话人、中/拼音/越文 | textbook/text；5 |
| `H/textbook-segment-audio.js`、`textbook-audio-segments.js` | 单词、整课词汇序列、逐句/整段课文原声、边界与停止；无词音提示 | audio+textbook；5 |
| `H/textbook-audio.js`、`textbook-audio-guard.js` | 课文原声控件、教材听力模式及再显示原文、0.75/1/1.25教材速度、1—3课绕口令跟读 | audio+textbook/text；5 |
| `H/app-core.js::languageItems`、`pos-tips.js`、`tts-only.js` | 第1课3项语音、40语法、结构/解释/例句/拼音、例句TTS、词性与小语助力 | textbook/language；5 |
| `A/hanzi-curriculum.js`、`hsk2-parity.js`、`H/hanzi-visibility-fix.js` | 15课教材汉字专项、字词关系、笔画数/逐笔图、演示/练写/错误提示/重置 | textbook/hanzi；5 |
| `H/app-practice.js` | 教材基础词义/拼音题、课文理解题；层级切换、选择、提交/分数/解析、重做 | textbook/practice；5 |
| `H/new-practice-bank-packed.js` | 明确标记旧HSK题库禁用；不可当有效教材原练习恢复 | 不进入学生构建 |
| `H/learning-links.js`、`A/site-shell.js` | 教材页学习入口、继续学习、阅读/模块记录、键盘页签/搜索标签/语言标注 | app/home/progress；2/7 |
| `H/learning.html`、`learning-integrated.js` | homework/listening/vocab/review/progress外壳、恢复入口和领域统计；动态加载两套app | 单入口app；2，旧桥接第8步退出学生运行 |
| `H/stage2/{bank,engine,app}.js` | 225作业、10题计分/5翻译、完整提交解锁、首答/最近、翻译草稿/提交稿、截图/打印、备份恢复 | domain/homework+features/homework+storage；3/4 |
| `H/stage3/{catalog,engine,app,player,media-index}.js`、`media/lesson-*.js` | 75独立听力/五档速度/答案隐藏、混课344词卡/筛选/双向/自评/复习、各域保存备份 | domain/listening/vocabulary+features+audio/storage；3/6/7 |
| `H/auth-patch.js`、`help.html` | 访问口令、会话解锁、越语学习/截图/备份说明 | auth+实际维护说明；2/9 |

`learning.html` 当前只直接加载 `learning-integrated.js` 和 `auth-patch.js`，其余由前者加载。仓库存在的旧 `learning-app.js/learning-engine.js/learning-vocab.js` 不是这条入口的主实现；新工程不能因“文件存在”再次激活旧翻译选择判分逻辑。原教材练习与新225作业均保留，统计各自独立。

实际旧存储键、schema/app、字段和非空样本计划见 [`storage-contract.md`](storage-contract.md)。本步仅定义规格，fixture生成与迁移实现/验收在第3步。

## 外部与本地依赖

| 依赖 | 基线实际位置/用途 | 维护与验收 |
|---|---|---|
| Google Fonts：Inter/Noto Serif SC | `H/index.html`、`lesson.html` 的fonts.googleapis.com/fonts.gstatic.com | 这是外部运行请求；字体失败应有可读回退；本步未验全部线上字体服务 |
| HanziWriter 3.7.3 | `A/hanzi-writer.min.js` 本地库 | parity显式 `charDataLoader` 读本地 `A/hanzi-data/`；不要误把库默认jsdelivr数据地址当有效路径 |
| 汉字笔画数据 | `A/hanzi-data/` 256个本地JSON | 第5步核对实际所需字可加载，保持授权/来源说明；缺文件显示可恢复错误 |
| pako 2.1.0与样式解包 | `A/pako.min.js`、`style-packed.js` | 旧页面样式依赖；新原生CSS替代后第8步移除学生运行解包，不按文件数判坏 |
| 教材原音 | `H/audio/*.mp3`（93原轨），`stage3/media/lesson-*.js`（405嵌入片段） | 第1步只记路径/字节/哈希；后续引用或复制时保持原音，不重复转码/上传大媒体 |
| 浏览器平台 | HTMLMediaElement、speechSynthesis/中文voice、Web Crypto、localStorage/sessionStorage、Blob下载 | 真媒体/存储失败/语音不可用分别验；TTS只供语音/语法/汉字，不冒充教材原音 |
| 原托管 | 原GitHub Pages入口 `new-hsk1/hsk1/` | 新构建base/旧URL映射在2/9落实；本步不部署其他站点 |
| 开发构建 | TypeScript、Vite、Node；旧规则测试用node:test，旧浏览器用Playwright | 版本写进package/lock，build与typecheck分开；规则保持行为，浏览器证据绑定受测提交 |

## 修改位置与最低必要验证

| 以后要改的内容 | 修改位置 | 必要检查 |
|---|---|---|
| 教材释义/课文/语音/汉字专项 | `content/textbook.json` 与对应来源记录 | 原教材来源/字段对照、内容指纹、受影响页及原练习；明确区分语言审查与结构检查 |
| 作业题干/选项/排序核定表达 | `content/stage2-bank.json` | ID唯一、4选项/答案、全部核定表达和错误排列、题源；语义变更后的旧答指纹处理 |
| 自由翻译说明/截图样式 | `features/homework` | 无评分/无自动评语、草稿/提交稿分离、5题长原文/换行、窄屏和打印 |
| 听力题/音段 | `content/stage3-catalog.json`、`media-references.json` | 原轨/片段哈希、边界和选项答案；真实播放，语义改动重审实际听感 |
| 词卡义项/来源/词音 | `stage3-catalog.json` | senseId/词形/来源、同形异义、330/14状态、混课去重与过滤 |
| 导航/入口/启动 | `src/app/router.ts`、模块mount/ready/unmount | 旧URL、慢加载提前点击、快速切换、后退前进、同路由不写history、卸载清理 |
| 保存/备份/格式 | `services/storage`、`domain`迁移 | 非空旧格式、first/latest、draft/submitted、双标签、导入预览/恢复、损坏/容量/禁止存储 |
| 公共播放 | `services/audio` | 五档速度、起止/重播、503后重试、播放中换题/模块、过期异步取消 |
| 发布/base/资产 | 构建配置和发布manifest | 同受测dist/hash、原入口实际冒烟、旧链接、缺文件、恢复点可用 |

第1步catalog工具只从冻结旧source抽取基线和迁移对照。正式切换后，日常以 `content/` JSON为独立唯一源，直接修改/校验；不得运行旧patch抽取的写入模式覆盖后续维护内容。来源/指纹更新与新content检查同步完成，旧快照仅用于版本对照。

以后新增功能先追加稳定R需求编号、明确领域和修改位置，再实现与验证。新增课/题保持稳定ID和来源；不把教师参考答案纳入学生bundle；不静默改题让旧成绩失去可解释性。新增或变更存储格式先补非空样本与迁移规则，再换schema。

## 验证和交付节奏

第1步固定数据/契约和检查命令；第2—7步每步完成本领域行为检查，第8步做跨模块/故障/手机/结构清理，第9步对唯一冻结候选做全册终验、同构建发布和线上回滚交付。

数据全量检查可快速重复；只有题目/媒体语义变更才重新审相应内容。规则变动先定向规则检查；视图/服务变动先受影响浏览器路径。稳定候选最终保留Chromium/WebKit要求的300项和344词义覆盖，不用“省token”为由降低承诺，也不把两浏览器相同300题说成600道不同题。75听力真人听感与实体设备结果始终单列。

每步只读需求矩阵、短进度、当前模块及直接依赖；先rg定位，不重复全历史/全题库/媒体正文。输出保留计数、第一有效错误和证据路径，长日志落文件。最小复现两轮无新证据时改变诊断方式，再获得依据后修复和复测；不一再盲跑昂贵全量。每步收口只交付完成项、变更范围、检查结果、未解项和下一步入口。

第9步写入与实际工程一致的学生/教师说明及小修改示例：怎样改一题、怎样改一项词义、怎样增加音段、必须跑哪些检查。冻结发布manifest记录commit、构建hash、命令、资源、检查结果和生产恢复点；发布后实际网址验证口令、教材、作业/截图、听力/词卡和保存恢复。回滚保留原 `069f9d956c9a600a91e6b4ce82241ceccc184dce` 及上一受测dist/manifest，恢复时同时核对入口和资源，学习记录迁移不得删除原始旧键。

当前未完成的语言、人耳、实体手机检查由 `known-issues.md` 和后续审查记录说明；这些边界不能在学生/教师说明里被改写成“全设备/真人验收通过”。
