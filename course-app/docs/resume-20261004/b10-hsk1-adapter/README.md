# B10 HSK1 VI 显示修订与历史副本：工程冻结

本阶段完成默认停用的工程接入，没有激活官方越南语修订，没有计入教材语言审校。`hsk1-app/content/official-vi-registry.json` 为 `active: null`。最终运行源码应对照独立 v3；v1/v2 及其发现和实际执行证据保留。

## 实现与边界

registry 仅接受固定 bundler 资产与显式可信 SHA；核验原文件、上一显示版本、完整 RFC6901 指针、实际 owner/component、原始选项位置及原中文上下文。proposal digest 递归删除严格名为 `independentReview` 的键，其余对象键排序、数组顺序保留。独立 proof 的作者/审查者、change IDs、consumer refs 和来源 anchors 必须精确绑定。`match`、未解决项和自签 proof 不能形成 active change。未配置 active 时不请求修订资产，也不新增学习 presentation 状态。

新显示层在既有 34 项 textbook parent display revisions 之后应用。实际 mapper 注册 **5,519 个唯一语义叶字段**：textbook 841（811 个教材根字段、30 个已接受 parent revision 值）、course-index 15、listening 995、vocabulary 344、legacy homework 774、homework30 2,550。全部指针与真实值匹配；其中 700 个 options 字段绑定原数组与原 index。计数是这一学习叶字段 mapper 的范围，不代表网站 46,463 项 VI 全清单已经对标教材。

教材、词卡、mixed raw sourceRecords、听力、作业和收据采用薄显示 DTO；原题、答案、选项 index、评分、中文、拼音、音频及 ASR raw 保持原权威。词义 `.vi` 和 mixed 显示投影分离，mixed sourceRecords 保留原始引用。course-index 只投影 titleVi，中文与数量不变。旧 archive 的顶层 task 继续保留原值，每个历史逻辑提交分别显示自己的已保存文字副本。

`AppData.viPresentation` 可选字段与原学习提交在同一次 `store.edit` 写入。首次真实回答或听力开轮固定版本；读取、profile、导航及相同回答无副作用。first/current/latest/history 使用独立逻辑 binding，时钟和答案相同也不合并；20 项历史上限保留实际 first，并只 GC 无引用副本。备份、导入、恢复、跨 tab、范围 reset、显式 legacy 替换及 paired backup 同时携带学习数据和显示副本。历史结构通过校验不等于认证教材译文或用户提交真实性。H1 继续采用现有 live-unsaved 语义：quota/锁冲突时内存反馈和显示副本可以导出，重试成功才成为持久保存；与 H2/3 confirmed-only 语义不能混称。

来源引用 `source.label` 保持 raw/versioned。官方 short POS、`posLabel` 及本次 H1L4 21 条原印 POS labels 尚未接入新层；既有 parent revisions 含少量 POS/标签展示变动，后续 B14 应通过受保护 DTO 或专用展示字段处理，不能改 raw POS classification。SVG、旧外部 gzip bank、全站动态模板和版本来源标签不属于本次 5,519 叶字段新增层，仍按总清单及 B14 范围处理。

## 实际检查

| 检查 | 实际结果 |
| --- | --- |
| 新增 targeted tests | 27/27，通过；包含 12 个历史生命周期测试族及 archive、paired、UTF-8、部分 reset、旧轮及 cap20 回归 |
| HSK1 全部单位测试 | 630/630，通过，0 skipped |
| 主代码 TypeScript / fixture TypeScript | 两项均 exit 0 |
| 实际字段及保护文件证明 | 5,519 指针匹配，10 个五库/评分/mixed 保护文件与原始 SHA 及当前 HEAD 相同 |
| 干净隔离 production build | exit 0，637 文件；完整字节/SHA 在 build-files.json |
| 浏览器 collection | 3 个唯一场景 × Chromium/WebKit = 6；只证明可收集 |
| 本地原生浏览器流程 | **0 实执行**；首次 3 个 Chromium launch 在页面前失败，缺 executable |
| 官方译文接受 / active 资产 | **0**；active 资产加载分支尚未实执行 |

独立 v2 实测 14 个 pipeline probes，验证了 partial listening reset、同钟 cap20 first、禁止中文选项投影、VI label 歧义、paired crash/recovery、UTF-8 实际预算和跨 tab 等。发现后修复的失败记录保留，不伪造失败时未冻结的 source SHA。v3 只新增 revisionId 最大 256 的一致性守卫及一个既有测试内的 257 负例；独立实际验证 256 可完成 10/10 答题、提交、store.save 和兼容校验，257 在 factory 与历史导入拒绝。v3 重跑 27 个作者 tests 和两项 TS；14 probes、mapper 与 collection 的旧结果明确继承 v2，不冒称 v3 重跑。

浏览器首次失败的原始证据是三个 `native-output/**/error-context.md`，其 SHA 和错误见 `native-launch-evidence.json`。保留的 `native-launch-blocked-results.json` 名称不准确：它已被后续 `--list` 覆盖，实际为 6 skipped 的 collection 报告，**排除原生执行验收**。`native-ci-results.json` 同样只是本地 collection 产物，未列入冻结成果。TypeScript 首次缺 Node types 的失败日志单独保留，修正后真实检查通过。

## 复跑与交接

具体命令见 CI-INTEGRATION.md。stage-files.json 为本作者精确 stage 清单；source-files.json 绑定 26 个源码/配置/测试路径；execution-summary.json 记录当前 HEAD、检查结果和独立引用；freeze-manifest.json 对全部列出的最终文件做 SHA/bytes 冻结。干净 build 目录是可再生本地产物，不要求提交构建输出。

独立证据目录：`qa-b10-hsk1-adapter`（初版）、`qa-b10-hsk1-adapter-v2`（14 probes + mapper/options）、`qa-b10-hsk1-adapter-v3`（最终有界差异与 256/257 实保存）。最终 v3 freeze SHA 为 `69d10ee5c726c0b9828e4089dde5f1e112b3954f6e1ae984dc55a263a80fc719`。隔离 CI 应在真实 Chromium/WebKit 跑 fixture，结果及截图写 native-ci-*；这仍是实际 source-module dev harness，不替代 production 入口、登录或全部网站用户流程。根代理负责正式教材修订审核、激活、总清单重建和上线前用户确认。
