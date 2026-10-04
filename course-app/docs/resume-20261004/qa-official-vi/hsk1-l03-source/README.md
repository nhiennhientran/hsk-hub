# HSK1 第3课原教材转录独立复核

本报告针对作者输入 `15fca6b2e6e139e6c72f8fcd6258aed77a0544d38fcb1798f1bcd4781fd3b7da`，作者冻结清单 `8555eae6afef3de977c285bbb1426e3f7c8e522124d3dded3878db7c1569c5aa`；作者文件不回写。

独立审查者 `release_assembly` 直接从用户原 PDF 生成并完整查看 8 张 3× 全页图，PDF26–33／印010–017。又直接从原 PDF 生成、查看 PDF27 分角色朗读说明、PDF30 词表和 PDF33 语言小结的 3 张 5× 图。原 PDF SHA256 `99ca3e635bbf99bcbbe003e32a0dbdf7ad0af2300b7380959d647e1028cf2764`，148页。没有使用作者图片作为独立来源，没有读取网站旧越南语。

131 个源项完成独立核对：130 个接受，1 个需要修复，遗漏 0。唯一修复项为 `hsk1-official-vi-l03-pdf027-text-1-role-read`：原书印 `Phân vai đọc to đoạn hội thoại`，没有句末句号，作者 `viText` 及 `fragments[0].lineTexts[0]` 都多加一个 `.`。原 PDF 5× 独立图 `renders/pdf-027-role-read-independent.png` 可直接复验。发现后已立即告知作者与根线程；本冻结不能宣称 131 全接受。

覆盖 18 条普通生词、4 条专名、18 个原词性、12 行角色译文、2 行绕口令、3 条语法及完整说明／省略说明／句式、妈妈内嵌 `mẹ`、有内嵌 `có`、活动与所有第1–3课共同小结。PDF32–33 的小结 9 行保持 `scopeLessons:[1,2,3]`；不误当仅第3课，也不把中文例句翻成虚构官方越文。物理拆开的我叫白家月用空串连接，不插词内空格。

已核全部 6 处版面续接。没有越南语句子跨页继续；跨页发生在课文/词表/练习/共用小结的不同部件。编号中文语法例句、填空、图片描述和小语例子气泡未印完整越译，明确不补造。`ct.`、`trợ.`、`phó.` 等原 POS 忠实保留；中文、法国、中文、泰国专名表的原词性空白不推定。女教师、姐姐/妹妹、Annie/白家月/女朋友等角色没有互换。

`independent-reading.tsv` 为独立原页视觉阅读记录，`¦` 表示物理换行；`independent-observations.json` 保存原表、角色、媒体号、共享小结和续页读数；`review.json` 给全部 ID accepted/repair/missing 明细。验证脚本成功只表示记录与冻结输入的匹配／已知差异集合正确，**不代表有修复项的源输入语言验收通过**。

```sh
python course-app/docs/resume-20261004/qa-official-vi/hsk1-l03-source/verify-review.py
```

私有源证据，不表示网站越南语已审完；无官方修订 activation、运行内容变更或部署。
