# Vocabulary search and textbook examples (preview)

Integrated final preview acceptance: [legacy-restoration-acceptance.md](legacy-restoration-acceptance.md). The local implementation checkpoints below are historical; final exact-head Chromium and WebKit verification is recorded in that acceptance note. Production remains unmodified pending user review.

## Behavior

- Searches selected lessons in Chinese, Vietnamese meanings, and pinyin. Matching ignores case and diacritics; pinyin accepts joined or spaced syllables.
- Search combines with the existing all/unfamiliar/wrong/due filter. The displayed count and newly created queue are the same exact set of sense IDs.
- Changing the search, lessons, direction, or filter does not alter the active saved round. Empty results disable new-round actions while the current round stays available. Clearing search restores the selected lesson/filter scope.
- A nonempty query is stored as optional `cards.review.search`. Existing rounds without this field are unchanged. Reload/import reconstructs the expected searched set and still rejects omitted, substituted, or foreign sense IDs. Preferences and the schema version are unchanged.
- Previous, next and skip stay unrestricted. No automatic advance; ratings remain optional and require reveal. Skipping does not update schedules or mark completion.
- Current `content/textbook.json` supplies Chinese, pinyin, and Vietnamese examples from dialogues/grammar. Existing fingerprints and baseline identity are verified. No sentence text or audio is duplicated into a second content source.
- All 46 homograph/polysemous senses use explicit reviewed source-ID links, including 家, 在, 天, 上 and 了. The other senses use same-lesson source matching. 328 of 344 senses have 565 displayed source references in total, capped at three examples each. The remaining 16 explicitly say there is no suitable example; nothing is fabricated.
- Examples and their textbook links are inside the revealed answer. Vietnamese-to-Chinese fronts have no Chinese answer, pinyin, examples or active audio before reveal.
- The compact lesson picker and search UI use the shared green/gold tokens, with fallbacks for the isolated preview.

## Validation in this worktree

- `npm test`: 214/214 passed, including exact engine-provenance guard and seven new vocabulary/search/content cases
- `npm run check`: passed
- `npm run build`: passed (index, TypeScript, Vite)
- `git diff --check`: passed
- `npm run test:smoke -- --list tests/browser/vocabulary-search.spec.ts`: discovered 10 cases across Chromium and WebKit
- Browser execution is **blocked, not passed**. The pinned Playwright browser is not installed. Retrying the existing `/usr/bin/chromium` failed before any test assertion: Chromium process singleton `socket() failed: Operation not permitted`. The five new flows cover search, lesson/filter intersections, empty/cleared searches, skipped-card reload, answer non-leakage, polysemy, textbook-link Back navigation and narrow-screen overflow. They still require browser-capable preview CI.

No push or production deployment was performed.
