# 第2步验收记录

第2步完成统一应用入口、导航与模块生命周期。教材、作业、听力、词汇等当前是明确标注的预览入口，显示真实课程元数据；完整学习视图与保存按第3—7步接入。本步没有修改原学生目录、没有部署，也没有把历史WebKit失败标为修复。

基线：第1步提交 `7f2e012e4eeecec5ccc868ddef96b2da28c3ab21`。分支：`work/hsk1-modular-step2-20261001`。原有效内容抽取基线仍为 `71b39192133c82f684384f450dda6079d3253440`；生产恢复点仍为 `069f9d956c9a600a91e6b4ce82241ceccc184dce`。

## 已实现

| 范围 | 实际行为 |
|---|---|
| 单入口与模块边界 | 唯一 `src/app/main.ts` 启动；7个feature入口按需ESM加载，无旧全局app、动态script注入或补丁链运行 |
| 唯一路由 | `src/app/router.ts` 管理URL；`#/功能?lesson=课号`，教材带section、作业带part。相同语义不写history；后退/前进/刷新按地址恢复 |
| 旧入口映射 | 新构建的lesson.html、learning.html为同一index.html的字节一致别名；旧id/sec、mode/lesson/stage和作业hash归一化到同一路由。开发入口也可用。原生产文件未被改写 |
| 初始化与切换 | mount返回真实ready与unmount；loading时host inert且模块fieldset disabled；内容读取、监听绑定和首次渲染完成后才启用操作 |
| 旧任务隔离 | 切换同步abort/unmount；每次使用独立surface，晚import/ready及旧请求拒绝不回写新页。取消后仍观察旧Promise拒绝 |
| 错误与重试 | 请求/模块失败进入error，保留课次与教材节；重试不改地址/历史。unmount失败阻止启用下一模块，重试先清理旧句柄 |
| 会话口令 | 沿用原口令与v2 session授权，兼容6个会话别名；无hostname或旧local flag绕过。存储拒绝时有效口令仅在当前内存授权并明确提示 |
| 元数据与构建 | course-index由已冻结的新content生成，build检查新索引未过期；只发送4.87kB课程摘要，不提前加载完整题库/大媒体。直接依赖和lock版本不变 |

## 验证

| 检查 | 本地结果 | 范围 |
|---|---|---|
| catalog:check | 通过 | 第1步有效内容与140源文件/媒体指纹没有漂移 |
| npm test | 39/39通过，0跳过 | 9内容、9路由、12生命周期、9会话；正确口令由原公开静态gate独立注入，不记录明文 |
| build | 类型检查与生产构建通过 | 3份HTML字节一致、relative base、课程索引新鲜；依赖版本未变 |
| Chromium浏览器 | 10/10通过 | 旧入口、history/刷新、加载前禁操作、快速切换真实fetch abort、503重试、500同路由0写/0重挂、口令Enter/会话、15课/7入口、4视口、重复监听清理 |
| 开发运行 | 根入口及2个旧HTML别名均200且加载同一main.ts | 与生产构建采用同一router/lifecycle，不提供另一套app |

本地浏览器为临时兼容Chromium153；GitHub独立CI使用固定Playwright1.62.1的标准Chromium/WebKit，运行同10场景的两浏览器实例。远端最终状态以对应提交的CI为准，不把本地Chromium结果自动写成WebKit通过。

本地结构化记录与35个源码/配置指纹保存在 `review/step2-local-validation.json`；CI保留完整浏览器JSON报告和失败时的test-results，方便后续按提交追溯。

代码/数据检查验证真实ready、取消、cleanup调用与状态边界。当前预览模块没有播放器和成绩保存，真实音频停止/变速/听辨及真实草稿迁移分别在第5—6步、第3—4步验证；不将本轮unmount契约测试写成真实媒体验收。

## 交接

第3步实现公共保存、备份和迁移基础，先建立 `storage-contract.md` 中匿名非空样本，再处理原始记录保护、导入预览/恢复、双标签冲突和quota/denied。router继续独占地址；持久化只保存各领域状态，不能用DOM推断课次或完成情况。

不要重新抽取教材或重出300题，不重复跑已冻结旧UI全册流程。详细进入位置与终点见 `progress.md`。
