# HSK1 B10 可复跑命令

在仓库根目录执行；单位、主 TS、fixture TS、collection 与 build 必须分别检查退出状态，不能用最后一项成功遮盖前面失败。

```bash
node --experimental-strip-types --test hsk1-app/tests/official-vi-revisions.test.mjs hsk1-app/tests/vi-presentation-state.test.mjs
npm run test --prefix hsk1-app
npm run check --prefix hsk1-app
hsk1-app/node_modules/.bin/tsc -p hsk1-app/tsconfig.vi-presentation-tests.json
node --experimental-strip-types course-app/docs/resume-20261004/b10-hsk1-adapter/verify-evidence.mjs
hsk1-app/node_modules/.bin/playwright test --config hsk1-app/playwright.vi-presentation.config.ts --list
npm run build --prefix hsk1-app
```

有真实 Chromium/WebKit 的隔离 CI 中，在 hsk1-app 目录执行：

```bash
npx playwright test --config playwright.vi-presentation.config.ts
```

默认使用 Playwright 已安装的两浏览器；仅有有效现成 executable 时才设置 HSK_BROWSER_PATH。固定 dev server 端口 18911，workers1/retries0，服务器不复用；3 个场景每 engine 独立运行。fixture 不含正式教材 active registry、生产登录凭据，也不改变生产入口。它调用实际 store/controller/receipt/archive 模块，验证真实 localStorage reload、first/latest 同钟不可变副本、archive 每项副本，以及听力随机选项原 index。

JSON report 写 `course-app/docs/resume-20261004/b10-hsk1-adapter/native-ci-results.json`，输出及截图使用 native-ci-* 路径，不覆盖冻结的首次 launch error-context。本地 collection 同样会写上述 JSON；只有 CI 真正执行的 report 才可当原生结果，collection 的 skipped 测试不计通过。

verify-evidence.mjs 默认只读重算真实 5,519 叶字段及 10 个受保护文件；`--write` 是作者生成证明模式，不在复验/CI 时使用。它允许 HEAD 后续因保存成果而改变，但 source bytes、指针值、owner、上下文和 protected 当前 HEAD 字节必须与已冻结值精确匹配。
