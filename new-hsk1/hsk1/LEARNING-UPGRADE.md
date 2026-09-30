# 新HSK 1 学习模块升级

本次升级在原15课教材页面上增加入口，保留原有词汇、课文、语法、汉字、原声和150道练习。

## 学生使用

打开 `index.html`，在新增入口选择作业、听力、跨课词汇、复习或进度。沿用原课堂口令，通过原登录界面进入。

| 每课新增 | 数量 | 学生操作 |
| --- | ---: | --- |
| ABCD选择 | 5 | 选出正确答案 |
| 词块组句 | 5 | 点击词块组成句子；可撤回、重排，也可拖动 |
| 越译中 | 5 | 看越南语，从4个中文句子中选正确译文 |
| 独立听力 | 5 | 听教材中文原声，从4个越南语选项中选正确意思 |

15课共新增300题，加上原有150题共450题。新模块单独统计300题，旧练习保留原入口和评分。

作业顺序是选择→组句→越译中。每组必须答完5题并提交，订正所有错题后才能进入下一组；全对直接解锁。没有额外的80%门槛。听力与教材内容可独立进入。每课的新20题、每组5题、正确数与首次成绩均有显示；提交后提供越南语解析。排序题接受题库中列明的合理同义语序。

听力使用仓库中与上传配套音频比对过的真人录音片段，提供0.65×、0.75×、1×、1.25×和1.5×，支持暂停、继续和重听。提交后才显示原文、拼音与解析。跨课听力可选择课次和题量。

词汇可任意组合第1–15课，搜索汉字、拼音、越文，切换中越/越中方向及拼音显示。先回忆、翻卡，再标记已记住或需要复习；词汇自评与客观题成绩分开。相同汉字的不同释义不会盲目合并。

错题与到期复习采用初始1、3、7、14天间隔，答错提前重现。这是可随时自主复习的建议节奏。重做和即时订正不覆盖首次得分。

## 进度与维护

进度存储在当前浏览器的 `ran_hsk1_learning_v2`，没有学生账户或教师云端成绩后台。可在“Tiến độ”下载JSON备份、在其他设备导入。原有阅读标记和收藏保持独立；不要将阅读自评当作考试成绩。

- `learning.html`、`learning-app.js`、`learning.css`：入口、作业、听力、复习及进度界面。
- `learning-engine.js`：评分、首次成绩、订正、解锁和备份校验。
- `learning-vocab.js`、`learning-vocab.css`：跨课词汇和间隔复习。
- `question-bank/bank-01-05.json`、`bank-06-10.json`、`bank-11-15.json`：可编辑题库，每题有稳定ID、答案、越文解析和知识点；听力记录原教材音轨与句序。
- `learning-bank.js`：生成后的浏览器题库，不应直接编辑。
- `learning-links.js`、`learning-links.css`：原主页和课次页的新模块入口。

修改题库后，在仓库根目录运行：

```sh
node tools/build-learning-bank.cjs
node tools/build-learning-bank.cjs --check
node --test tools/tests/learning-engine.test.cjs
```

构建会检查15课各组题数、300个唯一ID、四选项、答案索引、排序词块及75个音频原文/片段映射。选项会随机排序，因此解析必须直接引用内容，不能用“最后一项”“选B”等固定位置指示。

浏览器回归使用Playwright，口令仅由运行环境的 `HSK_TEST_PASSWORD` 注入，不写进测试文件。可使用 `HSK_BROWSER_PATH` 指定Chromium；未指定时使用Playwright安装的浏览器。

```sh
node tools/tests/baseline-smoke.cjs
node tools/tests/learning-browser.cjs
node tools/tests/listening-browser.cjs
node tools/tests/listening-mix-browser.cjs
```

当前站点由GitHub Pages的 `gh-pages` 分支部署。此次改动基于实际线上版本，不应直接用旧 `main` 分支覆盖。

## 验证记录

详细结果见仓库的 `tools/tests/results/` 与 `tools/tests/UPGRADE-TEST-REPORT.md`。

测试范围为真实Chromium桌面及390px手机视口；未声称在实体iPhone、Safari或所有Android浏览器上完成测试。音频全量检查包含实际播放和片段端点验证，波形比对不能替代人工听写复核。
