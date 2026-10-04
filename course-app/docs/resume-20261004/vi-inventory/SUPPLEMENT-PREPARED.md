# B 试点准备：覆盖与当前来源边界

状态为 `coverage-prepared / pending-new-engineering-source-checkpoint`。没有开始正式教材逐课审校，没有修改生产译文，也没有启动 active 官方修订。

8dff803c 源快照已从原 43073 字段扩展为 46463：三份保留旧版题库 2978 处 VI，438 approved SVG 中 412 个 VI desc；全部题目原字段、元数据、选项及原 answer index 独立列入。旧图元 10 份及 icon 4 份单列，两个 Guònián hǎo 节点是拼音，不算越南语。SVG desc 是资产内部 metadata，不等于已验证正文显示或辅助技术读出。

| 复核维度 | 准备结果 |
|---|---|
| 原词义身份 | H1 344 + H2 226 + H3 523 = 1093 |
| 活动身份 | H2/3 918；H1 当前 activity ID@version 484 |
| 保留旧题身份 | H1/H2/H3 360/360/640，原始叶字段共 15630 |
| 字段身份 | 46463 行 recordId、semanticKey 均无重复 |
| 原判断题 | 186 个 Đúng/Sai 选项及答案叶全部捕获；初版遗漏的 89 个大写 Sai 失败记录保留 |
| 动态模板 | 498 producer，具体动态值和分支仍需 affected-consumer 原生测试 |
| 三课试点输入 | H1 L4 752 字段/317 owner；H2 L2 458/191；H3 L10 588/239；共 1798 字段/747 命名空间 owner 群组 |

以上是不同维度，不能相加成教材语言完成率。同译文、同汉字、同课号都不能证明语义 ID 相同。旧 H3 的 20 课与新 18 课不按课号覆盖。H4 专用候选明确 editorial/unmapped；本次没有其官方教材。

旧版实际加载路径已核：`hsk1/app-practice.js` 的 4 块，`assets/lesson-practice.js` 的 5 块，`hsk3/app-practice.js` 的 9 块。`legacy-practice-banks.json` 保存逐源及解码 SHA，`legacy-practice-consumers.json` 保存全部原叶和控件 index。原始题库外壳的 QA/design/source metadata 与实际题目、反馈显示分别标记；没有把未 fetch 的历史替代分块当新增内容。

工程试点须先解决 `supplement-consumer-coverage.json` 的 9 项真实约束：H1 原 bank/mixed 指纹、一级旧／新提交显示版本绑定、随机选项原 index、H2/3 旧听力无快照回退、source 活动版本、canonical 与 lesson-local 复用、SVG SHA、旧题字符串评分及动态 editorial 文案。它们均对应真实文件和当前消费者，沿用已冻结的最小修订设计，未实施无关功能。

档案边界也已明确：H1 练习档案继续用原 authority task 解读原 answer index；H1 source 档案保存完整旧 context 并实际显示其中 VI，但不渲染历史图片。H2/3 旧活动仅保留 values/checkedAt；其显示标题是当前教材的定位标签，页面已说明没有原题快照。任意用户输入／导入历史文本保留原样，不归类成当前教材源项，也不由 active VI 修订替换。

生成时 837 输入及 18 项检查通过。其后 `course-app/tools/package-unified.mjs` 改动：8dff 源 SHA `acd9c9b664104bd9311dc624c1769d3a0f8c05546cc831aa2e270bddc6983a34`，观察工作 SHA `efc2e61e946eb6a53ab2a59e099b0dc349079ea9c4ab4c237fe09da99334976b`。这是工程负责人新增音频／字形输入守卫的独立任务，本目录不覆盖它。当前 836 其他输入保持原字节；prepared 校验日志不代表 drift 后的整树通过。

最终顺序：工程负责人完成守卫独立验收并保存新 checkpoint → 按新 HEAD 重跑 builder、18 checks、consumer/input 核查 → 锁定脚本、源、输出及独立 review SHA → 才进入三课教材原页试点。教材原 VI、精确页码、判断、独立复核及所有 proposed changes 仍为 pending。
