# HSK2 / HSK3 第一课独立内容与交互审查

- 日期：2026-10-03 UTC
- 角色：独立审查者；不是本轮 activities / SVG 的作者，也未修改应用实现或课程 JSON
- 原始内容比较基线：`437b658`
- 本轮发现记录对应实现：`771fdf53d0dfd87e212e7e67734942c52eb171db`；工作区持续有父任务修改，下面的开放问题须在修复后重测
- 结论：**源内容/答案与原字段保留核验通过；交互发布验收未通过，存在 2 项 high、4 项 medium、1 项 low 待修复。没有浏览器验收结论。**

## 一、独立证据与方法

没有把作者报告、旧 `reviewStatus` 或作者结构验证结果当作独立证据。先自行用 MuPDF 从提供的 PDF 重新渲染页面，再逐页查看像素，与课程 JSON 的中文原题、选项、答案、目标、任务和图题对应核对。

实际查看的原页：

- HSK2 教材 PDF16–24，纸1–9，第一课全部9页
- HSK3 教材 PDF13–21，纸1–9，第一课全部9页
- 两册客观题答案 PDF1–2，仅认证其中第一课，不认证同页第二课
- HSK2 附录 PDF156–161（纸141–146）：星号定义与15个第一课词条所在位置
- HSK3 附录 PDF186–194（纸174–182）：星号定义与27个第一课词条所在位置
- 26个自制SVG均从当前文件独立重渲染、查看像素，而非只检查文件存在；画面缺陷见 F4

重新渲染的PDF/SVG图像位于本地审查临时目录，没有复制到站点或发布包。原PDF和本次渲染PNG的SHA-256、原字段比较结果、官方答案断言、图文件hash见 `2026-10-03-pilot-independent-evidence.json`。

独立最小DOM构造测试覆盖分部与课文1–4，检验实际 mountLesson 产出的活动/图ID；它**不是**浏览器，不验证CSS、滚动、focus、读屏或媒体事件。结果见 `2026-10-03-pilot-independent-dom-check.json`。

## 二、已实际通过的内容项

### 1. 原字段与独立作业保留

对全部33课的JSON逐级比较基线所有旧键/值（仅排除审查状态 `reviewStatus` 的作者身份更新），没有发现旧教材正文、拼音、越南语、题干、选项、语法、音轨ID、来源或作业被改写/删除。新增字段为加法。

每课仍严格30道独立作业：词汇语法10、排序5、听力5、选译5、手写5；全部33课均检查。25道自动题与5道人工题分开；手写题无 answer、solution、modelAnswer、explanation、options、tokens。原教材活动没有取代作业。

这项精确比较证明未损坏基线；不把基线其余31课内容自动认证为本轮独立逐页语义正确。

### 2. 活动、字段与题目绑定

- HSK2：26活动、50字段，19 official / 23 reference / 8 open
- HSK3：25活动、61字段，24 official / 30 reference / 7 open
- 合计51活动、111字段，43 official / 53 reference / 15 open
- 36道旧课文题，每题恰有一个字段 targetRef 指向原问题ID
- 两课18条语法练习的20个空、15道综合选词、7组图题15空均有对应输入
- HSK2四目标与HSK3三目标均保留，并有独立自评checkbox
- HSK2旅行调查3项、HSK3热身2场景、HSK2角色扮演及原书例子、HSK3双人任务2场景均保留
- HSK2“小语助力”和文化栏目仍有数据/UI路径；文化视频明确缺失，没有拿MP3课文1-1替代
- DOM构造检查中51活动各出现恰好一次；全部26图ID有呈现路径，未发现被条件漏掉；存在同图多次呈现见F3

原文教学指令仍有遗漏，见F7，故不声称教材任务已经百分之百复现。

### 3. 官方键独立核对

按教材选项文本与答案册字母建立独立断言，43个键全部匹配。每个 official 字段均有对应答案册名、PDF页、题号；53个 reference 字段不带官方 answerSource，不按字符串自动判错；15个 open 字段没有唯一答案。

- HSK2暖身：D/A/B/C；课文1：B/C；课文2：A/A；课文3：A/C；课文4听后：F/F；课文4读后：C/B；综合选词：E/C/B/D/A
- HSK3暖身：C/A/F/D/B/E；课文1：B/C；课文2：A/B；课文3：A/C；课文4：B/B；综合选词：E/B/C/D/A/B/A/D/E/C

HSK2课文4读后第2题确实在答案PDF2，其余第一课课文题答案在PDF1，没有混同教材页与答案页。

参考表达已结合原文/语法/图题看过，未发现将合理变式标错的自动评分；它们是编辑示例，不是官方唯一解。此审查不等同于母语教师认证全部越南语风格。

### 4. 附录星号、词条与自制图

42个词条的 appendixSource 页码与实际附录位置相符。HSK2“接”在PDF158/纸143标星；HSK3“服务台”在PDF188/纸176标星。两册附录定义均为“本级超纲词”；词汇保留且有拓展词解释。未把未星标词当作删词依据。

26图的manifest资源hash与文件一致，全部SVG无嵌入image、script、foreignObject；独立像素检查中数字图号与原题顺序一致，匹配图没有直接写出答案词或ABC字母。HSK2时钟7:00是原题已给条件，不属新增泄答。HSK3第三图保留四人相对位置/衣着、红箱关系，没有把“小文”指派为唯一人物。

24图未见任务关系错误；另2图的屏幕内容与原题/alt不符，见F4。所有辅助图都不应被称为教材原图或版权授权。

## 三、开放问题（须修复后复核）

### F1 — High：异步旧课程结果写入新课程缓存

- `course-app/src/main.ts:469–476`
- `render()` 在 await loadLesson 后先 `loaded.push(...lessons)`，再检验 generation。
- 跨级导航会清空 loaded，但旧级别promise可能随后向新级别loaded写入；只按number查找，会取到另一等级的同课号并污染展示/状态键。
- 修复要求：在任何共享缓存修改前检验渲染代次及课程身份；或按课程ID隔离缓存。需要延迟加载+快速跨级浏览器回归。
- 证据级别：直接代码路径推演，未以真实浏览器复现。

### F2 — High：保存失败后听力显示题与活动round不一致

- `course-app/src/listening-view.ts:112–128,207–211`
- 新一组先替换round并写入内存，只在flush成功时draw。失败时旧题DOM仍在、事件闭包仍持旧id，却修改新的round。
- 最小DOM复现：旧题listen01仍显示，内存round第一题变为listen03。若新组选课排除旧题，旧DOM作答还会产生queue之外id并触发validateState拒绝。
- 修复要求：切组时保持内存/DOM原子一致，失败显示可恢复草稿状态，或先确认保存再发布新组；旧事件不能操作新组。

### F3 — Medium：一组多空重复插同一图

- `course-app/src/lesson-view.ts:111–118`
- 每个field都渲染illustrationId，未按组去重。
- DOM实测：HSK2 comprehensive-2/4各2次；HSK3 comprehensive-1/2/3各3次。
- 修复要求：同activity共享同图只渲染一次，保留图号/字段关系。

### F4 — Medium：两张“看人物照片”辅助图实际画风景

- `course-app/public/illustrations/hsk3-l01-viewing-phone.svg`
- `course-app/public/illustrations/hsk3-l01-sofa-phone.svg`
- PDF21看图对话问“照片上的这个人是你男朋友吗”；PDF14课文看李文/白家月照片。两个SVG屏幕均为山和太阳，manifest却称人物/合影。
- 修复要求：改为人物头像/合影轮廓，更新hash，独立重新看像素；不能只修改alt解释风景。

### F5 — Medium：听力重复提交累计两次历史

- `course-app/src/listening-view.ts:217–239`
- 等待flush时按钮未同步禁用，也没有检查round.submitted[id]。双击或保存失败后重复点击会二次recordAttempt。
- 最小DOM复现：同一题两次点击得到history.submissions=2。
- 修复要求：同步置pending/disabled或对已提交id拒绝重复请求，同时保持失败草稿可重试保存。

### F6 — Low：小数scene造成课文分部失败

- `course-app/src/router.ts:70`、`course-app/src/lesson-view.ts`课文分部scene查找
- `scene=1.5`通过范围检查，但不存在text.number=1.5。
- 修复要求：Number.isInteger(scene)，并在渲染时有安全回退。

### F7 — Medium：原书朗读/听两遍指令未呈现

- `course-app/src/lesson-view.ts:85–90`与两课 `activities[*-listening/*-reading]`
- 8组听后活动虽存recommendedPlays=2，UI未使用；原教材均写听两遍。
- 两级课文1–3读后原题要求“分角色朗读对话，读后回答问题”，当前只有“读后练习”标题；课文4原题要求“朗读课文”。
- 修复要求：显示双语任务指令。可建议两遍而不硬锁播放；阅读模式可自由看原文，不要求把整本教材伪装成封闭测验。

## 四、状态、快照与单应用代码检查

已检查 `lesson-view.ts`、`listening-view.ts`、`state.ts`、`hsk1-bridge.ts`、`router.ts`以及保存/路由/回执所必需的main.ts调用链。

- 作业grade使用structuredClone冻结questions/answers/profile；first与latest独立克隆；contentRevision能标记内容变化
- 作业回执只从attempt.questions显示题目；没有快照的旧回执显示原始作答值及明确说明，没有套用新题选项伪造历史
- HSK2/3存储身份、草稿、活动、词收藏与听力组按courseId隔离；恢复历史不会自动重评分
- 顶级导航有flush失败阻止离开、beforeunload未存提示、save失败内存草稿保留；不能因此掩盖F1/F2异步路径
- HSK1通过真实模块动态import及共享audio桥接，没有在course-app源代码中发现iframe嵌套
- 最小DOM/单元测试支持构造与状态结论；跨级实际浏览器生命周期、输入法、真实存储失败、音频切换仍需独立浏览器验收
- 听力提交后question使用冻结快照，但原文段落查当前lesson.texts。当前用户要求的作业回执未受污染；若以后要求“整段历史听力材料”冻结，还需要将原文也纳入snapshot

## 五、执行验证与明确未测

- `npm test`（course-app）：35/35通过
- `npm run check`（course-app）：通过
- 独立脚本：33课旧字段/30作业约束、43官方键、参考/开放分类、36绑定、26资产hash均通过
- 独立最小DOM：51活动恰一次可达、26图ID可达；重复图/失败提交问题实测如上

未测，不标pass：真实Chromium页面/手机截图、CSS溢出、读屏、焦点/键盘、中文IME、刷新/前进后退、网络失败、真实音频听辨、全册非首课语义。已知本地浏览器环境限制，本审查没有另开路径绕过它。

旧 `tests/browser/pilot.spec.ts`仍含一次显示4篇 `.text-section`、旧word-card等断言；不能直接作为新分部UI验收。父任务说明将使用针对新UI的unified测试及后续真实CI，结果尚未由本审查核验。

## 六、复核记录

当前无修复后验收记录。F1–F7按上述版本保持open，父任务改动后须另加日期/commit/证据，不能将本报告改写成原版本全通过。
