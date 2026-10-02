# 第9步：冻结、正式发布与维护交付

工程发布完成，人工/实体检查仍未完成，不能概括为“全部人工终验通过”。

- 唯一受测源码：`6ac4a451da89df88faffe387fac67d67f2b805a6`
- 正式生产提交：`f7d87df013d38613c11326088f27dff26532cc90`
- 构建ID：`57426872d096c495aab71155c8a40731e25e5fa3b5cfbdcacff47d067db57dee`
- 原正式地址：<https://nhiennhientran.github.io/hsk-hub/new-hsk1/hsk1/index.html>
- [冻结候选CI](https://github.com/nhiennhientran/hsk-hub/actions/runs/36968290517)；[正式原URL验证](https://github.com/nhiennhientran/hsk-hub/actions/runs/36969161845)
- [逐文件发布清单](release-manifest.json)；[机器可读证据](../review/step9-validation.json)

## 明确验收矩阵

| 范围 | 结果 | 实际证据范围 |
|---|---|---|
| 内容/媒体/规则冻结 | PASS | 225作业＋75听力＝300任务，344义项/319词形，95排序核定表达；源内容、领域引擎、依赖锁文件相对第8步未改 |
| 数据/构建/迁移 | PASS | 203单元；类型、catalog、12迁移fixture、build、93原轨/267汉字资源和单应用产物检查 |
| 完整浏览器回归 | PASS | Chromium78＋WebKit78；完整300任务/344义项、媒体、旧功能、跨模块与异常 |
| 严格生产路径终验 | PASS | 两引擎各3项；402文件大小/SHA256、正常口令、旧入口/刷新、原音、完整学习与备份恢复 |
| 正式站实际终验 | PASS | 两引擎各3项；每个线上文件与冻结清单逐字节等价，实际原URL学习/保存/恢复 |
| 恢复点/生产范围 | PASS | 新生产提交仅改课程目录；旧恢复点与备份分支保留，其他课程未改 |
| 新语言终审 | NOT RUN | 没有真实执行证据；不能由Playwright/静态字段/哈希替代 |
| 75听力逐题真人耳听 | NOT RUN | 没有真实执行证据；不能由Playwright/静态字段/哈希替代 |
| 实体iPhone/Safari与Android | NOT RUN | 没有真实执行证据；不能由Playwright/静态字段/哈希替代 |
| 真实系统中文IME/软键盘 | NOT RUN | 没有真实执行证据；不能由Playwright/静态字段/哈希替代 |
| 系统中文voice实际试听 | NOT RUN | 没有真实执行证据；不能由Playwright/静态字段/哈希替代 |
| 生产回滚演练 | NOT RUN | 没有真实执行证据；不能由Playwright/静态字段/哈希替代 |

最终两份完整报告均为78 expected、0 unexpected/skipped/flaky、retries0；新增本地生产路径和线上两份报告均为3 expected、0 unexpected/skipped/flaky、retries0。两引擎重复验证同一300任务，不是600道不同题；203单元在冻结job执行一次，不重复计算。报告分别保留 `.repro-output/step8-browser.json`（沿用主套件文件名）、`step9-release.json` 与线上 `step9-live.json`。

首轮候选a0ac617的CI36963676131完整75+75通过，新增路径/文件检查各2通过、完整旅程各1失败。失败是新脚本在词卡揭示前点击按设计禁用的播放键。e00086a仅修测试顺序，先验证禁用，再揭示、播放；没有修改应用、内容或取消断言。其后发现独立构建的RollDown source-map内部ID不确定，采用固定旧Chromium制品重测WebKit，旧制品两引擎完整通过。用户随后明确批准移除可逆口令表示及公共调试映射：现保留原一向SHA-256校验和同一口令，WebCrypto缺失/抛错/拒绝时明确关闭访问，并以新冻结产物完整重测。最终同head结果以上列CI为准，不用旧run替代。

## 截图复核

最终6ac4a451的68个独立画面（76个PNG文件，含8个重复）均已核对：30个与先前已审画面哈希相同，38个变化区域重新目检。320/390/768/1104宽度中越文可读，长收据五行与末尾原文完整；没有可见布局阻断。差异是时间、打乱选项、少量textarea绘制像素和一个正在保存的瞬态。截图不能单独证明保存完成，也不代表登录门、实体设备或真人听感验证。

## 同一受测产物发布

最终流水线只构建一次；先在构建环境内审查source map里的模块来源/教师材料边界，再删除全部公共.map与sourceMappingURL，并负向检查不存在原可逆口令/原文。两引擎下载同一个不可变step9-shared-release制品，核对全部文件后执行78＋3测试；没有各自重建，也没有测试后重建。私有构建审计仅保留模块路径/源码哈希，不保留或发布map正文。正式树从新鲜读取的gh-pages构造，只覆盖 `new-hsk1/hsk1/` 内的冻结产物与架构检查器，未合并开发分支历史，未覆盖其他课程。旧index/lesson/learning均进入唯一模块化应用；lesson9-pilot只重定向第9课，help为静态新说明。原经典脚本留作历史/来源对照，但五个HTML入口不再启动第二套旧应用。

原站QA未关闭：架构检查器识别模块化清单后正向验证发布身份、402文件hash/大小、三入口一致、93原轨与267汉字，缺清单/损坏/错误恢复点等7项正反例已测；非模块化旧分支保留原检查。全站其他QA继续执行，旧播放器合成DOM回归仅是历史源码回归，不冒称新应用运行验证。

清单本身不自我包含；它的实际文件hash、CI制品ID/digest、双引擎报告统计和生产diff检查另记机器可读证据。仓库文档归档提交可能晚于受测源码，不把文档新SHA说成重测了应用；线上清单sourceCommit保持唯一受测SHA。

## 学习数据与恢复

旧生产恢复点 `069f9d956c9a600a91e6b4ce82241ceccc184dce` 和 `backup/hsk1-pre-modular-step9-20261002` 已核实保留。回滚只恢复代码，不把新统一学习记录反向迁移成旧格式；保留新JSON备份、新容器和旧键。没有为了演示而再次回滚正在使用的生产。见[可执行回滚步骤](rollback.md)。

用户应等“已保存”后离开；未存改动可取消退出、导出后重试。beforeunload/尽力flush不能承诺系统强杀、断电或用户确认离开仍无损。自动viewport和composition覆盖不等于实体设备/系统键盘认证。

## 交付

- [学生说明（越语）](student-guide.md)
- [教师说明（越语）](teacher-guide.md)
- [维护指南及改一题/改一规则/加功能入口示例](maintenance-guide.md)
- [生产静态帮助页](https://nhiennhientran.github.io/hsk-hub/new-hsk1/hsk1/help.html)
- [回滚与数据保护](rollback.md)

新版公共产物没有可逆口令材料或source map；但未改变的旧auth-patch.js及公开Git历史仍保留历史课堂口令信息，不能宣称旧口令重新保密，也不把纯前端提示门当成私有账户认证。无WebCrypto/安全校验异常的旧浏览器不能登录；现有正常HTTPS浏览器保持同一口令和会话语义。

当前没有已知未解决的工程发布阻断；人耳、语言、实体设备和真实voice仍是明确未核验的交付限制，不能标绿。
