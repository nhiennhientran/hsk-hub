# HSK3 第 10 课：独立官方越南语源审核

已实际从上传的官方 VI PDF 重新渲染并阅读 PDF 98–106、201–202，视觉确认页脚 086–094、189–190。正文 93 个越南语源位置、附录 26 个中文关联行、3 个角色名均通过转录核对；未发现作者抄写错误或范围内越南语遗漏。28 个印刷词条的原词性及全部 33 个现有稳定词 ID 绑定通过核查。

这是源转录验收，网站对标状态另列。没有改作者转录、原始课文 JSON、运行代码、五个冻结练习库或公开部署内容。

后年在词汇框中实际印为 `năm kia, năm sau`。作者忠实转录通过，但该印刷释义与同课附录的 `năm sau nữa` 冲突；词条网站替换建议须保留 `official-source-issue`，不能以表达差异自动传播该词义冲突。

- [review.json](review.json)：范围、逐页覆盖、跨页/角色/书信边界、教材源问题及明确限制。
- [source-row-decisions.json](source-row-decisions.json)：全部 119 个源行 ID 的独立判断、原文字串及实际页图来源。
- [word-binding-decisions.json](word-binding-decisions.json)：28 个词条、33 个稳定词 ID、原词性和中文/拼音绑定。
- [input-verification.json](input-verification.json)：471 项源字节及结构核查，全部通过；不替代视觉判断。
- [render-evidence.json](render-evidence.json)：从实际 PDF 重新渲染的 11 张完整页图及 SHA。
- [verify-source-inputs.py](verify-source-inputs.py)：可复核冻结输入、ID、词性分区、原图字节与跨页约束。

复核命令，在仓库根执行：

```sh
python course-app/docs/resume-20261004/qa-official-vi/hsk3-l10-source/verify-source-inputs.py
```

正文中国语例句、问答选项没有印刷越南语时，没有创造“缺漏”的源译文。多词性词条完整释义与完整词性集合属于同一印刷词头；本报告保留原有多义项 ID，不把源链接通过当成每个义项释义分区已裁决。源 PDF 是本次上传的官方 VI 版，SHA `7e4e6953ff41659af5ec4ca3efd12c7b53e9703f7529ee65d418426afd814951`，没有冒称恢复历史中文/英文 PDF。
