# Independent A9 guarded source input review

Status: **source-identity-verified**. No blocker found in the source identity checks.

- Current source: `835e5bd41045655cc2724ba2ba59235064ff92cf`, tree `a80360230b94da2a40a83c405a6bc06ea2f155f3`; **1,459** runtime source paths, SHA256 `333f2b56eaee6e8f28a8b69c9a5b3c1c5e018a1273b5590191a21226da0146cd`.
- Earlier tested source: `dd8b22ccb1c1a9c41bc1243887f7a60558635782`, tree `e2c89f9c2029cec09d8a8bbb1315e9cd99ea225c`; **1,110** paths using its earlier source scopes, SHA256 `a17b664ceeaf09937b4b53aa2c7877407df81eafa74490ba2014b7d52db18fcb`.
- **1,439** client paths have identical exact Git path/mode/type/blob bytes across the commits. These include **93 original MP3** and **256 retained glyph JSON** paths, which were present in the earlier commit and are newly included in the snapshot scope.
- Course tooling has **20** files; only `package-unified.mjs` changes, adding those two retained source scopes and explanatory comments. HSK1 tooling has **18** files, all unchanged. The existing regression test extends its five fixtures with one audio and one glyph path. These are the only two non-document commit changes.
- Scoped status was clean before and after. Independently hashed worktree bytes matched the current 1,459-file committed vector both times.
- Protected production `2da6a5c80c62d4ff5bdfa72a5bdb929b2b1ff3d4` remains tree `34dc16aa1e042f5f6fc6ea6edb80b9b6926cb344`, with **1,446** paths; none of those paths differs between the old and current source commits. The source checkout is not a materialized production baseline.

The existing Chromium/WebKit CI assembly files from run **37226015769** identify the earlier tested commit and the 1,110-file snapshot. This source identity review does not claim a new browser run, formal sixteen-stage acceptance, assembled-output verification, or release. No build, test, deployment, commit, stable source modification, or BVI work was performed.

The JSON records the checks, exact source vector, tool/test diffs, scoped status, and retained evidence identities.
