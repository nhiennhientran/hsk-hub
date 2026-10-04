# HSK1 第4课 VI consumer scope（只读）

已完成实际 consumer 与 producer 链扫描；未改译文、runtime、fixture、评分库或旧记录。父审阅者报告 PDF 34–42 的 105/105 source entries 已逐页接受；本审阅者没有重复原页审阅。此处 sourceID 仍只是 consumer 的候选对应项，所有 `newValue` / `decision` 留空，交父审阅者最终 comparison 和绑定。

[consumer-scope.json](consumer-scope.json) 包含精确文件、JSON pointer / TS AST path 与行号、实际当前 VI、consumer chain、候选 sourceID、稳定身份与实际文件 SHA256。1163 个原清单 JSON 字段均从真实文件或实际 display projection 重取，0 value drift；没有只靠 grep 或原清单结论判定。

| 层 | 实际范围 | 处理边界 |
| --- | --- | --- |
| textbook 有效显示父 | 108 VI 字段；35 个 vocab 的释义/POS、14 dialogue、3地点、4 grammar及例句、2 tips、课题 | 冻结 textbook 先验证，再应用已有 display-revisions；standalone 与 unified bridge 共用此父。原冻结值单列。 |
| 当前 source-activities | `lesson-04-current.json`：262 VI 字段、36 activities、13 figures | 顶层 v3，但活动实际为13个v3、11个v2、12个v1；按各自 `activity.id@version` 处理 context，不能由文件顶层版本推断。 |
| 旧 source export | `lesson-04.json`：256 VI字段 | 历史静态 v2 export，非当前 catalogue。存档实际读学生保存的 context，保留原稿。 |
| stage3 vocab/listening | 35义词 + 5 listening question 的101 VI字段 | 独立冻结 producer；mix card.vi 来自 stage3 catalogue，不继承 textbook clone。只记录边界与35组稳定book/catalog/sense复用，不建议改库。 |
| 生成练习 | 实际调用 `practiceQuestions(effectiveLesson4)` 得12basic+3advanced；记录120个生成叶出现 | 包含 VI 和 mixed/Pinyin，不能当120个独立译文。选项、answer、反馈及prompt继承当前book父；未改评分数据。 |
| 当前 UI/template | 326 AST `pair/copy` / vi-property 位点 | 从实际TS读取，含参数模板、数字表、图片caption、标题与操作说明；不宣称已执行所有浏览器分支。 |
| retained旧route | 按真实HTML脚本次序只读重放得108有效VI字段 | `new-data → enrichment → data-corrections → pos-tips → integration-corrections → stage3/catalog → final-corrections`。最终unified package替换旧lesson/learning入口，不能把旧源码候选算最终route已加载。 |

具体复用需要一起考虑：

- 14条 dialogue 同时存在于 `/lessons/3/scenes/{0,1,2}/lines/*/vn` 和 current source activities `/activities/21/prompt/vi`、`/activities/23/prompt/vi`、`/activities/27/prompt/vi`。后者含越文角色名；前者角色 `/s` 只存中文，renderer另绘 `strong(line.s)`，不能把整段带角色名前缀的 source VI 机械复制到body后又重复角色。
- 活跃教材词汇详情从 revised scene.lines 取首个 `zh.includes(word.zh)` 的例句，27个词有此复用。API-only `examplesForSense` 是另一索引，当前mixed/review卡面不显示它；不能声称改了未展示的卡面例句。
- 35词按 `bookWordId → catalogIds → senseId` 绑定；21个原页生词有明确候选 sourceID，数字及补充词不能凭数量表自行造一个原页越译。
- 当前“多”的有效POS为 `pron / 代词 · Đại từ`，冻结/旧route为 `adj / 形容词 · Tính từ`。父页审报告原越文 `đt.`、gloss `(phó từ chỉ mức độ)` 确实存在；这是需要父最终语言裁定的源/现值关系，不能自动标准化缩写或用旧display父覆盖。
- source活动的title/instruction/prompt/fields/table/example进入 `snapshotContext()`；同版本context变化会拒绝复用旧草稿。旧archive显示context文字、表格、选项、history/draft，不画图片、不调用figure resolver。
- 当前figure ALT/note供活动图元；三个scene galleries也复用当前figure ALT，caption另外由 `Hình gốc trong sách · Trang ${printedPage}` 生成。ALT/note多为editorial辅助，只有明确source caption候选可以交父比较。
- 原中国版source活动的PDF页与本次越文版实际PDF页分别保留，不把旧 `printedPage+15` 当本次越文版统一映射。

冻结与历史边界共793个字段单列：既有五份冻结内容文件的537个本课字段，加旧source export的256字段（不能与当前370显示字段相加当新增语义数）；media references只保留身份边界。所有候选ID均验证存在于105条source输入。结果是scope与复用准备，没有新增accepted comparison、部署或全屏执行证书。
