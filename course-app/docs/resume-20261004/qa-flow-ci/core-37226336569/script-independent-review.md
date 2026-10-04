# Core CI 37226336569 — independent script review

Reviewed `audit-current.py`, `collect-current.py`, `expected-collection.json`, the exact `dd8b22ccb1c1a9c41bc1243887f7a60558635782` workflow/tree, and the previous 37220700329 audit/reports. This review does **not** certify execution of the current 872 collected native cases. The current core audit was not executed by this reviewer.

Final reviewed SHA256:

- `audit-current.py`: `733d1e2b0a4218f09e4d580356a371456fa2e37719aa449c5dbd2589044a6ac7`
- `collect-current.py`: `c4f60e49984fb5196c9a62865668c5a382b3b260a741b5ea8098814f8c205491`

Concrete findings reported immediately and corrected by the audit owner:

| Original verification gap | Final reviewed correction |
| --- | --- |
| Existing extraction directories could supply a stale report absent from the newly verified ZIP. | Each verified ZIP receives a fresh extraction directory. Cleanup is constrained to a fixed artifact-name whitelist and a resolved direct child of INPUT; symlink destinations are rejected. |
| Four repeated copies of one valid job log satisfied the original log gate. | Logs must cover the four distinct job IDs, match their engine/shard names and exact main invocation, and have distinct byte hashes. |
| Any one passing WebKit test satisfied the extra focused startup gate. | The reporter must contain exactly the workflow's `media.spec.ts` scene-boundary identity, with current head/run and the normal single-result passed/retry0 checks. |

An intermediate cleanup-name guard accepted empty names and `..`; that regression was also reported and replaced by the fixed whitelist/direct-child check before this final review.

The final script additionally reads the old860 proof directly from the exact Git head, verifies its prior run/head/tree provenance, and checks every old identity against actual reports. Its cross-run gate now requires run 37226015769, exactly 236 unique passed cases, and the recorded visual-review byte hash.

Read-only verification completed:

- All eight saved CLI collection logs reparse to the recorded identity sets and match their recorded SHA256. Counts are unified 350 per engine, disjoint 175/175 shards, and modular 86 per engine: 872 unique collected identities.
- All 55 recorded source inputs and the workflow SHA match the exact Git head; the recorded source inputs also match local bytes.
- The six previous actual reporter files roundtrip through the current identity construction to their saved identities, including shared imported-file paths. The six current main-report selections are scoped to the correct engine/shard artifacts; modular duplicate proof accepts the legitimate `.repro-output/step8-browser.json` suffix.
- The previous 344 + 344 + 86 + 86 identities are all present in the current collection. Exactly 12 additions are recorded.
- The accepted flow evidence contains 236 unique identities; its intersection with the current collection is exactly those 12 additions. The prospective unique union is 1096 **only after the current core native audit passes**.
- Both Python files parse successfully. No browser execution, synthetic audit execution, remote mutation, runtime change, or fixture change was performed for this review.

No remaining blocking script defect was found in the final reviewed revision. Actual current report/job/artifact/log acceptance remains the responsibility of the pending real-input audit.
