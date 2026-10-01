# HSK 1 重构工程

第1步冻结需求与源数据；第2步建立统一入口、导航、会话gate和模块生命周期。当前7个模块是明确标注的预览入口，完整练习与保存尚未接入。生产入口仍使用原目录。

## 运行

使用 Node 22.12 及以上版本；本次实测为 Node 24.19.0。所有直接依赖固定版本，间接依赖由 `package-lock.json` 锁定。

```sh
cd hsk1-app
npm ci
npm run catalog:check
npm test
npm run test:legacy
npm run build
npm run dev
```

`catalog:check` 从固定源重提取，对比已提交的 JSON、身份和文件指纹，漂移即失败。该工具用于第1步冻结旧基线和迁移对照；`catalog:generate` 只用于此阶段的显式重新抽取。后续改为新 `content/` 唯一来源和独立内容校验，日常编辑不得从旧补丁链重生成覆盖新内容。完整媒体不复制到新工程。

## 浏览器检查

```sh
npx playwright install chromium webkit
npm run test:smoke
npm run test:repro
```

`test:smoke` 在Chromium/WebKit运行10个导航/会话/生命周期场景，结果写入 `.repro-output/step2-browser.json`；使用 `-- --project=chromium` 可定向运行。`npm test` 和 `test:smoke` 从原公开静态gate注入兼容验收口令，日志不输出口令；也支持环境变量 `HSK_TEST_PASSWORD` 覆盖，不省略正确口令检查。

`test:repro` 仍针对未修改的旧页面，控制延迟 `stage3/app.js`，确认原初始化窗口；不是新外壳回归。默认输出 `.repro-output/init-race.json`，可加 `-- --browser=webkit`。兼容Chromium可通过 `HSK_BROWSER_PATH` 指定，仅应用于Chromium项目。

## 接续依据

- `docs/requirements.md` / `requirements.json`：完整需求、稳定编号、验收方法及目标步骤。
- `docs/architecture.md`：模块边界、单一路由、纯规则与服务职责。
- `review/baseline.json`：生产恢复点、工作基线和历史CI状态。
- `review/corpus-inventory.json`：源文件、加载顺序、记录指纹与媒体引用。
- `review/corpus-changes.json`：源层变化与证据边界。
- `docs/known-issues.md`：已知风险与修复阶段。
- `docs/progress.md`：短交接记录，每一步只更新当前结果和下一步。

功能位于 `src/features`，纯规则位于 `src/domain`，公共服务位于 `src/services`。唯一 `src/app/router.ts`拥有URL。每个模块 `mount` 返回 `ready` 和幂等 `unmount`，异步任务/监听使用传入signal；后续媒体/草稿资源也由该句柄退出时停止/保存。

`npm run index:generate`仅从新content生成小型课程摘要，`index:check`和build拒绝陈旧索引。开发与生产均支持lesson.html/learning.html别名，标准地址为 `#/textbook?lesson=10&section=text` 等；发布原路径映射在第9步完成。
