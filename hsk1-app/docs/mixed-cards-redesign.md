# Responsive mixed vocabulary cards

Approved on 2026-10-02. The owner subsequently authorized direct publication after successful checks; no further preview approval is required. Production recovery baseline is `a74bd15736e894e1640a4a1848942f4cbc7ca9f8`.

## Interaction

- Both `#/review` and historical `#/vocabulary` open the same mixed-card surface directly. Independent listening remains reachable from course cards and belongs to the Courses navigation group.
- Select lessons 1–15 with checkboxes, select all or clear. A draft selection changes only the prospective count. Start/Update applies it and shuffles the sense-based pool once.
- Under 700 CSS pixels: one centered card. 700–1049: two columns/four cards. 1050 and above: three columns/six cards.
- The saved zero-based anchor identifies the first visible card. Next advances by the current capacity; previous subtracts that capacity with a zero clamp. Resize preserves the exact anchor and order. Counters describe visible card indexes, not completed work or page numbers.
- Every card independently flips using its native button, Enter or Space. Arrow keys operate only while a card button is focused. No answer-side DOM is present before a flip. Navigation, resize and remount show fronts again.
- Chinese-only front; pinyin and Vietnamese meaning on the back. Optional existing original audio is manual, never automatic, and stops on face reset, navigation, another playback or unmount.
- No rating, reverse direction, due filtering or scheduling controls on this surface. Browsing never updates mastery, homework scores, lesson completion or legacy schedules.

## State and compatibility

`AppData.mixedVocabulary` is optional and validated through the existing store/backup pipeline. It holds only a schema identifier and a round containing applied lessons, sense IDs, fingerprints, a saved anchor and start time. Flip state and pending settings are not saved.

The previous practice queue, preferences, ratings and schedules remain intact. A complete legacy all-words Chinese-front queue can be adopted without changing its source. Filtered, searched or reverse queues remain preserved; a clear notice asks the learner to start a new mixed round. Old backups without the new field remain valid. New records require a compatible application version to edit, so retain complete backups before downgrading.

Same sense across courses is deduplicated. Identical glyphs with distinct senses remain separate. The existing corpus has 344 senses and 319 written forms. Course textbook word cards, original content banks, 75 independent listening questions and the 30-question homework version are not redesigned.

## Verification

Acceptance evidence is recorded separately for the exact frozen source and artifact. A build or typecheck alone is not browser acceptance. The release uses one shared build for Chromium and WebKit, full regression plus strict deployment-path and asset-hash checks. Screenshots are reviewed at 320, 390, 768 and 1440 pixels.
