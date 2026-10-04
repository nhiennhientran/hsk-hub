# Pre-publication release readiness

This repair follows `docs/resume-20261004/AUTONOMOUS-PLAN.md`: step 15 creates the tested, reviewable candidate; step 16 starts after the user approves publication. `package-unified.mjs --release --build` prepares a frozen candidate. It does not authorize, perform or certify deployment.

No final acceptance gate or actual C15 language/native certificate is supplied by this change. Those remain required work. Test fixtures use synthetic evidence inside disposable Git repositories and do not certify the website.

## Gate schema version 2

The default gate remains `course-app/docs/unified-final-acceptance.json`; `--gate` can select another local gate. Evidence is read locally and hash checked. PDFs and review documents are not copied into the public package.

| Field | Required value or meaning |
| --- | --- |
| `schemaVersion` / `phase` | `2` / `pre-publication` |
| `publicationApproved` / `deployed` | Both exactly `false` |
| `lessons` / `textbookLessons` | `48` / `33` |
| `testedSourceCommit` | Real immutable Git commit that was tested |
| `runtimeSourceSnapshot` | Complete sorted `{path, mode, sha256}` vector and SHA256 of its compact JSON |
| `stages` | Exactly one numeric ID each from 1 through 16 |
| Stages 1–15 | `status: passed`, nonempty file/SHA evidence; stages 14 and 15 additionally have typed certificates |
| Stage 16 | `status: awaiting-authorization` |
| `officialVI.sources` | Exactly levels 1, 2 and 3; actual PDF SHA, local `sourceFile`, pages 148/162/212, file/SHA `pageLedger` |
| `semanticAcceptance` | File/SHA reference to accepted, scoped evidence for all 48 exact lessons |

Every file reference is `{path, sha256}`. Relative paths start at the repository root; absolute local paths are allowed for evidence. Relative references must resolve within the repository; evidence must be a regular file and its actual bytes must match the SHA. Source PDFs are mandatory, including when they live outside Git. Page counts describe source coverage, not a total of completed Vietnamese language items. The old `pages: 579` value cannot satisfy official VI review.

## Tested source versus packaging HEAD

The CLI records current clean HEAD as the package `sourceCommit`. The gate records the tested commit separately. It reads the tested commit's actual Git tree, compares every scoped path, mode and blob with the actual worktree, and independently compares the worktree vector with the gate. A gate containing two fabricated matching hashes is insufficient.

A documentation-only commit may advance HEAD without invalidating the tested runtime. Any scoped source/tool/raw-input addition, deletion, mode change or byte change rejects release, including clean changes committed after the tested commit. The current worktree must also be clean in those scopes. The check runs before build and again before freezing; gate bytes and referenced evidence must remain unchanged and valid.

The existing explicit scope list retains `new-hsk1/hsk1/audio` and `new-hsk1/assets/hanzi-data`. It covers tracked and nonignored inputs. Ignored `course-app/public/course-assets` mirrors remain generated outputs: their protected raw inputs are in scope, and packaging checks approved assets and freezes actual output bytes. This repair does not broaden the established public-path whitelist or claim to snapshot installed `node_modules` as Git source.

## Official source page ledgers

Each ledger has `level`, `sourceSHA256`, and `pages` containing exactly each `pdfPage` from 1 through the source's page count, without duplicates. Every page has actual file/SHA `evidence`.

- `disposition: applicable` requires `status: accepted`, `author` and a different `independentReviewer`.
- `blank`, `metadata`, and `no-corresponding-site-content` require `status: reviewed`, a concrete `reason`, `reviewedBy`, and evidence. These dispositions do not represent accepted language items.
- Unread, unclassified, missing or merely pending pages fail the gate.

These fields record source review. They cannot establish that the corresponding website consumers were all accepted; that has a separate ledger.

## Semantic and cross-site acceptance

The semantic ledger binds `testedSourceCommit` and `runtimeSourceSnapshotSHA256`. It contains exactly HSK1 1–15, HSK2 1–15 and HSK3 1–18, with unique stable lesson IDs. Each lesson must be independently `accepted`, have `unresolved: 0`, and reference a consumer inventory containing matching `level`, `number`, `lessonId`, and unique `items: [{id, scope}]`.

The six coverage scope IDs are `titles-goals`, `vocabulary-senses-pos`, `dialogue-roles`, `grammar-examples`, `instructions-activities-tables-feedback`, and `reused-generated-displays`. Each scope requires accepted status, evidence and `acceptedItemIDs` matching the actual consumer inventory exactly; equal counts with different identities fail.

Stage 14's `certificate` independently binds the same tested commit/snapshot and contains six exact scope IDs: `shared-editorial`, `legacy-questions`, `asset-metadata`, `svg`, `terminology`, `resolved-errata`. Each requires accepted status, zero unresolved items, a scope description, actual evidence, and a consumer inventory `{scope, items: [{id}]}`. Its accepted IDs must equal that inventory. The explicit retained boundaries are 1360 legacy questions, 412 asset-metadata items and 412 SVG items. Other required scopes must be nonempty; resolved errata may be empty only with an explicit evidenced scope description. These dimensions must not be added into the 48-lesson or 522-page totals.

## Final native certificate

Stage 15's `certificate` binds the tested commit/snapshot and requires passed Chromium and WebKit evidence at exactly 320, 390, 768 and 1440 pixels. Its additional passed/evidenced check IDs are `content-media-binding`, `language-layout`, `affected-full-release`, `nonempty-history-backup-legacy`, and `student-build`. Browser booleans or old A9/CI results do not replace this final certificate. This change does not rebind old CI evidence to a new source identity.

The certificate also requires file/SHA `buildInputManifest`. This manifest has `schemaVersion: 1`, the same tested commit/source snapshot binding, and every actual native-tested dist file as `{path, bytes, sha256}`. Paths must be safe and unique; the vector must be nonempty. It includes `content-manifest.json`. After rebuilding, packaging hashes every actual dist file and requires the exact same complete path/byte/SHA set before creating output. Extra, missing, replaced and changed files fail, even with unchanged source. The newly generated unified package manifest contains packaging provenance and is outside this build-input vector, avoiding a packaging-identity cycle.

The frozen package manifest records pre-publication state, tested commit, source snapshot SHA, gate SHA, source/ledger SHAs, semantic acceptance SHA, stage 14/15 certificate SHAs, and tested build-input manifest/vector. Step 16 remains pending after packaging. Publication approval must be given against the concrete frozen candidate; online hashes and production flow acceptance happen after that authorization.

## Verification performed for this repair

Targeted tests: 16 passed, zero failed/skipped (`targeted-tests.log`). Complete `npm test`: 200 passed, zero failed/skipped (`unit-tests.log`). Temporary Git cases cover docs-only HEAD advancement, clean runtime/tool/audio/stroke drift, forged snapshots, nonexistent commits, added/deleted/mode/symlink inputs, duplicate/wrong stage/page/lesson/consumer IDs, pending publication, missing/damaged sources or evidence, incomplete semantic/cross-site coverage, and missing/stale native certificates. Exact native-tested input succeeds; same-source byte/path drift fails before output creation. Existing crop, audio, route, protected baseline and clean-source packaging tests also pass.

Actual final language acceptance, C15 native execution, release packaging and deployment were not run or certified by these tests.
