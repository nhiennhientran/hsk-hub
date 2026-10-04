# source-font-visual 独立复核

独立 reviewer 为 native-catalogue；没有修改 QA01 的 fixture 或证据文件。当前接受 **本地字符串/布局证据**，没有阻塞源码问题。实际远端 Noto PNG 尚未产生，因此 A9 的新增字段拼音/空表头字形视觉缺口仍待新精确 head 的 Chromium / WebKit 各 34 PNG 逐件读取后闭合。

## 实际核验

- 严格 TypeScript 编译实际退出 0。既有 unified 配置以明确文件名实际 collect 两引擎各 2 条；此 collection 不是执行通过。命令和返回码在 [checks.json](checks.json)。
- 独立逐文件校验 author freeze 的 **52** 个 SHA/字节条目；加 freeze-manifest 与 STAGE-FILES 自身，**54** 个明确 stage 路径精确齐全，没有重复或遗漏。
- 原始 reporter 实际 **2 passed / 0 skipped / 0 unexpected / 0 flaky / 0 global errors**，每条恰好一份 passed result、retry0，Chromium 单 worker。没有重跑或覆盖原有本地执行证据。
- 两份 typed ledger 分别为 320/1440，每份的 **24 个 field pinyin、5 张空表头表**逐项映射当前七份源 JSON 的 lesson/activity/version/field/label/pinyin/source 与 table columns/rows。每份 reporter attachment 与对应 ledger 字节相同。
- **34 张实际 PNG**均能解码，全部 SHA/尺寸/精确命名与 ledger 的 12 个 listening card、5 个 table card 集合对应，无漏图或重复。每 viewport 17 张。
- 实际 served build 是此前接受的 `flow-compat-repaired-build`；accepted manifest SHA `9e348d9560ce27c49e70bc86e38d18f7952cad8da836967354325f2f19bfa20c`。独立核对 **1717** 个实际文件集合、每文件字节数与 SHA，全相同，无多/少文件。

详细源 SHA、24 个字段、五张表、34 PNG SHA/尺寸、reporter SHA 和冻结构建证明在 [local-review.json](local-review.json)；[verify-local.py](verify-local.py) 为独立只读核验脚本，只把输出写入本独立目录，没有调用会重写作者证据的 verify-local-evidence.py。

## fixture 判断

测试从明确课次集合派生 24 字段和五张表，并固定总数。实际 DOM 精确检查 Chinese/VI label 与 pinyin，检查可见包围盒、卡片水平边界和文档无水平溢出；随后对整个 activity card 截图。空表头严格检查空 textContent、零 childNodes、没有分隔点、scope=col 与正宽度；每个 tbody 行的 ID 和列数保留。窄屏宽表允许在独立区域横向滚动，截图保留左侧第一空标题列。typed evidence 记录字段 source/版本和 table topology；不将 CSS font-family 当作实际字形认证。

该 scope 与实现相符。五张表的空标题都在第 0 列，真正空白 body cell 数均为 **0**；不能声称测试覆盖了不存在的空 body cell。窄屏一张 PNG 不是整张宽表每一列的视觉证明，后续远端仍需结合 DOM topology、左侧空标题截图及桌面完整表截图判断。

## 字形限制

独立实际读取四张本地原 PNG：L12 listening/320、L15 listening/1440、L7 classroom table/320、L3 skills table/1440。Chinese 与部分全角标点明显显示缺字方框；越南语和拉丁拼音可见。作者 README 和 `glyphFontCertification:false` 标识准确，本地材料不能认证 Noto 或印刷标点。

下一步应对 root 提供的新 CI run：核对两个 package job 的精确 head、Noto 实际安装日志、2×2 实际测试、两份 artifact ZIP 的 digest/CRC 与四份 typed ledger；逐件读取 **68 张当前 PNG**，核对每个 field 的 pinyin/中越 label 和每张表的空 first header/完整桌面 row-column layout，再记录视觉通过或精确失败。不能将旧 core860 的 L4/L1 图或这次本地方框图替代这一阶段认证。
