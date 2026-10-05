# 新越南语全量清单：恢复基线 1874b4a

这是 2026-10-05 续做阶段的新版本，读取精确 Git 对象建立输入快照，不读取其他代理正在修改的工作文件。旧 B10 目录和原 freeze 保持原样。

主清单包含 840 个生产输入、55,430 个字段候选、4,293 个稳定语义 consumer。`inventory.json.gz` 是重新生成的完整越南语值清单；作者结构检查与身份比较见 `validation.json`、`historical-delta.json`，全部输出的字节/SHA 和源 HEAD/tree 见 `manifest.json`。独立验收尚未执行。

新 gzip 的长度、SHA256 和 Git blob SHA 恰好等于历史缺失文件的记录值。这是确定性重新生成的结果，没有从旧存档取回原 gzip；原路径未改写。历史身份文件不含全量越南语值，故没有执行旧原文件的直接逐字节读取比较。新版本保留完整当前基线值，并记录三个历史指纹相等的事实。

`scope-supplement-inventory.json.gz` 单独保存 835 个候选，来自旧 collector 未扫描的 `new-hsk1/assets` 副本、旧入口及 HTML meta description/keywords。`inventory-expanded.json.gz` 是主清单与此补充的 56,265 条并集。同值、不同 producer 仍为不同身份。遗留路径是否可达及最终包是否保留它们尚未验收；它们不算当前 48 课的教材映射完成数。

生成器对显式 VI JSON 叶子、AST 对象/方法/模板、压缩内容层、原题库全叶子、批准 SVG 与原 source 活动保留独立身份。ASCII 无特征的无标签字符串、动态学生输入、实际 DOM 分支与历史 localStorage 内容不能由静态扫描穷举。音频和已核实原版截图按各自来源验收；其像素/声音不是本语言字符串清单的一部分。未激活的空官方 registry、非显示 sentinel 和纯音频控制 JSON 在 `input-snapshot-manifest.json` 中保留输入字节，但不冒充显示文案。

教材来源独审 48/48 的既有成果没有重做。这里的 `pending-phase-B` 继承旧 collector 的网站采用状态，指网站字段尚待对标和接入，不表示教材来源独审未完成。主清单内的 frozen、effective、metadata、legacy 与 API-only 属性是范围标记，不能据此证明真实浏览器可见。

后续工程修改必须另建版本：先提交具体运行时代码，再绑定新 HEAD/tree 生成新清单，核对新增/删除身份、值差异、判分原值及历史记录显示契约，最后把原生双浏览器和发布包验收绑定到最终版本。

重建命令（在空的新版本目录运行快照步骤；本目录已有快照时会拒绝覆盖）：

```sh
python course-app/docs/continue-20261005/inventory-new/freeze-inputs.py
node course-app/docs/continue-20261005/inventory-new/build-inventory.mjs
node course-app/docs/continue-20261005/inventory-new/validate-inventory.mjs
node course-app/docs/continue-20261005/inventory-new/build-scope-supplement.mjs
python course-app/docs/continue-20261005/inventory-new/build-new-manifest.py
```

本版本没有修改教材、网站源库、旧证据、Git refs 或生产网站。
