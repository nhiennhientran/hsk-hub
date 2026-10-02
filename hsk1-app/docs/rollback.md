# HSK1 当前生产恢复与回滚

## 最新恢复点

本轮先保留恢复点，再将已获用户确认的同一份受测产物发布：

- 当前生产提交：`f7127ccd656f9ce49ebb05673625ecd991e26403`
- 本轮回滚目标：`f7d87df013d38613c11326088f27dff26532cc90`
- 已核验恢复分支：[`backup/hsk1-pre-legacy-restoration-20261002`](https://github.com/nhiennhientran/hsk-hub/tree/backup/hsk1-pre-legacy-restoration-20261002)
- 原正式地址：<https://nhiennhientran.github.io/hsk-hub/new-hsk1/hsk1/index.html>
- 产物、SHA256、发布与线上验收：[legacy-restoration-production.md](legacy-restoration-production.md)、[release-manifest.json](release-manifest.json)

更早的 `069f9d956c9a600a91e6b4ce82241ceccc184dce` 是第9步之前的旧架构基线，不是本轮首选回滚目标；历史记录见 [step9-acceptance.md](step9-acceptance.md)。不要混用两个恢复点。

## 回滚前

1. 回滚也是生产修改；仅在用户确认需要回滚后执行。重新读取当前 `gh-pages`，检查是否有本次发布后的变更。若有他人修订，先评估冲突，不能强制覆盖。
2. 提醒使用者等待已保存，导出完整新版JSON备份，并保留原文件。不要清除浏览器数据、旧存储键、恢复副本或 `ran_hsk1_modular_v1`。
3. **恢复代码不等于反向迁移学习记录。** 新增练习记录/搜索范围等字段不保证可由较早版本完整读取。保留新备份和新容器；回滚不承诺旧界面呈现新版本产生的所有作答。
4. 保存本次生产提交和当前冻结产物。只恢复课程目录，不改门户、其他HSK课程或站点配置。

## 最小、非强制的代码恢复

以下命令仅供获批后的维护操作，要求工作目录干净。它产生新的恢复提交，不改写生产历史：

```sh
git fetch origin
git switch -c rollback/hsk1-legacy-restoration origin/gh-pages
git restore --source=f7d87df013d38613c11326088f27dff26532cc90 --staged --worktree -- new-hsk1/hsk1
git diff --cached --stat
git diff --cached --name-only
# 确认全部变更都只在 new-hsk1/hsk1/；再核对生产头未发生并发变化
git commit -m "Restore previous verified HSK1 artifact without changing other courses"
git push origin HEAD:gh-pages
```

`git restore`一起恢复受Git跟踪的入口、依赖资源、清单和检查器，并移除目标恢复点没有的生成文件。不要只换index留下混合版本。非fast-forward时停止并重新核对，不使用 `--force`。

## 恢复后的验证

- 等待GitHub Pages对恢复提交部署成功；源码提交成功不等于线上已切换
- 使用恢复目标的清单逐文件比较线上大小/SHA256，确认index/lesson/learning/help与依赖属于同一版本
- 在全新、隔离浏览器环境用正常课堂口令检查实际拥有的功能、旧入口/刷新/历史、教材和原音、学习保存与备份恢复；不要把本轮新增练习作为较早版本必备功能
- 保留所有真实学习键和备份，不为演示恢复而删除用户数据；用相容版本处理新版备份
- 若验证失败，记录URL、生产提交与具体失败，停止盲目再次发布并修复原因

## 验证边界

恢复分支、生产头保护、范围差异、同一产物发布及实际线上字节/功能已核验；没有为演示而回滚正式站，生产回滚演练为NOT RUN。人耳、语言、实体设备、系统IME和真实TTS检查仍是独立的未执行项目，详见验收记录。
