# HSK2 第2课官方来源转录：独立原页复核

原输入 `source-transcription.json` SHA256 `d240fa2fd2a8d550c8f3b5d8684aebb15814e93ec0f3be521844e17f6b88703c`，104 个 sourceIds。已逐页、逐项完成源核，**原冻结输入尚需两条转录修正，不能整份标为接受**。另外 102 条未发现原页不符或遗漏；逐 ID 的结论、输入值和必要修正在 `review.json`。本目录保留原输入的精确字节副本；作者原 JSON 未由本审校者修改。

原文件是本次上传的 HSK2 官方越南语教材，完整 SHA `6465777a77f8d9cb0d29b47f00b36a8e9e9ff627509f0f02a9909c7aaeaa231b`。本轮实际重算一致。九页原有 CropBox、90° rotation 未改；独立从原 PDF 重新渲染 scale2，九页 decoded RGB 与预备 PNG 逐字节一致。作者 preflight PNG 因此可确认为本次原 PDF 的实际显示区域，而非旧中文版页图。

| 实际 PDF 页 | 独立看见的印刷页脚 | 逐项核对记录 |
|---:|---:|---:|
| 24 | 010 | 13 |
| 25 | 011 | 15 |
| 26 | 012 | 15 |
| 27 | 013 | 16 |
| 28 | 014 | 8 |
| 29 | 015 | 16 |
| 30 | 016 | 9 |
| 31 | 017 | 5 |
| 32 | 018 | 7 |

每个页脚均实际全页查看，未以固定偏移替代视觉证据。范围包括所有标题/目标/热身表头/页眉、16 普通词和一个专名、18 句带角色的译文、3 段语法、课文4完整译文及全部越文指令/提示/图注/课堂/彩蛋文字。名的印刷词性为 `lượng./dt.`，保留两个 raw label；未推断网站 sense 或生成新句子对应关系。

## 确定修正

| sourceId | 字段 | 原候选 | 原页正确文字 |
|---|---|---|---|
| hsk2-official-vi:l02:p010:goal2 | viPrinted | Có thể hiểu và sử dụng được “多” để diễn đạt số ước lượng. | **Có thể nghe hiểu và sử dụng được “多” để diễn đạt số ước lượng.** |
| hsk2-official-vi:l02:p013:text2-line4 | zhAnchor | 是网上说的，网上还说北京大学有三千多名外国学生呢。 | **是网上说的，网上还说北京大学有三千多名外国学生。** |

第一条经过 root 提出的分歧复看，直接从未改原 PDF24 做6倍局部 render，`nghe` 四字母明确存在。证据 `pdf024-goal2-original-crop-6x.png`，显示页坐标 clip `[85,235,515,282]`，SHA `7b844bc9eb223b1961f07424b412eba9efeb294f1c296d62ab317424d8604a84`。该意见来自越文印刷 glyph，而非从中文“能听懂”补译。

第二条原 PDF27 的中文气泡及拼音均在“学生”后结束，没有“呢”。直接6倍 crop `pdf027-text2-line4-original-crop-6x.png`，clip `[98,252,265,371]`，SHA `1d5293468d4e1f70752e2ef33af4fa8d684292eefcfb9bd65686966df89c06ef`。该句的越文/角色在原输入中准确，只改中文锚点；不联动改任何网站内容。

clip 坐标是 PyMuPDF 原 CropBox 和旋转后的 `Page.rect` 显示坐标，不是未经转换的 MediaBox 或绝对 CropBox 左上坐标。所有 source/page/crop 身份在 `source-page-evidence.json`，没有 OCR。

## 特别确认的边界

* 语法3标题和中文解释在印刷15/PDF29，越文解释在印刷16/PDF30。`grammar3-body` 以实际越文页16/30存储、`zhAnchorPrintedPage:15` 均正确。可另加 `zhAnchorPDFPage:29` 增强显式来源配对；这是可选 metadata 完善，不是额外文字修正。
* 课文4在 PDF30 是无说话人标签的整段原文和整段越文；`speakerPrinted:false` 及 whole paragraph scope 正确。没有拆成网站句号单元、没有借场景中的发信息者来虚加译文说话人；`40 000` 原样保留。
* 18句角色按原印刷对齐：课文1 Bạch Gia Nguyệt/Nhân viên phục vụ/Annie，课文2和3 Bạch Gia Nguyệt/Annie；普通词 POS 和越文原词逐行检查。姓名、称谓、标点排版约定范围内均匹配，不作词义移植或语言优劣判断。
* 未发现缺漏的越文 source unit。中文-only 题目/选项/示例/图中文字、拼音和数字不补越文。root 的标点/ellipsis及换行空格转写约定被明确保留，不把光栅字体当可恢复的原 Unicode 编码。

下一步作者只修这两个确定字段、保留原冻结输入并提供新 SHA；审校者再检查真实 final bytes 的完整差异、sourceId 集合和修正值。最终来源输入验收之后，仍需单独启动 B 的网站消费者对照与官方越文修订。此报告没有网站对标完成、active revision 或上线认可；生产和作者文件修改0，浏览器/设备/人工或母语听辨0。H1 源转录由本代理作者完成，将由其他代理复核，本代理未给自己来源自验收。
