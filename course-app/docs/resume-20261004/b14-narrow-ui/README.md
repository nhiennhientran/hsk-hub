# B14 narrow UI implementation checkpoint — native pending

Only three CSS files changed from exact local HEAD `c17d1469f0c515f681f6a8a6a66ea03792f73d63`, tree `540403892a89ed764b735b11859cd372d7e9a479`. The inspected source baseline is this HEAD, not the later remote CI commit. `source-before.json` checks all 218 tracked files in the two apps' `src/content` against actual HEAD blobs. `source-after.json` proves exactly the three CSS deltas; the remaining 215 files, including all 92 raw content files, are unchanged. No renderer, textbook data, registry, adapter, previous test or frozen evidence edits.

| Changed CSS | Exact candidate SHA256 |
|---|---|
| `course-app/src/style.css` | `9af9711588168b506f16e62f6a1737f91f34cb9b0a2d39856daee966dff9a9c6` |
| `hsk1-app/src/features/textbook/textbook.css` | `977210ba6f0f331bbadba4042cf47ee36b00fe10666de36216963306d2957df5` |
| `hsk1-app/src/features/source-activities/source-activities.css` | `5006e8112896236e87435291519e3fb501a916dfaacefe3a6b4e6c4e88e83bc8` |

The shared mobile top navigation returns to four equal columns with normally wrapping complete labels. Existing textbook dialogue cards wrap role and original-audio button with an explicit gap, keep the transcript on its own full-width row, and retain original DOM/text order when hidden. Existing table fields containing select get a 13rem minimum; the original table scroll region, option copy/values, fonts and field topology remain.

Both app typechecks, scoped new native fixture typecheck and both fresh builds passed locally. The compiled manifest lists the actual 105 shared and 67 standalone HTML/JS/CSS outputs; its scope does not certify the entire audio/image/data release package. The actual `--list --reporter=list` collected 20 cases: two compiled hosts × two engines × 320/390/768/1280/1440. **Native execution count is zero locally.** Collection did not launch browsers or previews and used the list-only reporter so it cannot produce a misleading passing native JSON report.

From `course-app`, after both fresh builds, the root can run:

```sh
node node_modules/typescript/bin/tsc -p docs/resume-20261004/b14-narrow-ui/tsconfig.native-check.json
node node_modules/@playwright/test/cli.js test --config=docs/resume-20261004/b14-narrow-ui/playwright.b14.config.ts
```

The new config uses the course app's locked Playwright CLI and test package together. Its only H1 source import is a TypeScript type, erased at execution; it imports no H1 Playwright package. It starts fresh **compiled Vite preview** at 18914 for shared and 18915 for standalone, with `reuseExistingServer:false`. It does not claim a source dev harness tests the compiled application. Source/control expected text comes directly from the actual frozen H1 lesson-6 JSON and lesson-1 scene-3 book rows; native assertions retain all original table fields, headers, cell order, blank cells, option text/values and dialogue Chinese/VI/pinyin.

Geometry uses rendered text Range rectangles for full captions and role/audio separation; the native default hint uses the actual computed font measured with canvas, actual padding, and a conservative 32px native-arrow allowance. `select.scrollWidth` is deliberately not used to certify the native selected label. The actual original screenshots still need to be read after new CI. Per-control font metrics are attached before their width assertions, and failures receive native screenshots. 320 original evidence only exposes the initial left scroll slice, so it is not misreported as a fully visible native hint; test controls are scrolled into view for their new screenshots. No truncation, reduced Vietnamese copy, tooltip replacement or typography compression is introduced.

The 10 old core PNGs and four old supplemental table PNGs were individually read and matched by SHA, separately recorded in `original-screen-inspection.json`. These are the real previous CI inputs, **not candidate screenshots**. `inspection-plan.md/.json` preserves the fourth source-kind/version-label design separately; this checkpoint implements no source label and claims no official Vietnamese semantic acceptance or production approval.

This is a candidate saved for root review and fresh remote native verification; no stage, commit or deploy performed by this child.
