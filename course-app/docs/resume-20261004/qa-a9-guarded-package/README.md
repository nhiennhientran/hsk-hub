# 835e5 guarded clean checkpoint

新私有包实际从 HEAD `835e5bd41045655cc2724ba2ba59235064ff92cf` / tree `a80360230b94da2a40a83c405a6bc06ea2f155f3` 构建。`package-unified --build` 使用独占 outDir/output，未使用 allow-dirty；freeze 和独立验收前后 runtime 工作树均干净。1459 个 sourceSnapshot 输入逐一与 exact Git 和工作树字节核对，SHA `333f2b56eaee6e8f28a8b69c9a5b3c1c5e018a1273b5590191a21226da0146cd`，包括新增93音频与256 retained glyph 原输入。

真实 protected production `2da6a5c80c62d4ff5bdfa72a5bdb929b2b1ff3d4` 的1446文件由 git archive 提取；fresh package 与 assembler 的 source/media/glyph/license/static-dependency/mandatory-path 守卫实际执行通过。独立完整重哈希 **3894 assembled files / 467225119 bytes** 和2778 frozen files，1380个公共保护字节与真实生产 Git blobs 一致，55个开发源文件不 serve，11个授权替换位明确记录。

| 新身份 | SHA256 |
|---|---|
| unified manifest | `0325e75dfbb83144cdb8ae555edf0b02af0e682aae90d164f4ca0e4dc70edf94` |
| 完整实际 assembly inventory | `edee969fa8f12d971014ee037305307ae72fb62d07735a25b8a38e1d30f2e49c` |

与已测试的 dd8b22 / run37226015769 比较，**路径没有增删，3894文件中仅 source manifest 字节变化**；该 JSON 仅 `sourceCommit` 和 `sourceSnapshot` 两字段变化，`files` 与 `inputFiles` 完全相同。旧 ZIP 中实际下载的132 compiled assets +10 HTML 与新包逐字节比较一致；其余3893文件声明一致。独立子审另核1439个 client 原输入与旧提交 exact Git 字节相等，20个 course tools 中仅 packager source scope/comments 有变化，HSK1 tools 未变。因此旧两引擎 package9+legacy3的实测证据可以说明相同客户端的行为，新 source snapshot 身份仍单独记录。

本地新包 Chromium 补充执行记录为 **request-only HTTP 1 passed / browser launch 8 blocked**，不能写9 passed。旧 workspace 的 browser executable 已清理；8项在启动浏览器时失败，没有执行产品断言。项目锁定 Playwright 的标准下载尝试收到非ZIP/截断响应，未安装其他浏览器。第一次私人 reviewer config 的 server 配置合并错误也保留独立 startup log，修正后才执行上述9项。本次没有新 head WebKit 重跑，也没有重新执行236项。另一次独立 HTTP identity probe 确认实际服务的新 manifest sourceCommit 与SHA精确对应835e5，此 probe 不计新增 native case。

主要证据为 `actual-full-byte-audit.json`、`assembly.json`、`unified-release-manifest.json`、`independent-source-input-review.json`、`native-status.json`；原始运行日志、失败报告和诊断保留。完整包位于 `course-app/unified-site-a9-guarded-835e5/`，可依新 source、locked dependencies、protected Git tree 与脚本重新构建；本目录保存可检查身份与证据。

这是工程私有 clean checkpoint，未绑定旧 CI 为新提交通过，未修改生产、正式16阶段 gate 或执行越南语对标，也未部署。
