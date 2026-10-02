# 第8步：跨模块、异常、布局与结构清理

基线为第7步 `190802508f677a587e5c0ea983429a0bae1357b0`；分支 `work/hsk1-modular-step8-20261002`。内容基线仍为 `71b39192133c82f684384f450dda6079d3253440`，生产恢复点仍为 `069f9d956c9a600a91e6b4ce82241ceccc184dce`。本步不合并、不部署，也不替代第9步冻结和正式网址终验。

## 系统回归范围

- 第10课翻译草稿→独立听力→第7+10课混课词卡→返回翻译提交→刷新→真实JSON下载→新浏览器环境导入。逐领域核对阅读、作业首次/最近/未提交草稿、听力首次/最近、词卡队列/自评/日程及旧raw字符串；翻译始终manual/null评分。
- 慢加载、加载时退出/快速换课、跨模块反复进入、过期响应、500次同一路由无重复history；当前模块只有真实ready后可操作。
- 禁止读取与禁止写入存储、容量错误、损坏JSON/错误应用/错误schema、未知ID/内容指纹/伪造分数、过期导入、双标签并发写入。失败不会假报保存；内存稿可导出，支持明确重试/读回/恢复操作。
- 320/390/768/1104四宽度检查翻译输入、中文/越语长文、换行和完整长文收据，保留截图；键盘、模拟composition及paste输入单独记录。
- 原lesson.html/learning.html入口参数、旧课次链接、前进/后退/刷新仍由唯一router处理。

对应新测试：`tests/browser/integration.spec.ts`、`resilience.spec.ts`；原全册225作业、75听力实际媒体、344词卡、95排序表达、存储/生命周期及第7步WebKit音频回归继续执行，不减项、不增加重试。

## 清理清单和兼容边界

| 清理 | 结果 |
|---|---|
| `src/features/entry.ts` | 删除73行临时通用预览工厂，包括死教材/作业分支、预览按钮与计数状态；首页直接拥有15课入口与真实进度 |
| `AudioService.stopExternal` | 删除旧播放器适配参数及全页面audio/video DOM扫停；候选只使用应用级唯一AudioService |
| 教材速度、作业解锁/字数规则副本 | 教材直接读AUDIO_RATES；作业菜单可用性与输入长度直接复用既有引擎规则，不新增评分逻辑 |
| 旧双app/动态script/全局覆盖与重复播放器 | 候选runtime与dist无引用；没有把旧patch链或两套学生app带入构建 |
| 旧生产目录/规则来源/迁移样本 | 保留：第9步前原生产不变；纯规则来源与旧键迁移对照不是候选的第二套运行实现 |
| 汉字生命周期适配 | 保留ManagedHanziWriter：管理第三方监听、quiz/render和renderer销毁，不是旧学生界面覆盖代码 |

`npm run student:check`在构建后独立检查：三个HTML入口别名逐字节相同且只有一个module启动脚本；遍历全部JS/CSS/HTML及source-map来源，拒绝旧runtime/预览/桥接和教师答案源进入学生产物。不会仅因浏览器某条路径没发出旧请求就认定整个dist干净。

## 依赖与生命周期复核

- `src/domain`不读DOM、localStorage、媒体或计时器；控制器通过明确session接口改本领域，评分/复习仍使用冻结纯引擎。类型层对内容/路由的引用不会加载界面。
- services没有feature视图依赖；对app的少量依赖是路由类型、纯规范化函数、常量/标签。没有事件总线、插件系统、全局巨型store或新框架。
- app持有一个懒加载learning session和一个AudioService；router独占URL写入，dispose移除监听。lifecycle先abort旧signal、移除旧surface、unmount，所有晚加载/失败不能覆盖新模块。
- 视图订阅在退出时解除；到期刷新timer/visibility监听归所属视图；下载object URL和timer归所属数据/作业视图；汉字笔顺请求/动画/指针监听有退出清理；音频代次、播放Promise及片段边界继续保留回归。
- 存储以Web Lock和原raw比较保护合作标签，拒绝旧稿覆盖新值；冲突稿仍可下载。未支持锁的浏览器不会伪装安全写入。

## 证据和当前状态

受测代码：`8effedf11ad04c3c3d19011ae80d1dd2f5a41318`。[完整CI 36961126745](https://github.com/nhiennhientran/hsk-hub/actions/runs/36961126745)两个独立job均通过：200单元、类型/build/catalog、12个迁移fixture、93原轨/267汉字资源及student:check。Chromium75/75、WebKit75/75；两份实际下载JSON均为expected75、unexpected0、skipped0、flaky0，retries0。40张本步四宽度截图已生成并从制品读取；截图目检结论单独核对，不能由测试状态替代。

此处记录代码候选的已验证证据；本步文档归档提交若有不同SHA，不将上述旧CI说成测试了新SHA。后续同head CI另行核对；源码、测试、工作流与构建输入不因文档归档改变。制品SHA256、清理清单和未执行项见`review/step8-validation.json`。

本地浏览器已有socket权限限制；本步一次聚焦启动还遇到固定Chromium binary缺失，未进入页面后停止，没有绕过权限或把启动失败算功能通过。CI制品包含 `.repro-output/step8-browser.json` 与截图；每个最终job的pass/fail/skipped/flaky和截图检查在完成回复及本步验证记录核对，不继承第7步结果。

## 首轮CI发现与修复

首轮 `b5b4902201f797462d3fae7b1f3f5b8855056a63` 的[CI 36957734726](https://github.com/nhiennhientran/hsk-hub/actions/runs/36957734726)两引擎各71通过/2失败/0跳过/0flaky，191单元和全部构建检查通过。完整L10跨模块恢复和全部四宽度长文场景通过，原音、全册题卡及旧回归未失败。

1. 新即时刷新测试真实复现：输入后300ms合并保存尚未完成，pagehide中的异步Web Lock写入不能保证在浏览器关闭执行环境前完成，最后选择丢失。修复用瞬态hasUnsavedChanges区分本地脏稿与单纯外部冲突；保存确认成功/明确读回才清脏标记。beforeunload在有未存稿时启动正常flush并触发浏览器离开确认；取消后保留内存稿/导出，锁释放并保存后可正常刷新。作业把当前DOM草稿采集注册给session；唯一退出监听先同步采集中文组合尾字，再判断脏稿。没有新增持久化键/格式、绕过Web Lock或每按键同步写盘，300ms合并保存保持。新增真实浏览器持锁→刷新确认→取消→导出→保存→刷新及未上报composition尾字回归。
2. 键盘场景错误假定默认听力不随机，实际默认shuffle为true。测试现在用键盘明确关闭随机后核对固定首题；不改应用默认或移除键盘验证。

第二轮修复提交`1b2e87fb83fcdfa0e9f1cde682b45bdc59e95383`的[CI 36959039464](https://github.com/nhiennhientran/hsk-hub/actions/runs/36959039464)为WebKit74/74通过、Chromium71通过/3个新退出确认测试超时，195单元通过。Chromium的测试现在显式真实点击以满足原生离开确认所需用户激活，并由页面发起刷新、独立处理取消提示，避免测试驱动等待已经取消的navigation完成；没有削弱脏稿、DOM尾字或锁占用断言。独立复核还发现未触碰的空翻译页会在退出采集时生成空字符串稿，现仅把“缺值→空字符串”视为无操作，删除已输入文字仍保存；新增无多余离开提示回归。

后续Chromium原生beforeunload确认与WebKit具有监听顺序差异：不能依赖capture标志保证后注册的作业采集先于session检查。`8a1eef4`的Chrome74/75、WebKit74/75中，前者仅DOM尾字退出失败，后者仅textarea即时scrollTop断言过早。当前已改成session唯一退出监听显式先调用当前视图的草稿采集再检查脏稿/无效输入；视图退出撤销注册，旧清理不能移除新视图。保留真实原生退出回归而非模拟事件替代；textarea检查等待实际滚动状态，不改布局/增重试。

离开保护不是同步保存承诺：用户明确选择离开可能丢失尚未保存的更改；beforeunload依赖浏览器及用户交互，并非所有移动系统杀进程/断电都会触发。visibility/pagehide flush仍为尽力保存。保存状态未确认时应继续停留或下载备份；本步不宣称对强制结束进程具备持久化保证。

## 未执行和第9步边界

实体iPhone/Safari、Android、系统中文IME/软键盘、系统中文voice试听、逐题真人耳听及新语言终审没有可用真实执行证据，保持未执行。Playwright WebKit不等于实体Safari，viewport/composition/paste模拟不等于物理手机与系统输入法测试。93原轨哈希、75题native播放和字段校验也不能替代人耳与语言审校。

第9步再冻结发布候选和dist哈希、按授权发布同一构建、在正式原网址冒烟、提供维护/回滚交付。本步没有调用合并或部署，也没有更换原生产入口。
