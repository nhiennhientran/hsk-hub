# HSK continuation: stage 1, paused for user review

User checkpoint rule (2026-10-04, Asia/Shanghai): stop after about 40–50 minutes, report stage results and the next execution plan, and wait for the user's confirmation before continuing implementation.

## Recovered baseline

Repository: nhiennhientran/hsk-hub. Latest recovered Dot source was `0ad47321543b9acc9e2cb206584229e6b3a069d6`, on `feature/hsk123-unified-learning-20261003`. Older local checkouts and October 1/2 packages were not used as the working baseline. Production was not changed.

## Completed work

- Repaired bounded audio startup when duration is non-finite/negative or silently shortens during a seek. Added three regressions. Independent controlled probes passed, including whole-track compatibility. This audio-only checkpoint is already remote at `16f33b56027f7bc79977b17a587a2be2d98f01d5`, branch `work/codex-hsk-resume-20261004`.
- Generalized the HSK1 source-activity engine for lesson selection, exact table topology with embedded inputs, original image crops, optional responses, read-only material, and lesson-specific archived receipts. Old missing optional snapshot keys remain absent; historical records are not regraded.
- Added 15 previously missing L4 items: original grammar examples/explanations, role-reading material, two reading questions, and pair work. L4 now has 36 activities / 27 inputs. The original 21 source-v2 activity objects are SHA-locked and unchanged.
- Integrated isolated-development candidates for L9–15: 223 activities / 284 inputs / 73 original image crops. They are not approved for production. Candidate author files and source provenance are retained under this directory.
- L12–15 independent source review covers 36 textbook pages, five answer pages, 68 official answer fields, and 32 exact image crops. Two L13 issues were repaired by the author. A further 24 printed listening-stem pinyin transcriptions are saved as a draft and have not been integrated.
- L9–11 independent review reached printed pages 61–66. A separate confirmed L9 printed-page-67 dog/cat transcription issue was passed to the author. The remaining pages and all answer-book checks remain pending; see the latest review checkpoint.
- L1–3 authoring checkpoint: 65 activities / 43 inputs / 12 crops, with all 17 source pages inspected. L5–8 authoring checkpoint: 160 activities / 159 inputs / 52 crops, with all 34 source pages inspected. These drafts still require author final checks and independent review; they have not been integrated into the application catalogue.

## Verification and limits

- Latest integrated working tree: all 587 HSK1 unit tests passed; both HSK1 and shared-course production builds passed.
- Recovered shared-course baseline: 121 unit tests passed. The source-engine focused run also passed 228 relevant cases before the final catalogue expansion.
- Audio-only native run: https://github.com/nhiennhientran/hsk-hub/actions/runs/37207351831 . It runs the original 600 main browser identities in Chromium/WebKit (plus existing focused preflights). It was still running at stage capture; do not infer a result from collection or build success.
- New native catalogue fixtures were collected: 114 unified-host and 34 standalone-host browser cases (148 across both engines). They have not been type-checked or executed and are not included in the running audio-only CI result.
- Local Playwright browser installation/startup was blocked by this execution environment. This is an environment failure, not a product pass/fail result.
- Human listening and physical-device checks have not been performed. Unverified precision audio remains on the established whole-track fallback.

## Next stage, only after user confirmation

1. Finish L1–3 and L5–8 candidate authoring and independent source review. Finish L9–11 review, apply confirmed repairs, and synchronize accepted candidate hashes.
2. Source-check and integrate the 24 listening-stem pinyin lines; complete headerless-table and multi-lesson snapshot regression coverage.
3. Finish and type-check native fixtures, then run the exact frozen candidate through four viewport widths and Chromium/WebKit, preserving existing identities and nonempty-record backup tests.
4. Report the next stage within 40–50 minutes, including any still-running native jobs. Do not publish or continue another stage without the user's confirmation.

No production deployment, merge to main, or messages to third parties occurred in this stage.
