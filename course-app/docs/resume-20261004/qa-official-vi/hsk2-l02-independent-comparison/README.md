# HSK2 第2课：独立网站提案复核

已逐ID读取150条旧值、完整新值、原文来源及实际消费者，结果为143条措辞提案接受、5条保留扩展内容前暂停、2条需要教材语义错误修正。全部原作者文件/转录/生产保持不变，没有激活修订或部署。

|范围|实际独立结果|
|---|---|
|150提案|143 accepted-proposal / 5 held-preserve-editorial-extension / 2 repair-publisher-erratum；完整ID集合见review和proposal-decisions|
|524分类范围|476本课出现记录（451显式VI+17POS+8编辑focus/structure）、34 canonical VI/POS、1目录课名、13SVG全文|
|词义复用|17稳定词义绑定全部核对；9组改变有完整本地/Canonical双消费者一致建议，无跨课词义合并|
|18星号/附录项|不在九页104来源的接受范围，保持pending|
|19课文行/段角色|18个印刷对话角色、1个无印刷speaker的完整消息段；全部称呼方向复核，没有新增或改动speaker元数据|
|校验|2490条实际源引用、原值、来源ID、JSON/XML字段、完整非VI封印和选项碰撞检查通过|

三条grammar explanation和两条Tiểu Ngữ整段替换会移除旧值中的有用解释、示例或限制，特别是多放在单位后的可分量单位/不可任意推广到离散量词的限制。仅接受源文字，不接受这五条完整覆盖；须另外审查明确区分书正文与编辑补充的呈现，并保留全部旧扩展，之后才可激活。

角色扮演的两条提案忠实复制了教材VI，但第一问将公交车变成公交站。已从上传官方PDF独立重渲染32/印018并实视：中文问“有没有到新新电影院的公交车”，下方A例也问公交车；VI实印“có bến xe buýt đến rạp...”。后面“bến xe buýt có xa không”正确指车站距离。独立报告保留源文字，建议仅首处改成“có xe buýt đến rạp...”，或暂留当前正确语义。作者源转录没有错；这是待root最终裁决的publisher erratum分支，不能为了对标盲目注入第一问错误。

20个编辑术语一致性变更和18个明确组合源片段属于有限编辑/组合提案，不能当完整印刷译句认证。其余未建议改动的编辑题目、参考答案/图ALT没有因此获官方文字或整体翻译正确性认证。来源104、字段524和提案150都是不同层级的出现次数，不能当全站完成率。

non-vi-seal对三个完整实际JSON文档去除字面vi属性后的所有内容作相等检查，包括中文、拼音、POS、ID、答案、选项次序、source和media、结构数组；将所有150提案只在内存中模拟后均不变。所有VI选项没有产生新的同名碰撞。真实文件字节未改。

4个硬编码Bài khóa消费者另属B14；三处lesson-view真实AST范围与旧清单完全一致，当前main语义位置和值存在，但源码位置已从19422–19432变为19545–19555/604行，其source-specific recordID应由abc1c678…改成d07e81e7…。这是一条源位置元数据修复，不是语言漏项。不能把数据课名改了就说可见标题已一致。

作者snapshot中content.ts已被root后续实现修改，26input有1项当前drift；作者26范围也本就有content.ts/main.ts不同于835。旧freeze和报告不改写为当时通过，独立附加current dependency实读；当前HSK2 registry为null、投影返回基线副本。接受稳定原JSON提案不等于新loader/native接受。原 `runtimeInputHashesEqualAcceptedInventory:true` 必须限定真实raw content和资产，不能泛指全部运行代码输入。

```bash
python course-app/docs/resume-20261004/qa-official-vi/hsk2-l02-independent-comparison/verify-proposals.py
node course-app/docs/resume-20261004/qa-official-vi/hsk2-l02-independent-comparison/verify-ui-locations.mjs
```

完整判断见 `proposal-decisions.json`（每个recordID的oldValue、authorNewValue、source、具体accepted/held/repair理由及建议有效值）、`canonical-pairs.json`、`non-vi-seal.json`、`scope-coverage.json`、`role-review.json`。实际源页新证据为 `independent-page-evidence.json`/PNG，源审校104旧freeze没有重写。`verification.json`是实际结构复核；没有跑全清单、原生浏览器或部署。
