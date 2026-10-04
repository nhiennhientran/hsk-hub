# Independent metadata gate repair review

The current `release-readiness.mjs` SHA256 `4db18945e5c731dd6fcee60de0dc3056f609edfae01ed5dfe76ac0439d38c248` is accepted only for the exact one-line metadata cardinality repair. The preserved author source SHA256 `ed4bc1b2c9b1004819dd2e8594ee2b91a58f7b54cf9a1ef13614d8860349c6b7` differs in that line alone; no original guard is otherwise changed.

`probe-metadata-gate.mjs` imports and actually calls the current `assertReleaseReadiness`. Its isolated temporary Git repository and all page/semantic/browser records are synthetic. Both the mutated inventory and certificate are re-hashed before each call, so negative cases exercise content guards rather than stale evidence hashes.

| Actual independent probes | Result |
| --- | --- |
| Complete metadata ledgers of 1 / 411 / 412 / 413 / 1981 items | 5 accepted, publication remains pending |
| Missing / extra / duplicate / same-count incorrect accepted IDs | 4 rejected |
| Missing / extra / duplicate inventory items; declared count too small / too large | 5 rejected |
| Empty ledger; blank ID; wrong scope; non-array ledger or accepted IDs | 5 rejected |
| Legacy exactly 1360; SVG exactly 412 | 2 accepted |
| Coherent legacy counts 1359 / 1361; SVG counts 411 / 413 | 4 rejected |
| Missing / duplicate accepted IDs in legacy and SVG | 4 rejected |

Total: **29 direct probes passed — 7 expected acceptances and 22 expected rejections**. A separate fresh current-source run of `node --test tests/package-unified.test.mjs tests/release-readiness.test.mjs` passed **17 / 17**, with zero failures, skips or cancellations. These are synthetic structural tests; no real native test ran.

The author’s historical 200-test log and root’s prior 17-test log remain separate read-only evidence. The fresh independent log does not relabel their provenance. The main repository was not staged, committed or changed by this review; the probe created and deleted only its own temporary fixture repository.

A positive synthetic ledger of any nonzero size does not certify that a real metadata inventory is complete. B14 still needs the complete current consumer identities, source binding and independent acceptance. This review does not approve translations, audio, an active manifest, a final release certificate or publication.

Reproduce from `course-app/`:

```sh
node docs/resume-20261004/qa-b10-release-readiness/independent-metadata-20261004/probe-metadata-gate.mjs
node --test tests/package-unified.test.mjs tests/release-readiness.test.mjs
```

The frozen run, code identity, bounded diff and referenced historical evidence hashes are recorded in `independent-review.json` and `freeze-manifest.json`.
