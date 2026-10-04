# 打包闭环独立审查

**当前工程打包守卫通过独立审查。** 本轮四类实证问题已经由作者修复；最终工具下 27 个实际负反例全部因预期守卫拒绝，均未创建输出目录。7 个 package 单元病例也由本 agent 实际执行，全部通过，无失败、取消或跳过。

这不是正式发布批准。被检查的 v2 仍是内部 dirty checkpoint：源 HEAD `c9c515fcba394534787edcbd95968c58d8cf80d2`，dirty source snapshot `3089f02f0392fc0171c82333011334e94d4da9e487419d993327bdef4a85ad9e`。工具最终修复后的 SHA 在独立结果中另行记录，不能把 v2 的旧工具快照当成当前最终提交，更不能提前认证后续教材越文 B 阶段。

## 实际发现与修复

| 实证发现 | 修复后独立复验 |
|---|---|
| release dirty 范围漏掉 index.html、package.json、lock、Vite/TS 配置；仅修改这些文件可能仍标为 clean | dirty 与 source snapshot 共用 runtimeSourceScopes；真实临时 Git 测试逐项修改五类文件，均变 dirty；docs-only 不误标 runtime dirty |
| 删除七入口中的 PNG，并同步删除 manifest row，assembler 曾成功生成 3892 文件缺图包 | engine 150 + 七目录各 150、固定 10 个 HTML 等从独立批准注册表派生，缺少任一必需项都拒绝 |
| 删除 course-index JSON，并同步删除 output/input manifest rows，assembler 曾生成 3892 文件包 | 真实 bundle 中 new URL 的单引号、双引号、反引号静态资源依赖都验证存在；六个实际 JSON 依赖各自删除均被拒绝 |
| 把 一.json 换成非 JSON，修改两份文件清单 SHA，保留原 handwriting provenance，assembler 曾接受 | frozen provenance 对照当前真实 build proof；671 字符集合、每份 SHA/结构、两份受保护 license 都独立校验；stroke/provenance/license 各自自授权篡改均被拒绝 |

前三个删减/字形反例使用实际 restored 2da baseline 和 actual v2 frozen 包的私有硬链接副本；修改文件时替换 inode，删除时仅删除副本 link，未改原始 baseline/frozen/flow dist。曾被错误接受的反例输出已经清理；修复后的可重复反例保存在 [verify-independent-guards.mjs](verify-independent-guards.mjs)。本人没有修改作者生产/工具源码，也没有部署。

## 正向字节与路径核对

| 项目 | 独立实际结果 |
|---|---:|
| 受保护生产 Git commit / tree | 2da6a5c80c62d4ff5bdfa72a5bdb929b2b1ff3d4 / 34dc16aa1e042f5f6fc6ea6edb80b9b6926cb344 |
| 原始 Git blob 库存，全部验证 | 1446 |
| 明确不公开服务的开发文件，输出中逐项不存在 | 55 |
| 明确授权的 portal / entry / content-manifest 替换槽位 | 11 |
| 其余原有公开文件，逐项 Git blob 字节一致 | 1380 |
| assembled-v2 实际完整路径数，所有文件 SHA/字节数重算 | 3893 |
| 当前唯一 HSK1 原图 PNG | 150 |
| engine 主目录 + 七入口目录的原图副本 SHA | 1200 |
| 批准辅助 SVG SHA | 438 |
| 原 MP3 SHA / byte size | 357 |
| 实际 handwriting JSON，逐字 SHA 和结构 | 671 |
| 受保护 handwriting license 原始字节 | 2 |

不声称 1446 个原文件都仍公开服务。55 个开发文件在完整私有 baseline 中保留，但明确从公共输出排除；11 个替换是固定允许的入口/manifest 槽位；1380 个其余公开文件保持原始字节。旧 HSK1/2/3/H4 的保护按该明确范围验证，不能把入口替换说成“所有旧入口字节未变”。

七目录为根目录、new-hsk1、new-hsk1/hsk1、new-hsk2、new-hsk2/hsk2、new-hsk3、new-hsk3/hsk3。逐目录用真实 document URL 解析全部 150 个 source activity 图片，相应文件均存在且 SHA 正确；每个 HTML 的 asset-base 都解析到同一 `/hsk-hub/course-engine/`。正文 gallery、原音频和字形使用 shared engine；activity 图片使用 document-relative 路径。三个 HSK1 HTML alias 同处 new-hsk1/hsk1，共用其 150 个副本，无须再增加独立图目录。

整个 3893 文件包的独立库存 SHA 为 `6475b01b90eaab19b479ef7f8c001f6627f5cc0601fd2296d6cef18f252d348c`，与 author v2 库存一致；每个路径、字节数和 SHA 均实际读取重算，不仅采信作者总数。[independent-whole-inventory.json](independent-whole-inventory.json) 保存完整验证结论。

## 负反例及门槛

27 个实际反例覆盖：基线字节/额外文件、符号链接、伪清单授权旧 H4 覆盖、PDF/backend 插入、PNG/SVG/H1 原音频篡改、stroke/provenance/license 自授权、入口/engine 必需原图删减、HTML/主 JS/六份实际 JSON 依赖删减、字形/SVG 缺失、重复 manifest 行、错误 protected production 和伪 release。每项断言预期错误类型并检查 outputCreated=false，未把无关 setup 或环境错误计为通过。

另验证 release helper 对错误 commit、48/33 课数、579 页数、16 stage 数量或状态、缺少 WebKit 的七组错误 gate 拒绝；dirty mode=release 也在创建输出前拒绝。测试中构造的“16 passed”对象只是守卫正例，不是实际发布审批记录。

最终结果见 [independent-guards.json](independent-guards.json)，日志见 [independent-guards.log](independent-guards.log) 和 [independent-unit.log](independent-unit.log)。执行期间两份工具源码 SHA 前后相同，报告绑定实际执行版本。

## 浏览器和发布范围

作者的 v2 Chromium 9 项 package native 检查，以及 A7 的旧课双宿主结果，属于各自的实际执行报告；本轮没有重复执行或改写它们。这里独立认证工具反例、字节库存和 URL 文件解析，不把它们冒称为 WebKit/CJK 视觉全验收，也不把旧 CI head 的 860 病例移植为本包的认证。

后续 B 内容修改后必须重新构建、冻结并记录新的干净源 commit / source snapshot；最终发布仍需真实完整 16 阶段 gate、最终候选的两引擎验收和用户上线确认。当前状态仅为内部工程 checkpoint，可继续自主推进教材对标和后续工作。

