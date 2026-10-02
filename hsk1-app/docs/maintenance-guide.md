# HSK 1 发布后维护指南

本指南面向维护仓库的开发者，说明在哪里修改、如何验证，以及哪些修改会影响学生现有记录。学生操作见 [student-guide.md](student-guide.md)，教师收据与成绩口径见 [teacher-guide.md](teacher-guide.md)。示例是后续维护步骤，不表示本次发布改过题目、规则或音频。

## 工作目录与边界

以下路径除特别注明外均相对 `hsk1-app/`。从仓库根开始：

```sh
cd hsk1-app
node --version
npm ci
npm run check
npm run index:check
```

Node 要求 `>=22.12.0`；依赖以 `package.json` 和 `package-lock.json` 为准。不要为修一项内容顺便升级依赖。

当前应用入口是 `index.html → src/app/main.ts`。运行内容的唯一编辑源是 `content/`；不要回到旧 `new-hsk1/hsk1/*-patch.js` 链上叠补丁。旧文件仍承担固定基线、历史迁移对照、原音与本地笔顺来源职责。

| 要改什么 | 首先查看 |
|---|---|
| 教材词义、课文、语法、语音、汉字专项 | `content/textbook.json`、`src/services/content/textbook.ts`、`src/features/textbook/` |
| 选择题、排序题、自写翻译题干 | `content/stage2-bank.json`、`src/services/content/homework.ts` |
| 作业评分、完整提交、解锁、首次与最近 | `src/domain/homework/engine.js`、`src/features/homework/controller.ts` |
| 听力题和词卡义项 | `content/stage3-catalog.json`、`src/services/content/listening.ts`、`src/services/content/vocabulary.ts` |
| 词卡复习间隔、听力提交规则 | `src/domain/practice/engine.js`；对应控制器在 `src/domain/vocabulary/`、`src/domain/listening/` |
| 原音索引、片段边界、构建复制 | `content/media-references.json`、`tools/course-assets.ts`、`tools/check-course-assets.mjs` |
| 作业收据和打印 | `src/features/homework/receipt.ts`、`receipt.css` |
| 导航和新增入口 | `src/app/contracts.ts`、`labels.ts`、`main.ts`、`router.ts` |
| 保存、导入、迁移、恢复 | `src/services/storage/index.ts`、`compatibility.ts`、`src/services/learning/session.ts` |

## 修改前先分清内容指纹和学生记录身份

内容记录的 `fingerprint` 是去掉该字段后，按对象键排序的规范 JSON 的 SHA-256。辅助实现为 `tools/catalog.mjs` 导出的 `canonical` / `fingerprint`。仅导入这两个函数不会重抽取旧题库；运行 `catalog:generate` 会。

学生提交和复习记录还使用规则引擎自己的身份算法：作业见 `src/domain/homework/engine.js::fingerprint`，听力见 `src/domain/practice/engine.js::listeningFingerprint`，词卡见 `senseFingerprint`。这些不是内容 SHA-256。不能把旧成绩中的身份改成新指纹来“修复”校验。

特别注意：现有词卡身份主要绑定 `senseId` 和规范化词形，不自动绑定越语释义。改成另一个意思却保留旧 `senseId`，可能错误继承原自评。真正的题意/词义改变须先设计新身份、旧记录归档或迁移和用户提示，再发布。现有校验可能因内容变化拒绝旧存档；不得以删学生数据解决。

## 示例一 修改一道题的说明

以 `content/stage2-bank.json` 中第1课 `l01-s2-choice-01` 为例。

1. 用稳定 `id` 查找，不按数组位置猜题目。核对 `source`、题干、四个选项及 `answer`；答案索引从0开始
2. 若只是同意解释的文字修正，编辑 `explanation` 或对应 `optionFeedback`；四条反馈仍与原选项一一对应。保留题号和题意
3. 修改题干、选项、核定答案或排序表达时，先评估学生记录身份与迁移；不是“换一个 SHA”就能发布
4. 自写翻译仍为 `assessment: "manual"`，不可加入 `answer`、`answers`、`options`、教师参考译文或自动评分字段
5. 写明变更原因、来源、涉及ID和语义是否变化，留在维护变更记录中

完成经审定的编辑后，下面命令只重算该题的内容 SHA，不替你修改题意：

```sh
node --input-type=module <<'NODE'
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { fingerprint } from './tools/catalog.mjs';
const path = 'content/stage2-bank.json';
const bank = JSON.parse(fs.readFileSync(path, 'utf8'));
const question = bank.lessons.find(item => item.id === 1)?.choice
  .find(item => item.id === 'l01-s2-choice-01');
assert.ok(question, 'Question not found');
const { fingerprint: previous, ...body } = question;
question.fingerprint = fingerprint(body);
fs.writeFileSync(path, JSON.stringify(bank, null, 2) + '\n');
NODE
npm run index:generate
node --experimental-strip-types --test tests/homework.test.mjs tests/compatibility.test.mjs
npm run test:smoke -- tests/browser/homework.spec.ts
```

`index:generate` 只从新内容生成 `content/course-index.json` 摘要和源文件哈希，不修改题库。最后还须完成下文完整检查。排序题要同时验证全部允许表达与明确错误排列；不要为放行一个答案降低所有排序题规则。

## 示例二 修改一项规则

规则修改放在纯领域层，不能在视图临时改分数或绕开导入校验。例如，经明确批准要把词卡 **Chưa nhớ** 从10分钟改为15分钟，应按以下步骤处理；当前发布仍为10分钟。

1. 在 `src/domain/practice/engine.js::calculateRating` 定义新的间隔；同步检查 `readSchedule` 对 `ratedAt/dueAt` 的核验，以及导入时重算 `review.ratings` 的路径
2. 先为旧10分钟记录设计兼容办法。现有备份没有这项规则的独立版本标记，直接把两个 `10 * MINUTE` 改成15会使旧记录失效。若增加规则版本或改变 schema，同时修改 `src/domain/practice/engine.d.ts`、`src/domain/types.ts`、`src/services/storage/compatibility.ts`，保留旧值并补显式迁移，不静默重算历史
3. 更新 `src/features/vocabulary/view.ts` 的越语间隔说明及学生指南，避免界面仍说10分钟
4. 在 `tests/vocabulary.test.mjs` 覆盖新提交、到期边界、提前复习不升级、同卡不重复评级；在 `tests/compatibility.test.mjs`、`tests/fixtures.test.mjs` 和 `tests/fixtures/migration/` 保留可读的旧10分钟非空样本并补新版本样本
5. `tests/compatibility.test.mjs` 目前要求移植引擎正文与旧源完全一致。首次有意改规则时，保留原源 SHA，更新 `src/domain/provenance.json` 的改动说明，并把“全部正文相同”检查拆为冻结旧源检查与新规则行为/迁移检查。不能修改旧源来伪造相同，不能把失败测试简单跳过

定向验证：

```sh
node --experimental-strip-types --test tests/vocabulary.test.mjs tests/compatibility.test.mjs tests/storage.test.mjs tests/fixtures.test.mjs
npm run test:smoke -- tests/browser/vocabulary.spec.ts tests/browser/storage.spec.ts
```

同理，作业规则应改 `src/domain/homework/engine.js`，测试放 `tests/homework.test.mjs`。现行“完整提交即解锁”“翻译不评分”“首次不被重做覆盖”是需求契约，不得把它们当一般界面调整。

## 示例三 修改一个词的越语释义

以“不客气”当前义项 `lex-bbc044d7ea-s1` 为例：

- 词卡记录：`content/stage3-catalog.json` 的 `vocabulary`，记录ID `v-l01-lex-bbc044d7ea-s1`，越语字段为 `vi`
- 教材记录：`content/textbook.json` 第1课 `vocab`，记录ID `textbook-l01-v001`，越语字段为 `vn`；`catalogIds` 连接词卡记录

核对同一义项的来源后，修正相关页面确需一致的解释，并保留书面/口语义差别。相同汉字的不同义项不能全局替换。仅修同一含义的错字可保留 `senseId`；真正改义需新身份及迁移处理。

完成编辑后，只重算这两个记录并生成课程摘要：

```sh
node --input-type=module <<'NODE'
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { fingerprint } from './tools/catalog.mjs';
for (const [path, select] of [
  ['content/stage3-catalog.json', data => data.vocabulary.find(item => item.id === 'v-l01-lex-bbc044d7ea-s1')],
  ['content/textbook.json', data => data.lessons.find(item => item.id === 1)?.vocab.find(item => item.id === 'textbook-l01-v001')],
]) {
  const data = JSON.parse(fs.readFileSync(path, 'utf8'));
  const item = select(data);
  assert.ok(item, `Record not found: ${path}`);
  const { fingerprint: previous, ...body } = item;
  item.fingerprint = fingerprint(body);
  fs.writeFileSync(path, JSON.stringify(data, null, 2) + '\n');
}
NODE
npm run index:generate
node --experimental-strip-types --test tests/textbook-content.test.mjs tests/textbook-practice.test.mjs tests/vocabulary-content.test.mjs tests/vocabulary.test.mjs
npm run test:smoke -- tests/browser/textbook.spec.ts tests/browser/vocabulary.spec.ts
```

教材练习会从 `vn` 生成词义题，因此要复查相关题干、选项是否重复、正确答案和解释；不能只看词卡。界面显示正确、哈希正确不等于越语语言审校完成。

## 示例四 增加或修正一段词音

当前公开运行播放93条原轨的范围片段，不执行旧 `stage3/media/lesson-*.js`。`media-references.json` 中的裁片字节/SHA/旧 `mediaFile` 是来源证据；不能凭估计填数值。当前核定范围为330有音词义、14无独立词音、75听力片段，共405片段。

若修正一个**确实存在于已核定原轨中的**音段：

1. 在 `content/stage3-catalog.json` 按记录ID找到 `audio`，核对 `track`、`start`、`end` 和真实 `timingBasis`。要求 `0 <= start < end <= 原轨时长`；不能声称未做的听辨已经完成
2. 同步 `content/media-references.json::clips` 中相同ID的 `audio` 与真实来源证据。教材词音还须同步 `textbookSegments.vocab[track]` 对应词条边界；课文句音对应 `textbookSegments.text[track]`
3. 重算所有实际改变记录的内容指纹。若听力题音段改变，规则引擎的听力身份也变化，先处理旧已答记录和未结束会话
4. 若只调整指向，原MP3不变，不重新编码93条音轨

为14个缺音词补一个新录音不是填写 `audio` 的小改动：当前服务硬性校验数量、同课原词汇轨、来源和缺音清单。必须先取得可发布音频及来源许可，明确标为新增录音而非原教材录音，再扩展相关契约：

- `content/stage3-catalog.json` 的目标义项与 `content/media-references.json` 的音轨/片段记录；有了真实独立词音才从 `missingWordAudio` 与 `textbookSegments.unsupported` 移除对应项
- `src/services/content/vocabulary.ts`、`listening.ts`、`textbook.ts` 的数量、来源、轨道命名和匹配校验
- `tools/course-assets.ts` 和 `tools/check-course-assets.mjs` 的复制路径、允许的音轨类型、数量及文件哈希；当前只接受原 `new-hsk1/hsk1/audio/<课>-<轨>.mp3` 约定，不能把自录音硬塞成原轨
- `tests/vocabulary-content.test.mjs`、`tests/listening-content.test.mjs`、`tests/textbook-content.test.mjs`、`tests/browser/media.spec.ts` 和词卡音频测试的期待值与证据
- 修改前后的授权、来源、语言与耳听审查记录。自录音、TTS和教材原音使用不同来源标签，不借用旧 `timingBasis` 假装核验过

没有合规音源或契约扩展时，继续保留明确“无独立词音”提示。原轨的实际源文件在仓库根 `new-hsk1/hsk1/audio/`；生产构建复制到 `dist/course-assets/audio/`。

媒体检查命令：

```sh
node --experimental-strip-types --test tests/audio.test.mjs tests/listening-content.test.mjs tests/vocabulary-content.test.mjs tests/textbook-content.test.mjs
npm run build:release
npm run assets:check
npm run test:smoke -- tests/browser/media.spec.ts tests/browser/listening.spec.ts tests/browser/vocabulary.spec.ts
```

## 示例五 增加一个功能入口

以新建只读帮助页 `help` 为例，先在 `docs/requirements.json` / `requirements.md` 追加稳定需求编号、范围和验收，不复用既有编号。

1. 新建 `src/features/help/index.ts`，导出 `mount(host, context): MountHandle`。返回真实 `ready` 和幂等 `unmount`；异步完成前检查 `context.signal`，监听、计时器、请求在退出时清理
2. 在 `src/app/contracts.ts::FEATURES` 加入 `help`，在 `src/app/labels.ts::featureLabels` 加入对应越语标签
3. 在 `src/app/main.ts::loaders` 加入 `help: () => import('../features/help/index.ts')`；主导航由 `FEATURES` 生成，不另造一套导航
4. 普通无额外参数的入口可使用现有 `#/help?lesson=1` 形式。特殊参数或历史地址映射才修改 `src/app/router.ts`。视图用 `context.navigate` 或 `routeHref`，不得直接写 `history`
5. 静态帮助页不需要新学习存储。确需记录继续位置时，审查 `src/services/storage/compatibility.ts`、`src/services/learning/progress.ts` 与 `src/features/progress/` 对新领域的处理；不要建立第二个store或播放器
6. 补 `tests/router.test.mjs` 的解析/规范化、同路由不重复写history、返回前进；补 `tests/browser/navigation.spec.ts`、`tests/browser/scaffold.spec.ts` 的打开、刷新、慢加载、快速退出和失败重试。新旧地址同时涉及发布时，再补 `tests/browser/release.spec.ts`

```sh
npm run check
node --experimental-strip-types --test tests/router.test.mjs tests/lifecycle.test.mjs
npm run test:smoke -- tests/browser/navigation.spec.ts tests/browser/scaffold.spec.ts
```

现行入口实现和测试在 `src/app/router.ts`、`tests/router.test.mjs`、`tests/browser/navigation.spec.ts`。不要引用不存在的 `public/legacy-route-map.json`。`help.html`、历史pilot/阶段实验页不能因仓库里有文件就重新作为第二套学生入口；发布需明确映射、保留说明页或不暴露，并用严格子路径测试验证。

## 内容维护与冻结基线检查的区别

`catalog:generate` 用旧补丁链重建基线，会覆盖后续编辑过的 `content/` 和相关审查记录，日常维护不要运行。

`catalog:check` 是旧基线复现检查，不是新内容通用校验。当前 `tests/catalog.test.mjs` 也通过 `persistCorpus(project, result, true)` 核对工作内容仍等于冻结基线。因此首次有意改题或改义时，除了更新记录指纹与 `course-index.json`，还须把“冻结旧源是否可复现”和“当前新内容是否合法”分开验证。保留冻结源/历史证据，新增直接读取当前 JSON 的完整结构/指纹/数量/来源检查与本次变更记录；不能用重新抽取覆盖编辑或删除失败断言充当修复。

这项测试边界变更必须同内容修改一起审查。在边界尚未调整时，上述示例只能完成编辑和定向检查，不能据此声称 `npm test` 全绿或允许发布。冻结候选没有内容变更时，应保持原基线检查通过。

## 必跑检查与证据口径

一般候选检查：

```sh
npm run fixtures:check
npm run index:check
npm run check
npm test
npm run build:release
npm run assets:check
npm run student:check
npx playwright install chromium webkit
npm run test:smoke
```

内容仍与冻结基线相同时另跑 `npm run catalog:check`。`fixtures:generate` 仅用于有意新增/修改已审查的匿名样本，不能用它消除未知漂移。`test:repro` 针对旧页面初始化问题，不是新应用回归的替代品。

`student:check` 扫描实际产物，包含JS/CSS/HTML和source map。当前构建开启source map，源码中不得有密码、令牌、学生数据或教师参考译文。不要把维护资料、真实备份或整仓库当学生网站发布。

最终必须分别记录：

- 同一候选的单元、数据和Chromium/WebKit结果，以及准确命令/提交/报告路径
- 225作业与75听力共300任务的覆盖；两浏览器不是600道不同题
- 344义项、95排序核定表达、媒体实际事件、四宽度和故障场景的覆盖范围
- 人耳逐题听辨、语言终审、实体iPhone/Android、系统IME/软键盘、系统中文voice的真实执行情况；未执行保持未执行

## 冻结发布与回滚时的数据保护

发布使用经测试的同一构建，不能在测试后临时重建另一份再称为同产物。第9步新增的发布命令为：

```sh
npm run release:manifest
npm run test:release
```

`release:manifest` 在构建后生成 `dist/release-manifest.json`；线上同目录为 `release-manifest.json`，最终交付副本保存在 `docs/release-manifest.json`。`test:release` 使用严格的嵌套路径配置检查发布入口。先生成清单，再测试并部署同一冻结产物；测试完成后不得重新生成清单或重建产物。

正式原地址冒烟命令：

```sh
HSK_LIVE_URL=https://nhiennhientran.github.io/hsk-hub/new-hsk1/hsk1/ npm run test:release -- --project=chromium
```

保留实际受测URL、浏览器、结果和产物清单。凭据不写进命令记录、文档或截图。内容有变必须产生新的候选，重新冻结、验证后再发布，不能沿用上一候选的通过声明。最终发布证据见 [step9-acceptance.md](step9-acceptance.md)，恢复步骤见 [rollback.md](rollback.md)。

回滚须使用已保留的受测产物/清单或已确认恢复点，核对入口与资源一起恢复，再在正式原URL验证。代码回滚不等于学习记录反向迁移：旧应用不能读取新应用的 `ran_hsk1_modular_v1`。回滚前提醒保留新版JSON备份，不删除新键、原旧键或恢复副本，不承诺旧应用显示回滚前新增的学习进度。恢复新应用后再用受支持的预览/导入方式处理新版备份。

备份含学生身份与作答时应私下保存，不能加入公开仓库。损坏或冲突时先保留原数据和内存稿，避免在修复中覆盖唯一副本。详细行为以 [storage-contract.md](storage-contract.md) 为准。

## 单一公共产物流程

当前发布用 `npm run build:release`：构建后先在CI内检查完整source map的模块来源，再移除全部公共.map和sourceMappingURL，校验没有可还原口令材料，生成冻结清单。源模块路径/哈希审计留CI，不包含源码正文。两引擎均下载同一份step9-shared-release制品，只测不重建，避免RollDown调试虚拟ID不确定性。现有口令与会话语义保持，只保留WebCrypto单向校验；无WebCrypto/异常浏览器明确拒绝，不恢复可逆fallback。旧公开仓库历史并未因此变成秘密。
