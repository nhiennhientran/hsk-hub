# HSK 1 重构工程

第1步冻结需求与源数据，建立可检查、可构建的工程。当前页面是工程检查页，尚未接入学生功能。生产入口仍使用原目录。

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
npx playwright install chromium
npm run test:smoke
npm run test:repro
```

`test:smoke` 检查构建产物的启动、最低320px视口和脚本错误。`test:repro` 针对未修改的旧页面，控制延迟 `stage3/app.js`，确认初始化前的点击可能丢失；复现成功表示风险存在，不表示修复完成。默认输出 `.repro-output/init-race.json`。可加 `-- --browser=webkit`；两项命令都可使用 `HSK_BROWSER_PATH` 指定兼容的 Chromium。

## 接续依据

- `docs/requirements.md` / `requirements.json`：完整需求、稳定编号、验收方法及目标步骤。
- `docs/architecture.md`：模块边界、单一路由、纯规则与服务职责。
- `review/baseline.json`：生产恢复点、工作基线和历史CI状态。
- `review/corpus-inventory.json`：源文件、加载顺序、记录指纹与媒体引用。
- `review/corpus-changes.json`：源层变化与证据边界。
- `docs/known-issues.md`：已知风险与修复阶段。
- `docs/progress.md`：短交接记录，每一步只更新当前结果和下一步。

后续功能位于 `src/features`，纯规则位于 `src/domain`，存储、媒体、内容和认证服务位于 `src/services`。第2步再建立唯一 `src/app/router.ts` 与模块生命周期，避免第1步提前增加未验收功能。
