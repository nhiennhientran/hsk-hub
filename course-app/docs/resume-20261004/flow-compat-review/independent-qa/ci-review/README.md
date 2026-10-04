# 隔离 CI 工作流独立复核

`.github/workflows/hsk-flow-package-checkpoint.yml` 与 `course-app/tsconfig.flow-check.json` 配置复核通过，前提是在实际触发隔离 CI 分支前，将完整打包依赖及已审打包修订提交到同一来源树。root 已明确 A7-only checkpoint 不触发该分支，并负责核验实际 CI commit。

| 范围 | Chromium 实际收集 | WebKit 实际收集 |
|---|---:|---:|
| shared | 64 | 64 |
| retained HSK1 | 34 | 34 |
| fresh session backup | 1 | 1 |
| package closure | 9 | 9 |
| normal CDN legacy | 3 | 3 |

表中是本 reviewer 使用真实 CLI、`--list --reporter=list` 实测的集合数量，没有执行浏览器 CI。实际运行流 fixture tsc，exit 0。CLI 相对路径、三类 webserver 的 config cwd 与默认 dist 正确。shared/package/legacy 使用 course Playwright，retained wrapper/config/原定义统一使用 HSK1 Playwright；两份 lockfile 版本均为 1.62.1，浏览器缓存版本一致。

工作流仅允许 repository contents read，不包含部署、发布或远端写入步骤。push 限定隔离分支，另允许手动 dispatch。受保护旧版本明确导出真实 `2da6a5c80c62d4ff5bdfa72a5bdb929b2b1ff3d4`，实际 Git tree 为 `34dc16aa1e042f5f6fc6ea6edb80b9b6926cb344`，组装工具进一步核 1,446 个原 Git blob。打包模式为 checkpoint。

复核发现 retained 测试失败时 `cp` 不会执行，原 uploader 未收 generic JSON。root 已最小补入 `hsk1-retained-results.json`：第一次失败能保留原始失败报告，第二次失败能保留首次成功的独立报告和最新失败报告。六个 job 的来源与浏览器独立，报告不会跨 job 覆盖。

提交前置条件包括 `tsconfig.package-check.json`、`playwright.package-closure.config.ts`、`tests/packaged/unified-source.spec.ts`、`tools/assemble-unified-checkpoint.mjs` 和已审 packager 修订；其中 package tsc 位于所有六个 job 的公共前置步骤，缺依赖会令全部 job 失败。配置在当前完整工作区正确，不等于 A7-only checkout 已包含全部依赖。

原密码依赖案例在实际 collection 中准确排除；单独 fresh fixture 显式授权测试 session，不能认证密码。normal CDN legacy job 不设置本地 Pako 替换。作者额外 supplement 中的 `^完整案例标题$` grep 曾收集 35 而非 34，已告知作者修订；root 实际工作流使用唯一完整标题的无首尾锚点 grep，实测为 34。

`independent-ci-review.json` 记录已审文件 SHA、集合日志及条件。workflow SHA256：`94deee35b5f3649bc75f5d0ccdbea0ae76f997915fbe8020d32ee930eec38665`；flow tsconfig SHA256：`dcb394630cf44cae9e913fce039f7f29ce2787233f7942bebade120e9de8496c`。本 reviewer 只写本目录，未修改冻结的 43 份作者文件、工作流或生产代码。
