# 越南语运行内容清单与修订接入准备

本目录只准备清单、复用关系和审核模板，没有改译文，没有开展三本教材的全量逐页审校。所有审核项均为 `pending-phase-B`。已按指定源码 HEAD `8dff803cc2f8d1956d5853ef40073c670e265cc0` / tree `422f45046960d6148075ee81d891f0569839441c` 生成 prepared 快照，生成时 837 个输入逐字节相等。随后工程负责人修复 `package-unified.mjs` 的音频/字形输入守卫，造成一项工具 drift；其余 836 输入未变。最终来源冻结须在该修复独立验证并提交后的新工程 HEAD 真实重跑，不能把 prepared 快照冒充当前工程基准。

## 复跑与读取

从仓库根目录运行：

```bash
VI_SOURCE_REF=8dff803cc2f8d1956d5853ef40073c670e265cc0 node course-app/docs/resume-20261004/vi-inventory/build-inventory.mjs
node course-app/docs/resume-20261004/vi-inventory/validate-inventory.mjs
python course-app/docs/resume-20261004/vi-inventory/supplement-current-head-review.py
```

依赖仓库已经安装的 `course-app/node_modules/rolldown` 的 JS/TS 解析器，不请求网络，不调用浏览器，不写学习数据，不运行评分逻辑。脚本只写本目录。读取全量清单示例：

```python
import gzip, json
rows = json.load(gzip.open('course-app/docs/resume-20261004/vi-inventory/inventory.json.gz', 'rt'))
learning = [r for r in rows if r['learningFieldOccurrence']]
lesson4 = [r for r in learning if r['component'].startswith('hsk1-') and r['lesson'] == 4]
```

| 文件 | 内容与用途 |
|---|---|
| `inventory.json.gz` | 每个内容字段、数组选项、代码字面量或动态模板的实际值、完整位置、中文语境、producer、visibility、修订服务、consumer； gzip 压缩 JSON 数组 |
| `runtime-files.json` | 每个枚举源文件的 SHA256、加载类别和负责服务；包括压缩数据块、后续覆盖层、包装脚本 |
| `semantic-consumers.json` | 稳定 sense ID、词条 ID、targetRef、activity ID@version、field ID 所指向的复用关系；没有按相同越南语字符串合并 |
| `summary.json` | 生成时间、HEAD commit/tree、实际工作文件哈希口径、内容结构实测数、学习出现/metadata/静态候选分开计数、缺失中文语境数 |
| `legacy-content-layers.json` | 旧 HSK2、旧 HSK3 内容层执行顺序、哈希和成功/失败状态 |
| `legacy-content-contracts.json` | 实际 HSK3 入口在 audit 后执行的词汇分类函数；包括中文的 POS 由 danh từ 到 danh từ riêng 的运行差异 |
| `legacy-practice-banks.json` | 3 个旧版实际 fetch 的外部 gzip bank；18 块源、版本/解码 SHA、完整字段与逐题计数 |
| `legacy-practice-consumers.json` | 1360 个旧题 stable ID 及全部 15630 个叶字段、原 options/segments/answer index；中文和身份字段也保留 |
| `svg-consumers.json` | 438 个 approved SVG 的稳定资产、manifest、源题与实际 HTML ALT/description/label 关联 |
| `supplement-svg-consumers.json` | 扩展前缺口的独立只读证据；当时 43073 行、367 输入和 412 SVG desc 缺项的原身份保留，不能再当最终计数 |
| `supplement-ascii-truth-choice-gap.json` | 第一次扩展后还漏 89 个大写 Sai 的真实叶字段；失败记录保留，最终清单已补齐全部 186 个判断题选项/答案叶 |
| `supplement-pilot-input-coverage.json` | 三课 1798 个字段出现、747 个带命名空间 owner 群组；语义 ID 与重复出现分开 |
| `parse-failures.json` | JS/TS 解析或 gzip 解包失败；正常结果为空数组 |
| `pilot-source-index.json` | 建议三课试点与官方 PDF 哈希、候选正文页索引；尚未审校 |
| `pilot-audit-template.json.gz` | 三课逐项审核模板，教材原越南语、精确原页、判断、证据、修订接入都留空；尚未审校 |

`gitHead/gitTree` 是本轮指定的源码基准，`actualHEADAtGeneration` 是生成时当前 Git 指针。脚本拒绝任何运行输入与指定 HEAD 的字节差异。审核脚本和输出本身当时尚未收录于指定 HEAD，其 SHA 单独保存；不能由源码 HEAD 推断文档已被提交。

## 范围与计数

prepared 主清单是 **46463 个字段出现/静态候选、837 个实际输入文件**，生成时 18 项结构、原叶绑定和来源身份检查通过。原 43073 行清单的缺口已进入生成器：3 个外部 bank 增加 2978 个 VI 出现，SVG 增加 412 个 VI desc；实际 HSK3 分类的 POS 改动保持原字段身份。当前一项 package 工具 drift 另列，等待新工程 HEAD 最终重跑。未增加教材对标完成数。

| 身份口径 | 数量 | 不能等同的口径 |
|---|---:|---|
| 新两引擎稳定词义 | 1093（H1 344 + H2 226 + H3 523） | 相同汉字、不同义项、lesson-local 重复展示分别保留 |
| H2/3 source activity | 918 | 其字段、源列和反复渲染不是新增活动 |
| H1 activity ID@version | 484 | 旧版本 context 不混入当前版本 |
| 保留旧版练习 question ID | 1360（360/360/640） | 与新 48 课不可仅凭课号绑定；有 15630 个原始叶字段 |
| 当前 approved SVG 资产 ID | 438 | 其中 412 个 VI desc 是资源内 metadata，不是已验证可见正文或 AT 读出 |
| 动态模板 producer | 498 | 不代表任意名字、数字、错误及所有运行分支已被穷举 |

`semantic-consumers.json` 的 4293 条 bindings 是上述不同类别的集合，不能把总数当可相加的教材语义单位或语言完成率。字段级唯一目标使用 `semanticKey`；同一句在 prompt、选项、反馈、SVG、不同课程出现时都保留原 owner/index。

逐项枚举当前被内容服务加载的 HSK1 冻结教材、34 项 display overlay 的有效值、344 义词库/听力/混卡、旧作业、新 30 题作业、练习档案、15 课 484 个 source 活动，及 HSK2/3 33 课、词义目录、课文、语法、练习、图示 ALT/caption/note/feedback、附录关系和首页摘要。实际结构为 HSK2 60 text、311 line、226 word、45 grammar；HSK3 72 text、427 line、523 word、63 grammar。总计 132 text、738 line、749 word、108 grammar。这些是结构单位数；不能把清单字段出现总数当语义单位数。

当前主程序没有名为 `sourceViews` 的 JSON 属性。教材源列通过 `targetRef`、field 引用和 `lesson-view.ts` 的渲染逻辑复用源项；清单保存这些真实关系，不制造一个不存在的独立库。

UI 包含 `hsk1-app/src` 和 `course-app/src` 中的 Copy 对象、双语函数参数、直接字面量、模板字符串、内联 HTML 脚本、静态 HTML 文本和 ALT/title/placeholder/aria-label，以及包装脚本生成的入口与门户文案。CSS 的静态 content 也枚举；content:attr 需要通过其 JS/DOM attribute producer 核对。动态模板保留 expression producer，不能把任意姓名/数字/分支结果当作已穷举的固定文本。

旧 HSK2 是 15 课，旧 HSK3 是 20 课。脚本解包原数据，按实际内容层重放 locked/corrections/audit，并在真实顺序点执行 `applyTextbookVocabContract`，取得内容快照。3 个外部练习 bank 按实际 fetch 列表读取 18 块，而非把目录中的历史替代块一并计入。包裹 metadata 和全部原题叶字段另外留存。没有模拟完整 DOM 和学生状态；后续 DOM 文案作为源码候选另列，不冒充浏览器结果。H4 专用源码项明确为 `editorial-no-uploaded-HSK4-book-counterpart`，没有本次教材对应源；不会按旧课号同步。

必须区分以下行：

- `hsk1-textbook` 是冻结 producer，`hsk1-textbook-effective` 是其验证后显示投影。学习出现只计后者，不把两份相加。改变或被替代的原值仍在前者保留。
- `additionalSourceEvidence`、`appendixSource`、`appendixMetadata`、`sourceNumberPosSource`、coverage/review/source 等属于引用证据。它们保留在清单，但 `learningFieldOccurrence=false`。
- HSK2/3 canonical lexicon 的 VI/POS 目前是被加载的规范引用值。词卡用 `canonicalWordPool()` 返回的 lesson-local word 值，不能只修改 lexicon 期待所有页面自动同步。
- 原 lesson-04 JSON 是历史导出和兼容资料；实时目录加载 `lesson-04-current.json`。历史 producer 与实时出现分别登记。
- `runtime-source-static-candidate` 和 `legacy-runtime-reachability-candidate` 是静态源码候选，可能有不可达/未触发分支。它们不计入已经验证的学习出现。

`semanticKey` 使用 component、完整 owner/field 命名空间和结构路径。`blank-1` 这样的课内/活动内 field ID 不会在不同活动之间混为一条。代码使用 AST 结构路径，value 改写不会仅因字符长度改变而换成另一身份。没有对应中文的 VI-only 错误、HTML 或旧数据留 `chineseContext=null` 并明确原因；不编造中文翻译。已有中文语境只是实际结构中的 source clue，逐页审核仍需确认它是否是该 VI 的精确对应项。

## 修订接入与历史保护

| 内容 | 实际机制 | 可行修订方式 |
|---|---|---|
| HSK1 教材 | `textbook.ts` 先验证冻结 book/media/catalog，再经 `reviseTextbookDisplay` 应用现有 34 项 expected/value 修订 | 新官方 VI 的 expected 指向现有 34 项 overlay 后的有效父版本；官方 PDF/原页分开记录，不修改五个冻结文件或媒体身份 |
| HSK1 教材例句复用 | `vocabulary.ts` 的 `examplesForSense` 为服务 API/测试使用；当前 vocabulary/review 卡面不显示它。active 教材词汇详情另从 revised scene.lines 取例句 | 统一 API 索引的 sidecar 只报告为工程一致性修复；保留 pure constructor 默认路径。不能声称修复了未展示的卡面例句，也不能把 API 测试算 native 卡面例句验证 |
| HSK1 344 义词卡/混卡 | 完整 catalog 指纹和 mixedCardFingerprint 都含原 VI；普通 practice sense fingerprint 才只依赖 senseId 与中文形式 | 保持原 catalog/cards/sourceRecords 用于 validation/controller/store；渲染时以稳定 record/sense ID 取独立显示 DTO。词义变化另立身份，不能混入措辞一致化 |
| HSK1 听力 | listening fingerprint 包含 promptVi、transcript VI、options、answer 等；导入和历史检查依据原 catalog 重算 | 显示 helper 以 question ID 与原 option index 投影 VI。不要把改译文后的 catalog 交给 controller；随机选项须映射回原 index；原选项、答案、指纹和旧记录不变 |
| HSK1 作业与练习档案 | stage2 指纹含 prompt/meaning/options；homework30 保存 q.fingerprint；档案 aliases 指向 authority task | 以 question/authority ID 投影 prompt、meaning、option、feedback、explanation 的显示值。保留 controller 输入、评分库与 receipt 解释的原身份；原旧题目精确审阅和当前教材对齐展示需明确区分 |
| HSK1 source 活动 | `activity.id@version`；context 保存 prompt/instruction/fields/table 等；同版 context 改变会拒绝复用草稿 | 凡对 context 的 VI 改动都升活动 version；旧 record/context/history 原样保留。独立路径审查确认 archive UI 只显示文字/表格/fields/history/draft，本来不渲染图片、不调用 figure resolver；旧 context 仍保留 figure ID/SHA。图元 ALT/note 审校属于当前图元展示，不能声称旧档案图片已展示或已认证 |
| HSK2/3 词库 | canonical senseMap 去重，但页面/混卡返回 lesson-local word | 按 sense.sources.wordId 同步所有明确复用的 lesson word 和 canonical VI/POS，保持不同词性/义项/context 的独立 ID；不靠字形相同或译文相同合并 |
| HSK2/3 作业/听力 | `grade()` 保存 questions 深拷贝及 `questionRevision`；旧无快照记录不依据新库补造题目 | 当前译文经审核后改当前 Question；新提交自然生成新 revision。旧 questions/answers/correct/total/profile 不改；旧无快照记录保留原值，不用现译文重新评分 |
| HSK2/3 source 活动 | record 只保存 field values、checkedAt、updatedAt；没有历史 Copy 快照 | 措辞修订可保持 field ID 和值意义；不能声称旧记录保存了原译文。若改变题意、选项身份或评分含义，应新增活动/field 身份并保留旧记录档案，而非沿用 checkedAt 冒充新题已完成 |
| UI/ALT/caption/editorial | Copy/helper/renderer/literal 来源不同，部分没有教材原文 | 有教材对应项统一术语与人物称谓；无直接教材原文的教学说明/操作文案作语义审校，标记 editorial，不伪称教材原句 |
| 旧版 HSK2/3 | 旧版 15/20 课，另一课程与源书 | 只在能证明同语义/同内容项时对齐；不能将新 18 课按序号覆写旧 20 课，不动旧进度/成绩/storage keys |

上述 HSK1 bank display 投影尚未实施。本目录是根任务的接入建议，不是假装已有完备通用 VI overlay 服务。尤其不要将展示 clone 误传给原 controller：那会使 listening/stage2 的内容指纹改变，造成历史导入拒绝或错误解释。

## B 阶段建议执行顺序

1. A9 通过后在冻结 commit/tree 重跑清单。对所有源文件哈希和官方 PDF 哈希留证，生成语义审核 owner 清单；先完成静态候选的活跃/不可达确认和缺失中文语境定位。
2. 使用 HSK1 第4课、HSK2 第2课、HSK3 第10课的试点模板验证三类接入：冻结显示投影、lesson-local/canonical 复用、source 活动版本和旧 receipt 保护。此选择只为覆盖不同修订机制，不表示已知三课全部有错。
3. 每项视觉读取官方原页，填写精确 printed/PDF page、section、对应中文、教材原 VI、现 VI、判断和证据。HSK2 渲染须使用 CropBox。HSK3 课文译文附录另行定位，不从中文正文 PDF 页推测译文页。
4. 判断至少区分 match、正确但表达差异、语义错误、教材疑似错印、无直接教材对应的 editorial 项、尚未定位源。表达差异尽量采用教材，教材明显错误不得机械复制，须保留交叉核对证据。
5. 对同一义项/课文行/源题形成改动 manifest，一次性更新所有已证明的 consumers；然后由独立复核者读取原页和实际显示结果。生成新清单做旧/新 producer 与 consumer 差异验证。
6. 每批保存正确成果与未解决项，继续后续课批；最终对所有已加载 VI owner 和 browser-visible candidate 做闭环。凡未定位/未复核项不能被标成已完成。发布前给出最终源码、构建及浏览器证据，等用户确认后再上线。

## 明确的边界

这是可复跑的源清单，不是全站逐屏执行证书，不是 OCR 准确率证书，也不是教材对标完成率。未标语言的 ASCII-only 文本、CSS content:attr 的动态来源、残留旧入口和自定义动态 DOM producer 仍需在最终浏览器路由清查时确认。HSK4 专用教材内容缺少对应上传书源。正式工程产物应按实际 package/routes 再收敛 active 范围，保留不加载/历史记录；不能为让计数好看直接删除未解决范围。
