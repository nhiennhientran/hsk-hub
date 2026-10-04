# HSK3 第10课：独立网站越南语比较冻结

官方教材源转录的119项接受结果保留在相邻 `hsk3-l10-source/`，本目录只记录网站实际消费者与该来源的比较和显示措辞建议。本次没有改动课程、中文、ASR、原词义ID、音频、历史练习库或部署。

|实际比较范围|记录数|边界|
|---|---:|---|
|课程JSON|603|537个显式VI叶字段、33个显示词性、33个原印刷词性元数据|
|Canonical词典|66|33个稳定词义的VI及POS；不合并多词性词义|
|课程目录课名|1|真实 `/24/title/vi` 消费者|
|本课渲染器与实际helper|89|85个原清单候选加4个同字节AST漏项；动态模板仅是生产入口，未声称所有分支本课可见|
|SVG完整desc|14|独立XML内容；与外层IMG ALT分开|
|以上比较记录合计|773|字段出现次数/候选，不能当作教材句数或官方一致项数|

26个来源活动有真实稳定ID、`targetRef`、字段ID、字段目标引用绑定。102个原清单中的拼音、中文及编辑元数据候选另分账；它们不能计作VI译文。119个源loci中106有明确消费者，13是源独有印刷标题/标记；没有为了计数凭空创建运行字段。

138条记录有措辞变更建议，包括同一来源在不同消费者的重复呈现。`variant`只说明措辞差异，不能自动解释为网站翻译错误。`no-source`242条与`editorial`256条保留当前内容，表示本次官方页没有其逐字VI对照，尚不认证其一般翻译正确性。

课名“Ngày mai em trả lại sách cho cô nhé”是李老师向学生说的话：em为被称呼的学生，cô为老师自称。现有bạn/tôi属中性称呼差异。早先逆向角色说明已更正；26个课文角色方向、全部相关标题/例句理由已重新核对。信件作者以em自称、称Gia Nguyệt为chị，不能把收信称呼当说话人。没有新增VI speaker字段或修改原中文角色元数据。

“后年”词表实印 `năm kia, năm sau`，同教材译文附录采用正确的 `năm sau nữa`；教育部《重编国语辞典修订本》第一义“明年的次年”另作主来源核证。两处词条消费者归为 `official-book-erratum`，保留当前正确值，等待root最终接受；忠实源转录保持不变。场景3印刷VI背景描述另有询问对象语境疑点，使用 `official-source-context-ambiguity` 分支保留当前语境译法，不能静默激活疑点文本。

复合活动只替换有来源的提示前缀，编辑参考答案、隐私/非评分说明尾段保留原字节。硬编码 `Bài khóa N` 会覆盖数据中的课文标题；3个真实AST消费者已列明，通用改为 `Bài khoá` 需要全课程接受，当前报告不授权全局改动。

## 值和位置契约

|字段|含义|
|---|---|
|`oldValue`|当前真实运行基线值；guard必须对比此值|
|`expected` / `expectedSourceWording`|教材来源locus或span措辞；不是旧值，也不总是完整目标值|
|`newValue` / `expectedEffectiveValue`|完整建议有效值；保留编辑尾段或经明确erratum分支保留当前正确值|
|`sourceIDs`|独立源审校已接受的真实来源记录ID|
|`field`|只有真实JSON文件的完整RFC6901指针|
|`astPointer` + `codeRange`|代码AST位置与UTF16源码位置范围；不是伪JSON数据指针|
|`xmlElementPath`|实际XML位置，与JSON和AST不同|

替换须先通过 `oldValue` 和来源/基线SHA身份校验，再采用完整 `newValue`。不能拿 `expected` 作为旧值或把仅教材前缀覆盖整个复合字段。源词性、来源元数据、拼音、中文、答案和冻结库不进入显示改动。

## 新发现的清单漏项及边界

冻结835清单原AST walker跳过所有名为`value`的键，因此也跳过真正的 `Property.value` 子AST。同字节 `dom.ts` 和 `lesson-view.ts` 的4个候选已独立补齐，实际源SHA、AST路径和值/范围复核通过：sourceNote整模板、补充内容条件尾段、回答标签、合成语音状态模板。原46463清单和历史来源报告未改写。现在main.ts已因root接入版本化显示改变，不能复用835旧字节位置冒称当前全局UI覆盖；该范围另待修正builder重跑。这4个网站提示没有本课印刷教材对应，保留当前编辑内容，不计官方match。

核对期间content.ts依赖发生版本化loader变更，SHA检查实际捕获，重新读取并刷新快照。当前HSK3 registry为显式null，projection返回基线副本，所以本课原JSON仍为当前显示基线。未来激活修订须另有生产接受与projection验收。

## 可复核证据

- `review.json`：最终分类、角色、erratum、边界与值契约。
- `field-comparisons.json`：670个完整实际JSON位置、旧值、来源和建议。
- `renderer-comparisons.json`、`svg-comparisons.json`：89个AST/helper与14个XML消费者。
- `role-consumer-observations.json`：26个角色与说话/称呼方向。
- `source-locus-consumer-coverage.json`、`source-activity-consumer-bindings.json`：119个来源和26活动的真实绑定。
- `renderer-object-coverage-supplement.json`：4个真实漏项与全局覆盖限制反例。
- `verification.json`：170项来源、结构、绑定检查通过。
- `actual-runtime-field-verification.json`：833项实际JSON/AST/SHA、前缀保留、角色、值契约检查通过。

依次执行以下只读生产代码的recipe（只会重写本目录诊断输出）；源冻结必须保持一致，运行依赖发生改变会报SHA失败，不应修改旧冻结来冒称原先已通过。

```bash
node course-app/docs/resume-20261004/qa-official-vi/hsk3-l10-comparison/scan-renderer-object-counterexamples.mjs
python course-app/docs/resume-20261004/qa-official-vi/hsk3-l10-comparison/build-independent-comparison.py
node course-app/docs/resume-20261004/qa-official-vi/hsk3-l10-comparison/verify-runtime-fields.mjs
```

本次仅冻结独立比较建议，不是正式修订激活/发布批准，也不证明全站越南语对标完成。
