# Free card navigation preview

Integrated final preview acceptance: [legacy-restoration-acceptance.md](legacy-restoration-acceptance.md). The local implementation checkpoints below are historical; final exact-head Chromium and WebKit verification is recorded in that acceptance note. The user subsequently approved publication; exact artifact and live acceptance are recorded in [legacy-restoration-production.md](legacy-restoration-production.md).

Status: preview source only. This change does not deploy or merge production.
Base: `9bae5c173817d6b7f46e876ea144380d0627ab7d`, whose runtime is the released `6ac4a451da89df88faffe387fac67d67f2b805a6`.

## Approved behavior

- Both vocabulary and review allow Previous, Next and Skip without revealing or self-rating a card.
- Skip advances one position; it does not remove a card from the queue, reveal it, record mastery/completion, or change its schedule/due date.
- Previous restores that card's actual revealed/rated state. A new card starts unrevealed. A previously rated card cannot receive a duplicate rating in the same round.
- Rating remains optional and available only after reveal. Its existing schedule calculation and no-auto-advance behavior are unchanged.
- The first/last boundaries remain bounded. Last-card Next is a no-op, including for unrated or single-card rounds. UI Next/Skip are disabled on the last card.
- Lesson selection, filter, direction, shuffled order, fingerprints and the exact saved position remain stable. Skipped cards remain in the saved round through refresh, module changes and backup import.
- A round with any unrated cards is not marked complete. Rating out of order reconstructs completion time from the latest rating timestamp rather than the last queue entry.

No content, grading, listening-navigation, authentication or deployment behavior is changed. The engine provenance test still compares the complete body against the frozen legacy source with only four exact, enumerated navigation/restore exceptions.

## Verification

- Focused vocabulary tests before implementation: 13 pass, 5 fail on the old rating gates and restore assumptions.
- After implementation: 18/18 vocabulary tests; 207/207 complete unit suite; TypeScript check.
- Catalog check: unchanged 300 tasks, 344 senses / 319 forms, 93 tracks.
- Migration fixture check: all 12 deterministic nonempty fixtures unchanged.
- Release-build audit: private source audit, 93 original tracks / 267 Hanzi assets, 7/7 release architecture checks.
- Public artifact audit: zero public source maps and zero reversible credential copies; authentication code unchanged.
- Local Chromium browser execution is blocked before application load by the host's `socket() failed: Operation not permitted`; retry outside the command sandbox hit the same host restriction. This is not a passing browser result. CI browser results must be recorded before claiming browser acceptance.
- Browser cases were updated explicitly: pre-rating Next/Skip are enabled except at the last card, both entry points exercise skipped/revealed/rated cards and refresh, and mixed-lesson backup import now contains an unrated gap.

The local pre-commit build manifest is diagnostic only; a final tested preview artifact must be built from its committed source so its source SHA is accurate. No public preview URL or production deployment is implied by these checks.
