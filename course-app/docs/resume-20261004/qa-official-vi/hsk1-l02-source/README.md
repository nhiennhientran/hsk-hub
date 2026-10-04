# HSK1 第2课原教材转录独立复核

仅接受作者冻结转录的教材忠实性，不代表网站越南语已审完或任何改译已经启用。

独立审查者 `release_assembly` 直接从用户原 PDF 生成并完整查看 PDF 21–25（印刷 005–009）的 5 张 3× 全页图，以及 PDF23 助力框、PDF24 语法框的 2 张 5× 原页裁切。没有用作者渲染图片代替独立原证据，没有读取网站旧越南语。

作者源输入 SHA256 `bcb9852dd334b4135679f7a55c6f95ab7cc876633ee652e4574bd88e24a6bc8f`；作者冻结清单 SHA256 `42dea94c1f0e1cc494fa7d8711a9d90d6d00e206b4e13ff67ddfceb46e14a94a`。原 PDF SHA256 `99ca3e635bbf99bcbbe003e32a0dbdf7ad0af2300b7380959d647e1028cf2764`，148 页。`author-input/` 两文件保存 exact 作者输入，不回写作者文件。

84 个印刷出现项逐项接受，修复 0，遗漏 0；逐页 10/20/22/14/18。15 个普通词、14 个原词性、10 行角色译文、3 行绕口令及其余标题/页眉/目标/场景/说明/提示/完整混合语言语法说明均覆盖。没关系的原词性空白保留，`phó.`、`khoá`、`Annie` 等书印不现代化。

第1篇开篇在 PDF21，译文和词表在 PDF22；第3篇译文在 PDF24，词表和活动在 PDF25。没有越南语句子跨页继续。PDF23 中文词组“没事没事”在混合越文提示中跨物理行拆开，使用明确空串连接而非加词内空格。PDF24 原语法例句保留 `我 (chủ ngữ) 叫 (vị ngữ) 陈天中 (tân ngữ)`；其后的 3 条中文练习原页没有越文，不补造教材翻译。混合中越括号周边间距按作者明确的保留词元排版规则记录；字形和实际行序可在独立裁切核验。

`independent-reading.tsv` 为原页视觉阅览后的逐项字面记录，`¦` 是物理换行。`independent-observations.json` 留角色、媒体号、原词表及跨页版面读数。`review.json` 给逐 ID accepted/repair/missing 结果。`verify-review.py` 验证这些已人工读页记录与冻结输入的一致性，不冒充自动视觉验收。

```sh
python course-app/docs/resume-20261004/qa-official-vi/hsk1-l02-source/verify-review.py
```

私有 docs 源证据，无官方修订 activation、运行时改动或部署。
