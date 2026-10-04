# 第3课唯一源转录修复闭合

初版 15fca6… 的 `review.json` 和 freeze 保留 130 accepted／1 repair，不覆盖为通过。作者修正版另存于 `official-vi-source-prep/hsk1-l03/source-correction-v2/`；本目录保存其 exact source/freeze 输入副本。

独立接受 v2 `5a92589ef8e874835374115122eb10096b7cb26c83c07b0abefb24b288eb7889`，对应作者 freeze `6ec6bd08b13105d33d7ba92e0372880d8e4a8f56afe7e4158bb1579d967000b2`。131 个源项全部与前次独立原页实际读数一致，0 修复待办、0 遗漏。

逐个 JSON 差异核查：2 个已发现的字段仅删除教材未印的句末 `.`；131 个 renderRef 仅增加因子目录而必要的 `../`；2 个顶层纠错元数据记录前版和理由。没有其他字段、原词表、原词性、中文/拼音、页码、课序、人物角色或共享1–3小结更改。`exact-json-delta.json` 留全部135处差异，不隐去版面路径变化。

独立原 PDF27／印011的 5× 裁切确认正确文本为 `Phân vai đọc to đoạn hội thoại`。全部8页的独立阅读继续对应同一 PDF SHA，其他130项沿其未变的字段逐项核验。`verify-correction.py` 先验证初版全部冻结证据字节，再验证 v2 exact SHA 和131个独立读数；从不重写初版审查。

```sh
python course-app/docs/resume-20261004/qa-official-vi/hsk1-l03-source/repair-closure-v2/verify-correction.py
```

仅官方源转录接受，未读取网站旧越南语，不是网站审校完成，无 activation 或部署。
