# B14 三处布局定位与实施边界

本轮基于本地 `c17d1469f0c515f681f6a8a6a66ea03792f73d63` / tree `540403892a89ed764b735b11859cd372d7e9a479`。218 个已跟踪 `src/content` 文件实际字节全部等于该 HEAD；精确 SHA 见 `source-before.json`。原 CI 的 10 个 core PNG 与 4 个补充表格 PNG 已逐张查看、重算 SHA，与原 map 相同。这些是旧 CI 原图，不能冒充本轮修后图。

| 问题 | 真实源码与原因 | 最窄候选 |
|---|---|---|
| 390 统一网站绿色导航末尾 VI 不完整 | `course-app/src/style.css:617` 把原四列 grid 改成不换行 flex，anchor 固定最小宽 100px；完整字符串仍在 `main.ts:136` 的四个链接里 | 只恢复 shared mobile 四等列 grid，anchor 最小宽归零、正常换行；保留四个链接的文字、顺序与字号 |
| 隐藏原文后角色和原音按钮相邻拥挤 | `hsk1-app/src/features/textbook/text.ts:51` 顺序为 strong / 原文 div / button；隐藏中间 div 后两项为相邻行内盒，无分隔。两宿主共用 `textbook.css:60` | 原卡片使用可换行 flex 与明确 gap；speaker inline-flex，原文 div 占完整行，button margin 归零。宽度足够时同排有间隔，不足时按钮自然换行，DOM 顺序不动 |
| 原生表格 select 默认提示尾部裁切 | `source-activities.css:4` 的 field 最小宽 10rem；真实两引擎 1440 原图可见 `Hãy chọn` 尾部不全 | 只给含 select 的原表格 field 13rem 最小宽；全提示、选项、字体不改，仍在原 table region 内横滚 |

320 补充原图是宽表格**初始左侧切片**，没有完整露出 select。它能证明表格保持横滚，不能独立证明默认提示整段的字体裁切。修后必须滚到相应控件检查，再用字体实际测量、几何断言及原生截图核验，不将表格滚动边界算成字形错误。

导航的问题只改统一网站。standalone 的 390 四列导航原图已经完整换行。共享 H1 教材 feature 由 `course-app/src/hsk1-bridge.ts` 动态加载同一 `hsk1-app/src/features/textbook/index.ts`，后者加载 textbook CSS；practice 再动态加载 source-activities。表格问题不是 H23 的 `lesson-view.ts` renderer。保存状态卡是 nav 的独立 sibling，现有 `.save-status` 的双语 flex-wrap 不参与本次三处修复。

新测试在 own B14 目录：两宿主的 compiled preview，Chromium/WebKit，320/390/768/1440，并加 1280 复现条件。断言四链接及完整 VI 文本范围在各自 anchor/nav 内、角色文字 Range 不与按钮交叠、原文显示/隐藏前后 DOM 文本与顺序相同、原表格所有 field/header/cell/option 文本与值逐项等于源 JSON、默认提示在真实字体下有足够内宽与原生箭头余量、横滚不溢出页面。截图仍需新 CI 实際审阅；本地缺浏览器，collection 不是 native pass。

教材版本标签是第四项**设计保留**，本次不实施。泛用 `sourceNote(page)` 只有页数，H23 `Source` 只有页数/section/provenance，不能据此全局标中文。H1 source-activities 有精确 `sourceRevision` 和旧教材 SHA，可绑定旧源文件；H1 raw textbook 的 `BookSource.kind=runtime-extraction` 则不是教材语言证据。旧 H3 inventory 明确英文课文译文从印刷 183 页起，新 `additionalSourceRevisions` 明确 `language=zh+vi`、`doesNotRevalidateOriginalEnglishAppendix=true`；原 PDF SHA 与新 VI PDF SHA 不同。未来只对已绑定 document/revision/SHA/section 的原文标 source-kind，分别表示旧教材、旧英文附录、新官方 VI 来源、补充编写或未知混合来源，来源不足时仍用通用标签。已接受词性/编号 metadata 不等于 VI wording 已审校，两 registry 仍 inactive。

Root 已告知新 CI `37237442946` success，remote head `6eb41feb4d1aa555114440f20d23e3a415cd8ed0` 与此树相同，授权实施上面三处。只改 3 CSS 与 own 新测试/证据文件，不改教材数据、registry、adapter、旧测试和冻结证据，不 stage/commit/发布。
