# Printed field pinyin and empty source headers

The two dedicated native cases passed locally in Chromium at widths 320 and 1440. Each case checks all 24 printed listening field pinyin strings in HSK1 lessons 12–15 and all five tables with a paired empty Chinese/Vietnamese column heading in lessons 3, 6 and 7. Each case saves 12 listening cards and five original table cards: **34 PNGs total**. Exact Chinese/Vietnamese labels, pinyin, activity versions, visible boxes, document width, retained blank header cells and table row/column topology are asserted from the actual imported `sourceLessons`.

This is a **local string/layout probe, not font certification**. The local browser has no Chinese font reported by `fc-list :lang=zh`; Chinese characters and some full-width punctuation visibly render as missing glyph boxes. The PNGs therefore cannot certify Chinese glyphs or printed punctuation. Remote Chromium and WebKit runs with actual Noto CJK installed, followed by independent review of their 68 PNGs, remain required for that visual claim. There is no physical-device or audio-listening claim.

The local run served the previously accepted immutable `flow-compat-repaired-build`, not a rebuild of subsequent partial-sentence consumers. `local-evidence-review.json` verifies all 1,717 frozen build files against the accepted manifest and records current target source hashes. The native DOM strings match those current source objects. No frozen build, product file or original 43-file flow evidence bundle was changed. Authentication is the explicitly supplied session fixture `hsk_portal_unlocked_v2=1`; password entry is outside this probe.

All five blank headers are the first column. Empty headers contain no text, children or bilingual separator and retain a positive-width header cell. All source tables retain every row and column. These five source tables currently have **zero genuinely blank body cells**, so this result makes no claim about an unexercised blank body cell. At width 320 the original wide tables scroll inside their region; screenshots capture the original leftmost view, including the blank first heading. Full document horizontal overflow is forbidden, while the original table's internal horizontal scrolling is allowed.

Run from `course-app`:

```sh
node_modules/.bin/tsc -p docs/resume-20261004/source-font-visual/tsconfig.json
node node_modules/@playwright/test/cli.js test --config=docs/resume-20261004/source-font-visual/playwright.source-font-visual.config.ts --list --reporter=list
node node_modules/@playwright/test/cli.js test --config=docs/resume-20261004/source-font-visual/playwright.source-font-visual.config.ts --project=chromium
```

The dedicated configuration uses one worker, zero retries, a 120-second case timeout and its own server on port 18786. Default input is `course-app/dist`; `HSK_SOURCE_VISUAL_DIST` can point to another already-built directory. The actual local command set `HSK_SOURCE_VISUAL_DIST=/workspace/scratch/28b55072841a/flow-compat-repaired-build` and `HSK_SOURCE_VISUAL_BROWSER_PATH=/workspace/scratch/9b691105a4f2/browser-runtime/chromium`. The executable override is local only; normal CI uses its installed Playwright browser. Both the dedicated config and the existing unified config with the explicit filename actually collect exactly two cases per engine, without skips.

The dedicated reporter writes `native-results.json` and `native-output/**`, including the two typed `source-font-evidence.json` ledgers and PNGs inside per-test directories. CI should upload both paths. This avoids overwriting the general unified-browser report. `typecheck.log` is empty because the actual strict typecheck exited zero; `local-chromium.log`, both collection logs and the raw native reporter are retained. `verify-local-evidence.py` checks the real report, exact source/ledger mappings, all PNG files and the immutable served build. `freeze-manifest.json` freezes this local evidence separately from future remote results.
