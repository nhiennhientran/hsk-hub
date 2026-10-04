# HSK23 compiled preview host 补丁独立复核

独立接受根线程的一行修复：`playwright.hsk23.ci.config.ts` 的既有 Vite preview command 增加 `--host 127.0.0.1`。旧 wrapper SHA256 `b5d342ecc7d66694687a53a6133092537e024cff873f3d90e7cad8f8d6a481ba`；当前 SHA256 `9a006ab3aa12ee4f16d06f7e327ffdecefefd9b806c76e2960e757188decfdd5`。

`author-input/before.ts`、`after.ts` 及 `exact-wrapper.diff` 保存完整字节，实际仅删一行／加一行。URL/baseURL、strictPort、编译目录、retries 0、workers 1、8 个用例、报告与提交前后 source/build/失败/跳过守卫均未弱化，webServer 默认60秒 timeout 未增加。

`probe-preview.py` 在同一 Python 进程中分别运行 **exact old/new npx command**，直接以 HTTP 连接两种 loopback 地址：旧默认 localhost 的 IPv4 连接拒绝，IPv6 `::1` 返回200；补丁后的 `127.0.0.1` 返回200，返回 body SHA 等于实际冻结编译 `dist/index.html`。两个子进程退出后再次证实两个地址均不再提供服务，没有复用或终止别人的 server。使用现有锁定 Vite8.3.2，无安装、无浏览器、无运行源更改。

实际 TypeScript 检查 exit0。实际 Playwright collection exit0，Chromium8 + WebKit8 =16 collected，native executed0；显式 list reporter 和独立环境输出目录防止覆盖旧 JSON/report。13 个相关 fixture/runtime/workflow/guard 文件逐字节等于本地 `c197ca63…` 提交，记录完整 SHA于 `review.json`。

先前失败 run37235796333／head `e0f811e47ca148ad257f19cb2867f56c71a427e4` 和全部旧 author/independent/source freeze 保留；本补丁接受不把那个失败 run 改成通过。后续仍需要新提交／新 remote head 下真实两引擎各3个 HSK1 +8个 HSK23、合计22 native用例及零 skip/retry/error 完成。当前修复的 native执行数为0，启动成功和collection不能替代CI。

独立审查者 `release_assembly`，补丁作者 `root`。本目录仅新私有证据，不 stage/commit、触发CI或部署。

复验 HTTP（要求4179两地址空闲，现有编译目录及锁定依赖在）：

```sh
python course-app/docs/resume-20261004/qa-b10-adapter-ci/preview-host-patch-independent/probe-preview.py
```
