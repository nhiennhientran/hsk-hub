# 第一步样板：状态、计分与迁移约定

本约定对应第3课独立样板，代码位于 `new-hsk1/hsk1/stage1/engine.js`。它只处理数据；不读取或写入浏览器存储，不访问原站门禁，不请求网络，不改变现有15课页面。完整题库、独立听力界面及混课词汇改造分别属于后续步骤。

## 1. 模块与存储边界

- 浏览器导出：`window.HSKStep1Engine`。
- CommonJS 导出：`require('./engine.js')`。
- `SCHEMA = 3`。
- 样板建议保存键：`KEY = 'ran_hsk1_stage1_v3'`。
- 旧站键仅作显式迁移时的标识：`LEGACY_KEY = 'ran_hsk1_learning_v2'`。
- 引擎不调用 `localStorage`，不清除或覆盖任何旧记录。页面层只向样板键写入；备份导入先验证成功，再由页面层保存。
- `blank()` 每次返回独立的新状态：

```js
{
  schema: 3,
  lessons: {},
  profile: { name: '', className: '' },
  words: {},
  questionReviews: {},
  preferences: {},
  archive: {},
  updatedAt: null
}
```

`updatedAt`、提交记录中的 `at` 均为 Unix 毫秒时间戳。页面展示按浏览器本地时间格式化；时间戳本身不以字符串时区保存。

姓名及班级各允许最多200个 JavaScript 字符串长度单位。引擎保留原文，不擅自删除前后空格；页面必须用 `textContent`、输入框 `value` 或等效安全方式展示，不能将学生输入拼接成可执行HTML。`preferences`、`words`、`archive`只接收可序列化的普通JSON值，拒绝循环引用、特殊原型对象与不安全对象键。

## 2. 题库约定

题库导出一个数组。第1步只需第3课：

```js
[
  {
    lesson: 3,
    title: '第3课',
    choice: [/* 5道四选一 */],
    sort: [/* 5道排序成句 */],
    translation: [/* 5道自由翻译 */]
  }
]
```

每个题目必须有全库唯一的 `id` 与匹配所在组的 `kind`。组的题目数固定为5；禁止提交空数组或只有部分题目的数组。选择题有4个选项和一个原始选项索引 `answer`。页面打乱ABCD显示位置时，保存的仍然是原始索引，而不是屏幕上的字母位置。

排序题使用 `tokens` 与经过内容审定的 `answers`。作答值是所有词块索引的排列，例如 `[1, 0, 2, 3]`。相同文字的词块仍有独立索引，保证每块只使用一次。`normal()` 对候选答案做NFKC归一化，并忽略空格、零宽格式字符与标点；不会把未登记的不同词序自动认定为正确。自然存在的多解须在题库中事先列全，或通过题干限定明确的作答范围。

自由翻译题必须有：

```js
{
  id: 'l03-translation-01-free',
  kind: 'translation',
  assessment: 'manual',
  prompt: '越南语题干'
}
```

学生题库中的翻译题不得含 `answer`、`answers` 或 `options` 字段。教师参考译文保存在独立教师资料中，不作为浏览器自动评分输入。

`KINDS` 还包含 `listening`，以便约定后续独立模块的数据形状；第1步页面不使用听力题库或界面。没有听力数组时，统计明确返回 `available: false, total: 0`。该预留不表示75道听力已经完成。

## 3. 状态快照及完成规则

`group(state, lesson, kind)` 获取或初始化：

```js
{
  draft: {},       // 当前草稿：qid → 原始选项索引/词块索引数组/翻译原文
  orders: {},      // 客观题显示顺序，必须是完整的索引排列
  first: null,     // 第一次已提交的完整快照；重做不会覆盖
  attempt: null,   // 当前轮提交结果；开始重做时清空
  latest: null,    // 最近一次已提交的完整快照；开始重做时保留
  completed: false,
  history: []     // 最近20次完整提交快照；首次另行永久保留
}
```

每次提交后，`first`、`attempt`、`latest` 和历史条目均是独立数据副本。修改草稿或开始重做不会改变已提交记录。翻译截图须使用 `latest.answers`，而不是当前草稿；学生开始写新稿但尚未提交时，上一份已提交稿仍有独立可读的内容和时间。

`PATH = ['choice', 'sort', 'translation']`。第3课先完成5道选择题，再完成5道排序题，再完成5道翻译。每组全部作答并提交即 `completed: true`，即使客观题得分为0/5也会解锁下一组。不设置正确率门槛，也不要求订正后才解锁。

`canOpen(state, lesson, kind)` 只检查该课前面的作业组，不锁其他课。选择题和独立听力是各自入口。`restart()` 清空当前草稿、显示顺序及 `attempt`，保留 `first`、`latest`、历史记录及 `completed`；后续已经开放的组不会再次被锁。

## 4. 自由翻译严格不评分

`isAnswered(q, value)` 对翻译只判断：

1. 值为字符串；
2. 长度不超过12000个JavaScript字符串长度单位；
3. 去除Unicode空白和零宽格式字符后，还有内容。

这里只判断是否填写，不判断是不是中文、不做词数要求、不评语法与意思。标点、拉丁字母、学生尚未完成的中文表达均不会被引擎评价为语言错误。原始空格、换行、全角字符等都原样保存。纯空白或纯零宽字符不能作为“已作答”；带实际内容的零宽字符不会被删除保存。

`check(q, value)` 对所有翻译值都返回 `null`，包括空草稿。成功提交的快照统一为：

```js
{
  assessment: 'manual',
  answers: { /* 原始5份译文 */ },
  results: null,
  correct: null,
  total: 5,
  at: 1234567890,
  questionFingerprints: { /* 内容对应标记 */ }
}
```

不使用 `false` 或 `0` 代表“人工未评分”，避免页面误当错误或0分。翻译永不进入客观题分母、错误题复习或机器正确率。`completed` 和 `submitted` 表示页面保存了一次完整作答；它们不表示老师已经收到截图或已经批改。

## 5. 调用与返回值

```js
E.submit(state, 3, 'choice', lesson.choice, optionalTimestamp);
E.restart(state, 3, 'choice', optionalTimestamp);
E.canOpen(state, 3, 'sort');
E.totals(state, 3, lesson); // 第三个参数也可以传整个题库数组
E.validateImport(parsedBackup, bankArray);
E.migrateLegacy(parsedV2, bankArray, optionalTimestamp);
```

提交返回：

```js
{ ok: true, manual: false, correct: 4, total: 5, completed: true, attempt: { ... } }
{ ok: true, manual: true, correct: null, total: 5, completed: true, attempt: { ... } }
{ ok: false, reason: 'missing', missing: ['qid-2', 'qid-5'] }
{ ok: false, reason: 'locked' }
{ ok: false, reason: 'submitted' }
```

客观题快照中 `results` 是 `{qid: true | false}`。重复点击提交不会增加次数、改变首分或再次更新复习记录。题库格式、非法答案类型或无效时间等结构性错误抛出异常，页面应提供可读提示并保留现有状态。

作业全部完成、首次选择4/5且排序4/5时：

```js
{
  homework: {total: 15, submitted: 15, completedGroups: 3, done: true},
  automatic: {
    total: 10, submitted: 10,
    firstCorrect: 8, latestCorrect: 8,
    firstPercent: 80, latestPercent: 80
  },
  manual: {total: 5, submitted: 5, correct: null},
  listening: {
    available: false, total: 0, submitted: 0,
    firstCorrect: 0, latestCorrect: 0,
    firstPercent: null, latestPercent: null
  }
}
```

自动评分百分比采用“已提交的客观题数”作为分母：只提交选择题且答对4道时，是首次4/5（80%），同时显示自动评分进度5/10；不是声称已经完成全部10题。无客观题提交时百分比为 `null`。翻译单独显示5题是否提交。`done` 仅指三组作业完成，不表示全对或教师批改完成。

## 6. 备份验证

`validateImport()` 返回清洗后的新对象，不修改传入对象；验证失败抛出异常，页面不得替换当前有效状态。它核对：

- schema、课程范围、组归属以及题目ID；
- 答案类型、排序索引唯一性、5题提交完整性；
- 显示顺序是否为正确长度的完整排列；
- 首次、当前、最近和历史提交之间是否一致；
- 已提交记录与题库内容对应标记是否匹配；
- 作业先后顺序及是否存在无首次记录的伪完成状态；
- 翻译原文长度、姓名和班级长度、时间戳与JSON结构。

所有客观题的首次、当前、最近和历史正确数都根据保存的答案重新计算。导入文件中的 `correct`、`results`、`total`、`assessment` 不能决定评分；人工翻译一律重建为 `results: null, correct: null`。`completed` 根据有效首次完整提交重建，不能靠修改布尔值伪造完成。

每次提交保存 `questionFingerprints`，用于发现“题目ID保留、题干或评分内容已改变”的旧结果错配。它用于数据一致性，不是加密、防作弊或身份验证。客户端静态站无法防止学生自行修改全部本地答案，教师仍以课堂要求和截图作答判断学习情况。

客观题复习记录只根据保留的真实提交答案重建，旧翻译机器结果不会混入。历史保留上限为20次；首次快照独立保留。超过这个范围的累计练习次数不能由这个样板备份声称完整还原。

## 7. 旧版迁移

`migrateLegacy()` 是显式的数据转换函数，不自动读取旧站、不写入旧键。传入的v2原数据完整复制到 `state.archive.legacy`，其中包括旧翻译的选项索引、首次成绩、最近记录、草稿和历史。这个归档不参与任何当前计分或完成判断。

恢复到当前活动状态须同时满足：

- 当前题目明确设置 `legacyCompatible: true`；
- 使用原来的题目ID；
- 原答案仍符合当前题目类型与完整性；
- 整组5题都兼容，才可恢复该组已提交记录；
- 排序的前置选择题也能恢复，才可恢复排序组的完成状态。

只有部分题兼容时，合法旧草稿可以带入，旧首次记录继续保存在归档里；该组不被认作已完成。更换了题目内容却保留ID时，题库作者必须取消 `legacyCompatible`。默认没有这一标记就不继承。

旧版订正会改变草稿，但未改变首次成绩。遇到“旧草稿已订正、旧提交仍是原始错答”的情况，引擎保留原首次与最近已提交成绩，将订正后的草稿作为未提交重做稿，避免把它冒充一份已提交满分成绩。

旧听力仅在当前传入的题库包含兼容听力组时恢复，并单独统计。第1步第3课样板没有听力数组，旧听力只保留在归档中。

旧翻译一律不继承到自由翻译组，无论旧、新题目ID是否相同或是否匹配。新翻译从未提交状态开始。归档保留旧记录与题目ID，不能因为新的自由翻译ID不同就丢弃原始记录。

`archive.migration` 记录 `restoredGroups`、`draftOnlyGroups`、`heldGroups`、`archivedTranslationLessons` 与数据验证提示，供明确解释迁移结果。没有兼容的新版前置题时，原排序结果仍在旧归档中，但不会绕过新版作业的顺序要求。

## 8. 验证命令及覆盖范围

```bash
node --check new-hsk1/hsk1/stage1/engine.js
node --test tools/tests/stage1-engine.test.cjs
```

测试覆盖：0/5提交后解锁、漏题定位、重做不锁回、首次与最近结果分离、重复提交、原始选项索引、排序多解和重复词块、Unicode空白、翻译原文保留及上限、15项作业/10道自动题/5道人工题、部分提交分母、备份恢复、成绩重算、题库改动、跨课跨组错误数据、无效类型、不安全JSON、原始v2结构迁移、旧订正稿和旧翻译归档。

迁移测试实际使用仓库旧 `learning-engine.js` 生成v2的 `first/attempt/corrections/history` 结构后再迁移；没有用新格式冒充旧格式。纯引擎测试不能替代浏览器上的中文输入、截图布局、手机触控及实际保存检查；页面验收需另行记录。
