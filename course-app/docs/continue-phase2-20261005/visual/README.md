# 第二段当前 compiled 候选：有限版面回归

本目录只增加测试与审查材料，不改运行时，也不激活官方越南语。作者起始工程提交为 `a18a8cae149f3e63079b6d2b6b5b9f4ab630267d`，原生 CI 应绑定 root 最终提交及实际构建向量。旧 `1874` B14 图不用于本候选验收。

| 范围 | 原生 case 数 | 每 case 原始 PNG | 计划 PNG 数 |
| --- | ---: | --- | ---: |
| HSK1 当前共享 compiled 包、standalone compiled 两宿主；320、390、768、1280、1440；Chromium、WebKit | 20 | 第1课显示对话完整页、隐藏对话完整页、第6课原页活动表格组件 | 60 |
| DRAFT 包 HSK2、HSK3；320、1440；Chromium、WebKit | 8 | 最后一课当前文本完整页、5题手写提交并重载后的完整页及记录 | 16 |
| 合计 | 28 | 全页或原组件截图，未改像素或缩放 | 76 |

HSK1 原生断言保留 B14 的双语顶层导航完整字形边界、隐藏对话角色与听句按钮间隔、原表格字段/空单元/表头对应及六个原生 select 选项文本、字体宽度和容器几何。六个 select 没有单独闭合控件 PNG；字体宽度和几何结果不能当作六控件绘制字形均已人工认证。表格在原横向滚动区域内截图，仅保留左端视口；不把被视口挡住的列误称控件内部裁切。第12—15课的24个印刷拼音字段、全部17个来源字体卡片未在这个有限新增回归中重复截图。

HSK2/3 的测试实际使用包内嵌套入口，检查级别链接、跨2/3级导航、第一课与最后一课自由切换、所有课号选项可用、当前正文按钮、5个手写控件、实际保存及重载后的 manual 记录，断言 total=5 且没有 correct 自动分数。两宿主并非两个域名：共享宿主使用统一 compiled 包；standalone 使用当前 compiled HSK1，绝不使用 Vite dev 集成夹具。

默认构建产物来自 `.repro-output/continue-phase2/$HSK_PHASE2_BROWSER/package/{unified-site,standalone-dist}`。既有静态宿主分别服务 `http://127.0.0.1:18926/hsk-hub/` 和 `http://127.0.0.1:18925/hsk-hub/new-hsk1/hsk1/`。可用 `HSK_VISUAL_SHARED_URL`、`HSK_VISUAL_STANDALONE_URL`、`HSK_VISUAL_PACKAGE_URL` 指定 root 已启动的宿主。配置不自行构建运行时。

从 `course-app` 执行：

```sh
npx tsc -p docs/continue-phase2-20261005/visual/tsconfig.json --noEmit
HSK_PHASE2_BROWSER="$browser" npx playwright test -c docs/continue-phase2-20261005/visual/playwright.visual.config.ts --project="shared-$browser" --project="standalone-$browser" --project="package-$browser" --list --reporter=json
HSK_PHASE2_BROWSER="$browser" npx playwright test -c docs/continue-phase2-20261005/visual/playwright.visual.config.ts --project="shared-$browser" --project="standalone-$browser" --project="package-$browser"
```

原生结果写入 `.repro-output/continue-phase2/$browser/visual/native-results.json`，截图与附件在 `visual/native/`。CI 用管道日志时需 `pipefail`，不得把失败改称通过。截图附加到对应原生 case，下载包应保留 case ID、实际运行重试次数、路径、字节数与 SHA。每引擎计划38张逻辑截图；附件副本字节相同，不能额外算成独立图数。

收到真实 PNG 后，人眼审查会以原像素纵向分段查看全部原高度、保留重叠及逐图 SHA；卡片原图不冒充完整页面。实际检查过的数量、未看的范围、控件几何与人眼字形检查分别记录。测试作者提供证据，工程产品变更由 root/独立审阅者验收。这里只是有限当前工程回归，不是全站全部页面或48课官方越南语采用，也不包含真实手机或全量音频人工听辨。
