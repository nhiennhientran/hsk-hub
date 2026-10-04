# 实际 clean CI 包与消费者验收

独立验收接受 [run 37226015769](https://github.com/nhiennhientran/hsk-hub/actions/runs/37226015769) 的 package 与普通网络 legacy 范围：remote head `dd8b22ccb1c1a9c41bc1243887f7a60558635782`、tree `e2c89f9c2029cec09d8a8bbb1315e9cd99ea225c`。本地等价提交为 `4d08a314fd0be96536b32982f4eabe598b8bbd48`。这份证据属于该候选，未沿用旧 dirty v2 包身份。

| 实际范围 | Chromium | WebKit |
|---|---:|---:|
| packaged entry / asset / public-path case | 9 passed | 9 passed |
| 普通网络 old routes 与 nested deep-link case | 3 passed | 3 passed |
| 唯一 native case 合计 | 12 | 12 |
| 重试、跳过、flaky、错误 | 0 | 0 |

24 个唯一 case 的原始 JSON 报告已复制至 `reports/`；它们的 Git metadata 与 run/head 一致。六 job 的实际 API 状态均 success；shared、retained、partial 和 font 的详细验收由其他审查者负责，不在本目录重复计数。H4 extra-stage 使用显式授权的测试 session，未声称该测试证明课堂密码正确。

两份实际 ZIP 经官方 artifact digest、CRC、重复/越界成员检查。各包实际下载并重哈希 **143 个消费者文件**：132 compiled assets（115 JS / 11 CSS / 6 JSON）、10 HTML、1 manifest；跨引擎这 143 个文件逐字节一致。六个 bundled JSON 均与新 head 的 HSK1 source JSON 字节相等；10 HTML 的层级、asset-base、alias 模板与原 build input SHA 相符，318 个静态依赖引用落入实际 assembly inventory，CSS 没有 `url()` 资源引用。

新包声明为 **3894 个 assembled files / 2778 个 frozen package files**，inventory SHA `7283a25e0d72ea32f570795498ec8661f17ecfc7cdcbf550a062cc4ba54fd7ae`；manifest SHA `d1dc3f2c8fa5ffa176ccebfe04551130407404a4ca553c02e9a4fe9ea5b187aa`。新 manifest 的 `sourceDirty=false`、1110 个记录范围内输入均与 exact Git tree 重哈希一致，sourceSnapshot SHA `a17b664ceeaf09937b4b53aa2c7877407df81eafa74490ba2014b7d52db18fcb`。

1446 个 protected production Git blobs 均实际读取核对；assembly 声明对应 1380 个公共保护字节、55 个明确不 serve 的开发源文件、11 个授权 entry/content-identity 替换位。省略上传的媒体声明另核：150 个原裁切、1200 个裁切路径、438 SVG、357 MP3、671 字形与两个 license。H1 原音频93条来自 exact root Git originals 并与 protected baseline 一致；字形271条来自 committed/protected 源，400条来自 `hanzi-writer-data@2.0.1` 完整 npm tar，其实际 sha512 与新 head lock integrity 匹配，逐字形重建生成的 provenance SHA 与包声明完全一致。

**没有下载完整3894个 assembled 文件。** 本报告区分实际下载消费者字节、exact Git/locked npm 源字节与 assembly 媒体声明；真实 assembler 和 native consumer 测试补充执行证据。完整清单与每条 SHA 见 `actual-package-ci-summary.json` 和两份 `actual-*-package-audit.json`；可重跑 `verify-package-ci.py`。

后续 guard 修复单独记录于 `runtime-input-scope-fix-review.json`。原 scopes 漏掉 shared asset preparation 实际读取的两个 root original 路径；隔离反例证明原工具对此 dirty 返回 false。root 后续补入两路径，当前工具 SHA `efc2e61e946eb6a53ab2a59e099b0dc349079ea9c4ab4c237fe09da99334976b` 的独立反例复验均 dirty=true、changed bytes 入 snapshot、SHA 改变、还原后 exact 恢复。实际工作树 snapshot 扩为1459文件（93 audio +256 retained glyph），当次状态仍 dirty，因此没有冒充新 clean manifest。可复验 `verify-runtime-input-scope-fix.mjs`；bounded build-read review 含 stroke source 优先级、生成物边界及 locked npm integrity。新 guard 的正式 clean freeze 身份由后续 checkpoint 提供，不能用本目录旧 dd8b22 manifest 代替。

本验收未修改 stable tools、workflow、产品源码或 production，也未创建正式16-stage passed、越南语全面对标、人耳全量试听、物理设备或上线完成结论。
