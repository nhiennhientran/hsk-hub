# 第9步生产恢复与回滚

## 恢复点

发布前重新读取 `gh-pages`，确认旧生产仍为 `069f9d956c9a600a91e6b4ce82241ceccc184dce`（tree `2fee2746df92e9e8773b36f1669907895a316ad0`）。另保留分支 [`backup/hsk1-pre-modular-step9-20261002`](https://github.com/nhiennhientran/hsk-hub/tree/backup/hsk1-pre-modular-step9-20261002)。正式地址不变：<https://nhiennhientran.github.io/hsk-hub/new-hsk1/hsk1/index.html>。

最终受测源码、生产提交、构建ID、文件哈希、CI和下载制品记录由 `release-manifest.json` / `step9-acceptance.md` / `../review/step9-validation.json` 给出。冻结目录中的 `release-manifest.json` 对清单内每个文件记录大小和SHA256，buildId为排序文件记录数组的SHA256；不自我包含。不可测试后重新构建再以同一ID发布。

## 回滚前

1. 先让使用者等待“已保存”，导出新版本完整JSON备份，并保留原文件。不要清除浏览器数据、旧存储键或 `ran_hsk1_modular_v1`。
2. **恢复代码不等于反向迁移学习记录**。旧版不能读取新的统一存储容器；回滚后不承诺新版本作答会出现在旧界面。保留新备份和新键，待再次运行相容模块化版本时恢复。旧键保留的是旧状态，不是新进度的同步副本。
3. 核对当前生产head和这次实际发布提交。若他人在目标目录继续修改，先评估冲突，不能强制重写生产历史或覆盖别人的后续修订。

## 可执行的最小回滚

下面由有仓库写权限的维护者在确认回滚后执行。工作目录必须干净；先拉取最新生产。仅恢复这一课程子目录，保留站点其他课程和配置。命令不会改写历史。

```sh
git fetch origin
git switch -c rollback/hsk1-modular-release origin/gh-pages
git restore --source=069f9d956c9a600a91e6b4ce82241ceccc184dce --staged --worktree -- new-hsk1/hsk1
git diff --cached --stat
git diff --cached --name-only
# 确认所有改动都在 new-hsk1/hsk1/，再提交
git commit -m "Restore pre-modular HSK1 course without changing other courses"
git push origin HEAD:gh-pages
```

`git restore`同时恢复原入口/原资源和原检查器，并移除受Git跟踪而原版本没有的该目录产物。不要只替换index而留下新入口/资源混搭。若非fast-forward，停止并重新核对生产变更；不使用 `--force`。

## 恢复后的验证

- 等待 GitHub Pages build/deployment 对本次回滚提交成功；源码push成功不等于线上恢复完成
- 无痕新环境打开原正式地址，正常口令进入，逐一查旧版实际拥有的首页、L10教材五节、生词/课文原音与旧基础练习；旧lesson链接和刷新仍要查。先依据恢复点文件确认旧learning入口实际能力，不用新模块化作业收据、独立听力或混课词卡作为旧版必备验收项
- 读取线上index/lesson/learning及关键JS，对比恢复点原文件SHA256；不得仅凭页面标题或缓存截图判断
- 新统一学习键仍应保留；不要为显示“正确旧状态”删除新数据；备份导入必须由相容版本执行
- 若恢复验证失败，保留错误、时间、URL、生产提交，停止再次盲目发布并修复具体问题

## 验证边界

本轮保留恢复点，并对新发布的完整清单/篡改拒绝及正式链接进行验证；不为演示回滚而再次改变正在使用的正式站点。实际生产回滚演练未执行。实体手机/系统输入法、中文系统voice试听、逐题真人耳听和新语言终审与代码回滚均是不同事项，不能由自动化冒充通过。
