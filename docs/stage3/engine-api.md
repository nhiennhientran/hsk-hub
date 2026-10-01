# 第三步状态引擎接口

文件：`new-hsk1/hsk1/stage3/engine.js`。CommonJS `require()` 或浏览器 `window.HSKStep3Engine`。纯数据代码，不读取或写入浏览器存储，不控制音频，不访问DOM或网络。

## 版本与数据输入

`E.APP = 'hsk1-stage3'`，`E.KEY = 'ran_hsk1_stage3_v1'`，`E.SCHEMA = 1`。不自动迁移或修改第一步、第二步、旧站的存档。`catalog = {listening: [...], vocabulary: [...]}`，原始字段遵循 `data-contract.md`。同一 `senseId` 的多个词源记录合为一个义项；不能把不同词形挂在同一义项ID下。

引擎按题目实际内容生成听力版本指纹。换选项、答案、音段或原文，旧记录会明确拒绝导入，不静默继承旧分数。词卡指纹绑定 `senseId` 和中文词形；改越语措辞、拼音或补来源/音源不会清空日程。若词义实质变化，编辑者须分配新 `senseId`。指纹用于发现内容版本不匹配，不是防作弊签名。

所有操作方法原地修改 `state`。查询方法不修改。失败统一抛出 `Error`，带稳定英文 `error.code` 与可显示的越语 `error.message`。UI应捕获并在就近区域显示错误。输入 `now` 为整数UTC毫秒数，默认 `Date.now()`；`random` 是返回 `[0,1)` 的函数，默认 `Math.random`。

## 初始状态与偏好

```js
const state = E.blank();
// {
//   app, schema, sequence: 0, updatedAt: null,
//   preferences: {
//     module: 'listening', lessons: [1], listeningMode: 'all',
//     vocabularyFilter: 'all', direction: 'zh-vi', shuffle: true, rate: 1
//   },
//   listening: {records: {}, session: null},
//   cards: {schedule: {}, review: null}
// }
E.setPreferences(state, {lessons: [1, 3, 15], rate: 0.75}, now);
```

`setPreferences(state, patch, now)` 返回新的 `state.preferences`。只接受上述偏好字段；课号为1—15的整数，自动去重并排序，可为空数组。`module` 为 `listening/vocabulary`，`listeningMode` 为 `all/wrong`。速度只接受 `E.RATES = [0.65, 0.75, 1, 1.25, 1.5]`。偏好变更不重建正在进行的冻结队列；须由学生明确启动新一轮。

## 听力

```js
const session = E.createListeningSession(state, catalog,
  {lessons: [1, 3], mode: 'all', shuffle: true}, now, random);
const qid = session.questionIds[session.position];
const response = session.responses[qid];
// {selected: null | 0..3, submission: null | Submission, listenCount: 0}
const visibleOptionIndexes = session.optionOrders[qid];
E.selectListening(state, catalog, qid, sourceOptionIndex, now);
E.recordListen(state, catalog, qid, now); // 成功开始播放后调用；返回听取次数
const result = E.submitListening(state, catalog, now);
// Submission: {answer: 0..3, correct: boolean, at, fingerprint}
E.nextListening(state, now); // {position, done}
```

`sourceOptionIndex` 始终是题库原始 `options` 下标；界面的A/B/C/D对应冻结的显示顺序，不作为存档答案。选答案不会评分，不生成 `submission`。只有主动提交后，页面才应渲染原文、拼音、越译、正确选项和解析。引擎没有保密服务器；UI隐藏规则由UI验收负责。

`createListeningSession` 返回 `state.listening.session`，包括 `id/lessons/mode/questionIds/optionOrders/fingerprints/position/responses/startedAt/finishedAt`。题目顺序在新轮创建时按 `shuffle` 设置；四个选项总在新轮随机排列。新轮冻结全部ID和显示顺序，刷新或返回不重新打乱。错题轮取所选课中**最近一次已提交答错**的题；后来在本轮答对也不从本轮中间消失。全部轮包含所选课的全部听力题。无符合题目时返回空轮；不会偷偷切到其他课程。

`recordListen` 只增加当前题 `listenCount`，提交前后均可重听，不影响分数。UI在媒体真正启动后调用，加载失败不要算成功播放。恢复数据只恢复当前题与答案，不自动播放、不存半个音节的播放位置。

每题首次提交写 `state.listening.records[qid].first` 一次；以后新轮只更新 `latest` 和 `attempts`。一个轮内同一题不能再次提交或修改已提交答案。新轮开始不清除首次成绩。听力记录完全独立于第二步作业与词卡日程。

`moveListening(state, position, now)` 返回 `{position, done}`，允许回看已做题；向前只能经过已提交题。`nextListening` 在最后一题完成后保持最后位置，返回 `done: true`，不自动开始下一轮。

`listeningSummary(state, catalog)` 是纯查询：

```js
{
  session: {total, answered, unanswered, correct, percentAmongAnswered, done},
  overall: {
    total, answered, firstCorrect, latestCorrect,
    firstPercentAmongAnswered, latestPercentAmongAnswered
  },
  wrongIds: ['l01-listen-01']
}
```

`session.total` 是本轮冻结题数；`overall.total` 是题库题数（正式数据为75）。正确率分母是已提交题数，未提交时为 `null`。UI必须同时显示已答/总数，不能将部分作答的正确率表达为整轮最终成绩。空轮 `done: false`。

## 词卡合并与过滤

```js
const deck = E.makeDeck(state, catalog,
  {lessons: [1, 3, 15], filter: 'due', direction: 'vi-zh', shuffle: false}, now, random);
// {lessons, selectedLessonCount, mergedCount, distinctForms, filteredCount,
//  senseIds, cards, filter, direction}
```

`makeDeck` 不修改状态。`mergedCount` 和 `distinctForms` 为所选课合并后、过滤前的义项数与不同中文词形数；`filteredCount` 为过滤后卡数。每张合并卡固定提供：

```js
{
  senseId, zh, py, vi, senseZh, cueZh,
  lessons: [1, 3], sourceRecords: [/* 所选课的完整原始词源记录 */],
  meanings: [/* 同义项各来源的越语表述，去重 */],
  category, extension, audio, audioRecordId
}
```

主展示字段来自该义项在当前选择内的首个来源；`sourceRecords` 保留全部所选来源，不跨到未选课冒充本课音源。`audio` 取首个可用音源，`audioRecordId` 是对应原始 `v-lXX-…` 记录ID；全无音源时两者为 `null`，不影响翻卡或自评。音频最终路径由播放器/媒体映射按原始记录ID解析。

过滤定义明确且独立于听力：

| filter | 收录条件 |
|---|---|
| `all` | 所选课全部义项 |
| `unfamiliar` | 从未自评，或最近自评不是 `good` |
| `wrong` | 最近自评是 `again`，即“需再练” |
| `due` | 从未自评，或 `dueAt <= now` |

方向为 `zh-vi` 或 `vi-zh`；不改变义项身份和日程。相同词形的不同义项不会合并。跨课相同义项只在本轮出现一次，所有来源仍可查看。

## 翻面、自评与可解释的间隔

```js
const review = E.startReview(state, catalog, options, now, random);
const senseId = review.senseIds[review.position];
E.revealCard(state, senseId, now); // 返回review，翻面状态单独保存
const rating = E.rateCard(state, catalog, 'good', now);
// {rating, at, previous, advanced, early, schedule}
E.nextCard(state, now); // {position, done}
```

`startReview` 使用与 `makeDeck` 相同参数，创建 `state.cards.review`：
`id/lessons/filter/direction/senseIds/position/revealed/ratings/fingerprints/startedAt/finishedAt`。
`revealed[senseId] === true` 表示已翻面。`ratings[senseId]` 表示本轮已自评，保存这次动作与前后日程；刷新、返回、再次点击不会重复计数。评分后UI依据 `ratings` 禁用本轮重复自评；引擎也会拒绝。

`moveCard(state, position, now)` 可回看；向前须先完成经过的卡片自评。`nextCard` 在最后保持位置并返回 `done: true`。返回旧卡不会自动隐藏答案或清空已评记录。

日程位于 `state.cards.schedule[senseId]`：

```js
{fingerprint, level: 0..5, lastRating: 'again'|'hard'|'good',
 dueAt, ratedAt, reviewCount}
```

| 自评 | 级别与下次安排 |
|---|---|
| `again` 未记住 | 级别重置为0，10分钟后 |
| `hard` 困难 | 保持当前级别，1天后 |
| `good` 记住，新卡或已到期 | 升一级，依次1/3/7/14/30天；最高保持第5级并续排30天 |
| `good` 记住，但未到期 | 不升级，也不推迟已有到期日；本轮仍记录一次自评 |

`early: true` 专指未到期 `good`。`advanced: false` 也可能只是已在最高级，不能单凭它显示“未到期”。恰好 `now === dueAt` 算到期。日程以整数毫秒记录，UI按浏览器当地时间显示；这是透明的固定规则，不声称是训练出的个性化记忆模型。

`cardSummary(state, catalog, now)` 返回全册 `totalSenses/rated/unfamiliar/wrong/due` 和当前 `review:{total,revealed,rated,done}`。这些是自评与进度，不是系统判断学生翻译正确。

## 显式备份

`exportBackup(state, catalog)` 返回经过完整验证与重算的新JSON对象；UI再 `JSON.stringify` 下载。`importBackup(parsed, catalog)` 验证后返回全新状态，不修改输入或当前状态。`backupByteLength(value)` 给出紧凑JSON的真实UTF-8字节数；`MAX_BACKUP_BYTES` 为4 MiB。没有自由长文、无限历史或任意归档字段，正式75题与全量义项的合法状态远小于预算。

导入会验证APP/版本、课号、题目与义项归属、冻结队列、显示排列、答案类型、内容指纹、提交快照、揭面/自评记录、日程和恢复位置；听力真假分数从所选答案重新计算。翻卡本轮的日程从自评动作与前一日程重新计算、核对。未知ID、循环对象、危险原型键、非法类型、过深结构和过大输入都会拒绝。没有云端可信评分承诺；本地可编辑备份不是防作弊证据。

播放器停止、手动确认导入、先检查再替换、旧状态恢复、配额失败下载、多标签防覆盖由根UI负责。引擎不会读写任何旧存储键，也不会在导入后自动播放。

常见动作错误码：`ANSWER_REQUIRED`、`ALREADY_SUBMITTED`、`REVEAL_REQUIRED`、`RATING_REQUIRED`、`ALREADY_RATED`、`EMPTY_SESSION`、`EMPTY_REVIEW`、`NOT_CURRENT`。数据错误含 `WRONG_APP`、`UNKNOWN_ID`、`CONTENT_CHANGED`、`INVALID_BACKUP`、`INVALID_SCHEDULE`、`BACKUP_TOO_LARGE`。

## 验证职责

`tools/tests/stage3-engine.test.cjs` 用小型明确fixture验证边界，再在正式JSON齐备时验证75题和全部义项。时间与随机数注入只用于纯Node软件测试。真实UI、媒体、移动宽度、五档速度及最终打包物由第三步浏览器测试负责；纯引擎测试不能声称已听取或验证了音频内容。
