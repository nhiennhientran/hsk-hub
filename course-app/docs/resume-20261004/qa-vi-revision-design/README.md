# B 越南语显示修订设计：独立只读审查

结论：两个薄显示适配器、一级冻结评分库加并行文案绑定、二三级沿用题目快照的方向可靠，可以作为 B 的实现基线。**本次仅条件接受设计方向，尚未接受任何 B 实现或官方译文。** 启用一级新 graded 显示前，应补齐档案消费者和 metadata 生命周期契约；二三级听力还应明确历史反馈中的当前课文边界。SVG 与 ASR 必须分别保存旧字节来源身份，不能让新显示版本改写历史 SHA。

本轮没有修改生产、设计作者文件或官方来源转写，没有开启正式教材越南语核对，没有重试旧 HSK3 PDF。读取了下列真实调用链的相关范围；二三级导入、完整双域备份、打包与浏览器只列后续验收要求，**未做全面实现/浏览器审计**。`review.json` 和 `read-ledger.json` 记录精确输入身份及范围。

## 历史保存的最小边界

用户需要保留实际存在的回答、成绩和当时题面，不需要在每份用户记录里保存整本教材、全部源 PDF、全部 SVG/音频字节或假想教材版本。

| 真实记录 | 可可靠保留的内容 | 最小处理 |
|---|---|---|
| H1 homework/homework30 | 已存 answers/results/correct/total/at、原题指纹；first/latest/current attempt 和最多 20 条 history；没有题面快照和提交 UUID | 原五库及指纹不变。新显示文案按逻辑提交和实际 slot 保存 VI 快照引用；用原库还原未改的字段和原答案序号 |
| H1 listening | 已存原答案序号/正确性/时间/指纹；records first/latest 和当前 round.responses | 保留原记录；当前 round 及其提交使用捕获的显示绑定，reload 不套用后来 active 文案 |
| H1 source activities | id@version 已保存 context、draft/history，包括题文、字段、原图 ID/SHA | context 中 VI 改动升 activity.version；旧 context 原样保留。历史界面目前不渲染旧图片，不声称已经完整回放图题 |
| H2/3 新 Attempt | 实际 grade 深拷贝 questions、answers、profile，记录 score 和 contentRevision；普通 recordAttempt 只保留 first/latest 及次数 | 旧 questions 不再次投影；新提交快照当前已审文案。不要承诺并不存在的全部中间提交历史 |
| H2/3 旧无 questions 或 ActivityRecord | 无当时题面；只有实际保存的回答/状态 | 显示原始值和缺快照说明。当前解释单列；不从 ID、时间、2026.1 或 q1 指纹推断旧教材版本 |
| 未识别 legacy/score-only | legacyRaw 中原始数据；未必有可对应题目或逐题答案 | 保留原数据及有限状态说明，不生成假 attempt、假题面或假官方来源 |

原五库仍可还原 H1 已由原 importer 验证的已知 baseline 题面，因此只需保存被改变的显示字段及依赖引用。没有有效题目指纹/映射的未知历史不能套用这个还原承诺。历史来源标签必须区分“保存的显示副本”“已知原题基准”“当前官方参考”，任何用户备份都不是身份认证或语言来源认证。

## 已确认的正确设计

1. 五个 H1 原库当前 SHA 与设计作者 ledger、既有五库保护测试的固定值均一致。H1 原评分构造器与混卡 `sourceRecords` 必须继续接收 raw；混卡指纹实际包含完整原记录，不能把显示投影混入 controller。
2. `wordSenses()` 直接从 stage3 取 `sense.vi`，只改 `word.vn` 不会修复详情。设计按 catalogId/senseId 和实际消费者逐项绑定是必要的。
3. H1 listening current.options 为 `{index,text}`，index 是 shuffle 前原选项序号。新文字必须按该 index 投影，保留 radio value、answer、反馈索引和 transcript 原行顺序。
4. H1 homework30 原 attempt exact 白名单拒绝新增字段。使用兼容层允许的 AppData 可选并行 metadata、在同一 store.edit 更新，是保留原 importer 和评分库的合适路径。
5. H2/3 grade 现已 structuredClone 完整题目；receipt 查保存的题目，旧无快照显示原始值。新显示文案自然改变新 `questionRevision(questions)` 的结果，但算法、答案身份与旧存值保持不变。这个非密码学标记不是教材版本证明；现 validator 只检查 contentRevision 是字符串，并不重新证明它与 questions 的一致性。
6. H1 source context 使用 id@version 且同版本内容变化会被拒绝，沿用现有版本机制比新建一套历史题库可靠。

## 必须补充的具体契约

### D1：H1 档案消费者必须分清原评分 authority 与提交时文案

实际 `archive-data.ts:21–27` 把 HomeworkAttempt 降为单题 submission，丢失 group/slot/显示绑定；`:43–47` 从 first/latest/history 投影。`archive.ts:98–110` 在所有历史前显示一份 raw task，`:62–86` 对各次提交都按同一 raw task 解释选项。

设计将这两个文件列为 readOnly，同时计划允许 legacy stage2 新 graded 显示。旧 baseline raw task 正确；新提交若见到修订 VI，再在档案里显示旧 VI，便不满足“当时题面”。在启用该银行的 graded 投影前，二选一：

* 最小呈现层扩展：档案保留 immutable raw task/entry 作为 authority，另外携带 homeworkVersion/lesson/part/first/latest/history 原位置的文案绑定，逐条显示当时 prompt/meaning/原选项 index 标签。原 archivedAnswerText 和原答案值继续作为明确标注的原库说明；显示副本只解释绑定的文字，不再评分。
* 暂时不启用该 graded bank 的新 VI 投影，直到所有档案入口能正确读绑定。

无需改 archive engine 或旧库，不能把整份 task 改成新版。implementation-files 应给这个窄消费者范围明确 owner；若坚持原文件只读，新增适配器也必须有实际调用入口，不能只在文档中声称已支持。

### D2：并行 slots、draft/round 与生命周期须有可执行规则

保存文案应以一次逻辑提交的 bindingId 标识，同次 first/current/latest/history 拷贝复用该 ID；两次同时间、同答案、同原指纹的提交仍有不同 ID。canonical digest 仅交叉校验实际 raw 值，不能单独决定哪个历史位置属于哪个显示版本。

须明确区分 **draft binding** 和当前 **attempt slot**。建议最小合同：首次真实答案修改捕获当时实际展示的 revision/payload；以后继续草稿、提交和 reload 都使用这一绑定。旧已有未绑定草稿/round 继续已知 baseline；全新未改草稿可读当前显示但不写状态。不能在提交时才把当前 active revision 贴到此前旧文案的答案上。sort 顺序初始化、profile 修改、只读 receipt 与导航不得误捕获文案版本。

| 入口 | 真实现状 | 并行 metadata 的最小要求 |
|---|---|---|
| homework submit/restart | engines 维护 first、current/latest、20 条 history；restart 仅清 draft/orders/attempt | 同 store.edit 增加提交绑定；first 只设置一次；history slots 同步 append/slice；restart 清本次 draft/current attempt 绑定，保留 first/latest/history |
| listening change/start/submit | candidate practice 变更后一次 store.edit；current round 有原 options/responses | 同原子写入 round 文案和实际提交 first/latest；旧 round 在新 active 下仍用其捕获值；无变化操作不新增 metadata |
| compatibility.reset | resetProgress 只清原记录；compatibility.reset 再 validate | 在已允许修改的 compatibility.reset 内按 lesson/module/version 清对应绑定；保留其他模块及仍可达 first/history。无需改 readonly 原 reset engine |
| compatibility.importLegacy | :360 或 :368 会整域替换 practice/homework | 同次候选替换中清被替换域旧绑定，不影响 homework30/另域；原 incoming 没显示副本即 baseline/null，不承接先前域的 binding |
| migrate(base)/discovery | validate(base) 后补新发现记录 | 保留已验证现有绑定；新增 legacy 记录无绑定，不能自动贴当前官方版本 |
| full new backup/import/reset/restore | 由现行 store/paired 传完整 AppData | 新字段在 compatibility exact 白名单、返回 clone 和 validator 中显式支持；先整体校验再写。错配/悬空 refs/越界 index/过大 payload 拒绝候选，普通已授权 legacy 替换按上行清理，不能二者混淆 |
| GC/limits | 尚未实现新字段 | 只清没有被任何 draft/round/first/latest/history 引用的 payload；first 脱离 capped history 仍可达。给 UTF-8 字节/条目上限及现有 backup 容量留出实测余量 |

新 unknown historical revision 的结构化显示副本可保持只读，只能声明保存的副本，不冒充本次官方审核。老五库及得分仍由原 validator 校验。新旧 reader 同 storage key 的发布/回滚兼容要求保留设计原约束。

### D3：H2/3 听力历史反馈仍有当前课文依赖

设计已发现 `listening-view.ts:160–162` 的无快照回退，应按计划移除其历史冒认。另一个实际路径在 `:290–300`：即使 question 来自 saved Attempt.questions，feedback 仍按 question.audioTrack 去当前 `lesson.texts` 取 lines.zh/vi，标题是“听力原文”。所以旧题快照绕过投影并不意味着这段反馈是当时译文。

最小改法为保留现存 Question 快照机制，明确把该块标为 **当前课文参考**，与保存的题目/答案/解释分开；无快照记录只显示 raw 回答/分数及缺快照说明，不开放一个伪历史当前选项表。只有产品确需回放提交时的完整课文反馈时，才提出额外的窄反馈快照合同，不能为未知旧记录补造它。receipt 的 `main.ts:949` 课标题也来自当前 lesson，只是导航上下文，不能当作已保存的旧教材版本证明。

### D4：SVG raw registry 与新资产是不同版本

`source-activities/content.ts:27` 的 raw lesson04 与 `:31` 的 current lesson04 分开；`figures.ts:1–12` 是固定旧 ID → ?url 映射。既有 `source-activities.test.mjs:25` 校验 raw registry 的十个 SVG 文件 SHA，`:26` 固定五库。这里没有 literal ?raw SVG API；所称 raw registry 是旧 JSON 导出及其字节 SHA 保护。

如真实 active SVG 内 VI 需要修订：旧路径/ID/bytes/SHA 留存，新增版本化 asset path/ID、当前可信 registry 和 ?url 映射，独立审核 SVG 新字节、caption/alt 与包内资产。不能原地改十个旧 SVG 再修改旧 registry 来让测试通过。现历史 source UI `index.ts:77` 不渲染旧图片；不要称已实现图题完整历史回放，也不要给旧 figureSHA 换新图。用户备份只需 immutable asset refs，不存 SVG bytes。先核实际 active 消费者；不因目录里有旧 SVG 就必定修改它。

### D5：ASR 历史 full JSON SHA 与显示 revision 分开

`compare-raw-source.py:169` 保存完整 lesson JSON SHA；`transcribe-candidate-crops.py:74` 对冻结 sourceLessonFile 全字节 SHA 作实际前置校验。源文本语义不变并不能让一份改过 VI 的 JSON 继续匹配旧 SHA。

本设计以 VI 侧车 projectLesson 且原 JSON 不变，足以保留 ASR 原来源身份。实现合同应明确旧 raw lesson、raw transcript、模型/PCM/音轨 hashes、原 authority 和独立 QA report 不改；当前 UI 在这个原 basis 上有独立显示 revision。若后续真要改 raw JSON，另立重新绑定来源 proposal 和新 full SHA/验证；不回写旧报告，也不“只忽略 VI”冒充 full SHA 相同。本轮不会新增 ASR 切段数或 human/native 听辨结论。

### 已排除的一项疑点

原 resolveScene.request.label 来自原 scene.place_vn，但 `features/textbook/text.ts:34–36` 在两播放按钮上明确用当前 scene 显示文案覆盖 label；source 活动 `index.ts:56` 也覆盖为通用轨道标签。检索到的两个真实消费者均已覆盖，所以委托原 resolver **目前没有造成这个播放 UI 漏项**。无需为推测修改音频 resolver；将这两个调用点列入最终消费者验收即可。

## 最小实施顺序与必要测试

A9 完成并重新冻结实际基准后，先补 D1–D5 到契约/具体 owner，再实现 registry 和两个薄服务。首先用合成数据验证工程边界，不把合成 fixture 当官方语言证据。三课试点及官方逐项独立核对随后进行；H1 graded 投影必须等 parallel binding 和所有历史消费者闭环，所有未审核 owner 保留 pending。

| 测试族 | 必须验证的行为 |
|---|---|
| 1. frozen authority | 五库 byte SHA、原 engines/指纹输入及 raw sourceRecords 不变；现有 34 display revisions 为父基准，VI 叶投影不丢中文/拼音纠正 |
| 2. registry guards | accepted ID 集/evidence SHA 与实际输入匹配；stale expected、foreign/duplicate owner、越界原 index、非法字段、缺 consumer/asset、错 parent 全批拒绝，无部分改写 |
| 3. all sense consumers | 一个词多个义项、word.vn 与 wordSenses、普通/混卡/lesson-local/canonical 分别投影；不同语境不按字形串改；原 mixed fingerprint/order/schedule 完全一致 |
| 4. shuffled original index | visible B 对应原 index3 时文字、radio value、hint/answer/feedback 全一致；原 options/tokens 不重排；新 VI 不产生歧义或重复答案 |
| 5. first/latest/history | old-null first + new latest；固定时钟同答案两 revision 的不同逻辑绑定；超过 20 条后 first 可读、history 对齐；receipt 与 archive 首次/最近/逐历史选项各读正确文案 |
| 6. draft/round continuity | 旧草稿和旧 round 在新 active 下继续 baseline；新草稿/round capture 后 reload/submit 不偷换；restart/无效或重复 submit/只读浏览/排序初始化无错误 metadata |
| 7. lifecycle isolation | 范围 reset、legacy 域替换、discovery、restore/ordinary/full paired import，清正确绑定并保留他域/first；悬空/错配候选零写入；GC 和字节容量有实测 |
| 8. atomic failures | quota 后 raw 答案和 metadata 同在可导出 unsaved 候选；held lock/离页取消/两标签冲突/写后抛错不单独宣称文案或提交已保存；兼容 reader 回滚不丢 metadata |
| 9. H2/3 historical snapshots | 改当前 VI 后旧 first 问题/答案/解释及 contentRevision 原样、新 latest 存新副本；旧 no-snapshot 只显 raw、当前课文参考单列；不重建缺失中间记录 |
| 10. source context/assets | 同 ID VI context 新 version，旧 context/draft/history 不变；同版本修改拒绝。旧 SVG bytes/registry 保留，新资产 ID/SHA/映射可验证，旧 refs 不偷换新图 |
| 11. ASR source identity | raw lesson full JSON/audio/PCM/raw模型证据与原报告 SHA 原样；侧车变化只更改 displayRevision；历史验收/两句精切边界及 fallback 不升格或重新计数 |
| 12. actual package consumers | unified + standalone 的受影响真实入口、receipt/archive/listening、非空备份和两引擎隔离；active hashed asset 实际 404/损坏不静默回退；B 新源码/包/review SHA 及真正原生结果，不能复用 A9 结果充数 |

本轮执行的检查仅为设计冻结文件 SHA 5/5、保护银行 SHA 5/5、旧 registry 引用的 SVG 文件 SHA 10/10，以及上述只读源调用链审查。SVG 此处仅验字节身份，没有新增图片或语言审校。上述十二族是 **待实现后执行的必要测试清单**，并非已通过的测试。Chromium/WebKit/设备/母语或人工听辨执行数量均为 0。
