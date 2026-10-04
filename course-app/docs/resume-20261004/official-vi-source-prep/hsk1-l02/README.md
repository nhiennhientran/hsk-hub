# HSK1 第2课：官方越文原页作者转录

本课为 source-only 作者转录。只阅读本次官方越文 PDF 原页及同源放大图，没有读取网站 VI 对照，也没有改任何运行内容或 B10 冻结。独立原页审查仍为 pending，作者结构检查不代表语言验收。

PDF SHA256 为 `99ca3e635bbf99bcbbe003e32a0dbdf7ad0af2300b7380959d647e1028cf2764`，148页。实际 PDF21–25/印005–009完整覆盖第2课；PDF26/印010已视觉确认是第3课开篇。

source-transcription.json 共84个印刷越文出现项，逐页为10/20/22/14/18。包括4项目标、3篇场景及10条角色译行、15个普通词释义和14个原印 POS、所有可见标题/指令/页眉、3条提示、基本语序标题和完整混合中越例句说明、3条绕口令译行及彩蛋标题/主题。没关系的词表 POS 空白记录 null，不补造。原印词形、`khoá`、`phó.`、姓名及标点保留，词性只转录，不转换 runtime classification。

第1篇开篇、场景和照片位于 PDF21，气泡/越文译框/词表/活动位于 PDF22；第3篇在 PDF24，词表12–15及活动续于 PDF25。layoutContinuations 明示这些页面关系，不把邻页文字冒充同一页。没有越文句子跨页合成。PDF23提示里的中文术语“没事没事”在印刷行中拆成两段，fragment.lineJoiners 明确使用空字符串连接，避免人为插入词内空格。PDF24语序说明保留 `我 (chủ ngữ) 叫 (vị ngữ) 陈天中 (tân ngữ)` 的混合语言原例；其后三条编号中文句没有印越文，明确列在 noPrintedVietnameseAreas，未翻译或借用网站内容。

五张完整页图为2.5×，PDF23提示和PDF24语法另有4×裁剪。render-manifest.json 记录实际 PDF 点坐标、渲染版本、图 SHA/bytes。candidateErrata 为空只表示本轮未识别到明显内部矛盾，不自签教材文字正确。

本目录可复跑：

```bash
python verify-transcription.py
python render-source.py --pdf '/path/to/HSK1  (3.0).pdf'
```

前者仅核结构、唯一 occurrence IDs、折行连接、引用和图 SHA；后者只读同版本重渲染，要求相同原 PDF SHA/148页。独立审查者应完整阅读原页，不用这些结构检查替代目视核对。freeze-manifest.json 冻结本课全部转录、脚本、图和作者检查日志，不包含原PDF，不激活教材修订。
