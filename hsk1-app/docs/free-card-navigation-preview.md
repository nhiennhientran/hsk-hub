# Free card navigation preview

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
- Local Chromium browser execution is blocked before application load by the host's `socket() failed: Operation not permitted`; retry outside the command sandbox hit the same host restriction. This is not a passing local browser result. The independent CI browser results below resolve browser verification for this exact preview source.
- Browser cases were updated explicitly: pre-rating Next/Skip are enabled except at the last card, both entry points exercise skipped/revealed/rated cards and refresh, and mixed-lesson backup import now contains an unrated gap.

The local pre-commit build manifest is diagnostic only; a final tested preview artifact must be built from its committed source so its source SHA is accurate. No public preview URL or production deployment is implied by these checks.

## Final committed preview evidence

- [CI run 36973789766](https://github.com/nhiennhientran/hsk-hub/actions/runs/36973789766): completed successfully on `3dc2c2ad6fe36e130701b550adcda3faba7bd68b`.
- Source change: `5b3554d52d6bb15dc766d517e0ce29b6486ac207`; the later tested commit adds only the read-only preview workflow.
- Freeze job: 207 unit tests passed, zero failures; catalog, fixture, build, asset, public-security and 7 architecture checks passed.
- Downloaded Chromium report: 80 expected, zero unexpected/skipped/flaky; strict release report: 3 expected, zero unexpected/skipped/flaky.
- Downloaded WebKit report: 80 expected, zero unexpected/skipped/flaky; strict release report: 3 expected, zero unexpected/skipped/flaky.
- Both browsers tested the same once-built 402-file artifact, build ID `e4cb074c5e85ff8d022a132d2a21af234f8275665709dd1ab451480d1e686a75`; public maps and reversible credential copies were both zero.
- Shared build artifact ID `11213155670`, SHA-256 `239bce7378c1d8a59fcbd33a11e4746efd2349e698e55342c812252d27b81cd4`.
- Chromium evidence artifact ID `11212582799`, SHA-256 `3fe86cc08f157f821ee37d624ba947e5d4677670c56d81bfda652a796a12ec41`.
- WebKit evidence artifact ID `11212577908`, SHA-256 `b87b361298321e68b6ea8d229e721746946afa19416e5e071d3c7d1f50d33405`.
- Pixel review covered the downloaded vocabulary 390px images in both browsers, Chromium vocabulary 1104px and WebKit review 1104px. The added Next/Skip controls, optional-rating copy and wrapped mobile controls are visible without clipping or overlap. Automated layout checks additionally cover 320/390/768/1104px. This narrow navigation review does not approve the broader page redesign, real devices or human listening/IME checks.

No production branch was changed or deployed. The broader legacy-experience restoration must run fresh acceptance against its integrated commit; this result only establishes the standalone navigation change above. This evidence-only documentation update does not imply a new runtime build.
