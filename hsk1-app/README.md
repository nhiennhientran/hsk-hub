# HSK 1 重构工程

当前预览增加每课严格30题的独立作业版本（450题：375自动+75人工），将综合练习合并进作业并保留旧版原记录。学生主导航简化为四组，内容优先，统计与设置分层展开。本轮尚未批准正式发布；功能与维护边界见 `docs/simplification-preview.md`，版本数据契约见 `docs/homework30-versioning.md`。下列旧步骤文档仍作为历史工程证据保留。

## 运行

使用 Node 22.12 及以上版本；本次实测为 Node 24.19.0。所有直接依赖固定版本，间接依赖由 `package-lock.json` 锁定。

```sh
cd hsk1-app
npm ci
npm run catalog:check
npm run fixtures:check
npm test
npm run build
npm run assets:check
npm run dev
```

`catalog:check` 从固定源重提取，对比已提交的 JSON、身份和文件指纹，漂移即失败。该工具用于第1步冻结旧基线和迁移对照；`catalog:generate` 只用于此阶段的显式重新抽取。后续改为新 `content/` 唯一来源和独立内容校验，日常编辑不得从旧补丁链重生成覆盖新内容。原媒体不重复提交到新源码；构建将93原轨和267本地笔顺复制到`dist/course-assets`，`assets:check`核对来源哈希和许可，不重新编码。

## 浏览器检查

```sh
npx playwright install chromium webkit
npm run test:smoke
npm run test:repro
```

`test:smoke` 在Chromium/WebKit各运行63个场景（原50个回归加13个词汇/复习/进度专项），结果写入 `.repro-output/step7-browser.json`；使用 `-- --project=chromium` 可定向运行。`npm test` 和 `test:smoke` 从原公开静态gate注入兼容验收口令，日志不输出口令；也支持环境变量 `HSK_TEST_PASSWORD` 覆盖，不省略正确口令检查。

`test:repro` 仍针对未修改的旧页面，控制延迟 `stage3/app.js`，确认原初始化窗口；不是新外壳回归。默认输出 `.repro-output/init-race.json`，可加 `-- --browser=webkit`。兼容Chromium可通过 `HSK_BROWSER_PATH` 指定，仅应用于Chromium项目。

`fixtures:check`核对12个固定时间、匿名非空旧格式样本；只有显式`fixtures:generate`才重生成。`test:legacy`是第1步旧纯引擎证据的复核工具，旧源码未变时不用每步重复运行。

## 数据与维护

新记录用`ran_hsk1_modular_v1`，导入/迁移必须预览并确认；当前记录及一份恢复快照同一次写入。原12个旧学习键保持不变，会话gate不进入备份。相同origin的新应用tab通过Web Locks协调写入；不支持安全锁时仅查看/下载，不用不安全读写冒充原子更新。

应用会话`src/services/learning/session.ts`持有共享存储，300ms防抖保存，切页先收集最终草稿再flush；保存失败原文仍可跨模块下载备份，视图退出不关闭学习会话。作业控制器`features/homework/controller.ts`调用纯规则，收据只取已提交快照。公共服务为`src/services/storage/index.ts`；格式适配与校验为`compatibility.ts`，純规则位于`src/domain/homework`和`practice`。已保存、未保存、冲突、损坏状态分开。失败时可下载当前内存稿，导入失败可另下载预览候选；损坏主记录提供原字符串下载。服务API、容量和兼容限制见`docs/storage-contract.md`，本步证据见`docs/step7-acceptance.md`。

## 接续依据

- `docs/requirements.md` / `requirements.json`：完整需求、稳定编号、验收方法及目标步骤。
- `docs/architecture.md`：模块边界、单一路由、纯规则与服务职责。
- `review/baseline.json`：生产恢复点、工作基线和历史CI状态。
- `review/corpus-inventory.json`：源文件、加载顺序、记录指纹与媒体引用。
- `review/corpus-changes.json`：源层变化与证据边界。
- `docs/known-issues.md`：已知风险与修复阶段。
- `docs/progress.md`：短交接记录，每一步只更新当前结果和下一步。

功能位于 `src/features`，纯规则位于 `src/domain`，公共服务位于 `src/services`。唯一 `src/app/router.ts`拥有URL。每个模块 `mount` 返回 `ready` 和幂等 `unmount`，异步任务/监听使用传入signal；媒体/草稿资源也由该句柄退出时停止/保存。公共audio由应用懒加载并唯一持有，原音/TTS明确标识；视图signal只取消自身请求。阅读访问/星标/自标完成由`services/learning/reading.ts`更新，不改作业成绩。

`npm run index:generate`仅从新content生成小型课程摘要，`index:check`和build拒绝陈旧索引。开发与生产均支持lesson.html/learning.html别名，标准地址为 `#/textbook?lesson=10&section=text` 等；发布原路径映射在第9步完成。
