# HSK website: continuous execution plan
Updated: 2026-10-04 (Asia/Shanghai)
Status: authorized and running. User authorization received 2026-10-04 23:09:46 Asia/Shanghai: 按这版执行，过程自主推进，上线前给我确认。
Source checkpoint: 387aa7b6145e80f983f331d8b55cd2b2b26d6990.
Repository: nhiennhientran/hsk-hub.

## Latest user instructions supersede the old checkpoint rule
The user changed the order: finish the original website implementation and engineering acceptance first, then comprehensively align all corresponding Vietnamese with the three uploaded official Vietnamese textbooks. Valid alternate expressions should also align with official wording where practical.
The earlier requirement to stop every 40–50 minutes for confirmation is withdrawn. During authorized execution, save, validate, report and continue through ordinary milestones. Do not end the active implementation turn merely because a milestone was reached.
The user authorized implementation, review, repair, tests, reversible checkpoints and autonomous phase transitions. Production publication is explicitly withheld until the final candidate is confirmed.

## Definition of completion and execution boundaries
- Preserve completed HSK2/3 implementation; do not rebuild the 33 integrated lessons or rerun accepted content audits without an unresolved reason.
- Preserve legacy HSK1/2/3 routes, existing records and HSK4. Legacy HSK3 has 20 lessons; the new course has 18.
- First produce an engineering-complete candidate; after the Vietnamese audit, produce the final tested candidate. Do not make an intermediate production deployment merely to demonstrate progress.
- Once implementation is authorized, ordinary content work, repairs, targeted tests, independent reviews, reversible Git checkpoints and phase transitions proceed without per-step approval.
- Final production replacement should be approved against the concrete final candidate unless the user has explicitly authorized automatic publication of the fully tested artifact.
- Seek a user decision only when an unresolved ambiguity materially changes required learning behavior or meaning, a necessary operation lacks authorization, or a genuine access/platform blocker prevents progress. Continue independent unblocked work.
- Book-internal differences are first investigated through Chinese text, context, body/appendix and the earlier primary source. Do not mechanically propagate a confirmed printing/translation mistake.
- Never claim unperformed native-browser tests, human listening, physical-device testing or native-speaker certification.
- Hosted long-running operation does not establish immunity to platform interruption. Durable checkpoints support recovery; do not claim an automatic restart mechanism has been enabled.

## Phase A — Finish original website requirements
1. Restore and reconcile the true baseline and remaining gates. Record protected hashes, existing nonempty-record evidence, stable identities and the minimum content-revision rules needed for later Vietnamese corrections. Deliver an executable backlog and recovery checkpoint.
2. HSK1 lessons 1–3: finish candidate author checks, independent original-page and answer-source review, repairs and integration. Deliver integrated, source-traceable activities and affected checks.
3. HSK1 lessons 4–8: close lesson 4 missing original-image work without mutating historical frozen versions; review and integrate lessons 5–8. Use internal batches of 2–3 lessons. Deliver reviewed originals, exact tables and accepted catalogue entries.
4. HSK1 lessons 9–15: finish outstanding lessons 9–11 source/answer review; retain already accepted lessons 12–15 evidence; synchronize repaired candidate hashes; visually verify and integrate the 24 printed listening-stem pinyin drafts where applicable. Deliver a complete 15-lesson catalogue and history-compatible versions.
5. HSK2/3 remaining source gaps and appendices: reconcile the 33 accepted lessons with the original source ledger; close ordinary HSK3 glossary/POS and other documented omissions. Deliver a source-coverage ledger with no unidentified required gaps.
6. Images, audio and handwriting: verify all required asset/text bindings and semantic image crops. Work by level and then 2–3-lesson batches on remaining precision audio; retain accepted originals, review clip boundaries, preserve clearly labeled reliable whole-track fallbacks for genuinely unresolved clips. Complete required handwriting mapping and panel behavior. Report precise coverage separately from original-track availability; a fallback is not full precision-clip completion.
7. Learning flows: verify and repair homework, independent listening, free lesson selection/mixed word cards, reading and learning records across the 48 lessons. Deliver real demonstrable flows, including saved state and lesson switching.
8. Data and compatibility: verify revision-safe nonempty histories, backup/import/export and failure recovery, cross-level isolation, old routes and HSK4. Preserve the data actually stored; never invent missing historical wording.
9. Engineering acceptance: finish/type-check native fixtures, execute the new 148 collected cases and necessary additions, validate the exact candidate with Chromium/WebKit at 320/390/768/1440 and both hosts where applicable; run appropriate unit/build/source checks and visual/accessibility review. Freeze the engineering-complete candidate and report it, then automatically enter Phase B within the authorized active task.

## Phase B — Comprehensive official Vietnamese alignment
10. Build official source mapping and exhaustive website Vietnamese inventory; run a small representative pilot to verify the correction/version workflow. Official PDF logical pages: HSK1 148, HSK2 162, HSK3 212. Body mappings are +16/+14/+12 respectively; frontmatter has separate indexing. Respect HSK2 CropBox. OCR may help indexing; decisive checks use the original rendered page.
11. HSK1 all 15 lessons: batches 1–3, 4–6, 7–9, 10–12, 13–15. Check every corresponding title, goal, word/sense/POS, dialogue, role, grammar, example, instruction, activity, table, feedback and reused display. Every batch requires separate source rereading and review before acceptance.
12. HSK2 all 15 lessons: batches 1–3, 4–6, 7–9, 10–12, 13–15, including every three-lesson summary. Match official terminology and roles; preserve separate senses and context.
13. HSK3 all 18 lessons: batches 1–3, 4–6, 7–9, 10–12, 13–15, 16–18, including summaries and dialogue translation appendix crosschecks. Maintain independence from the 20-lesson legacy course.
14. Cross-site alignment: audit all three appendices, word lexicons, indexes, cards, homework, listening prompts/options/feedback, generated explanations, captions/alternative text, buttons and save/import/export/error text. Material without a printed official translation remains editorial and is reviewed against Chinese meaning and official terminology. Deliver complete official-alignment and editorial-review coverage plus resolved book-errata decisions.

For each audited item record stable ID, Chinese/context/sense, original site Vietnamese, official Vietnamese, PDF hash, printed/PDF page, difference class, decision, reviewer and every affected display path.
Different literal strings may be valid translations; distinguish actual error, official-style alignment, missing meaning, editorial text and book-internal dispute. Favor official wording when correct and directly corresponding.
Historical frozen banks/receipts remain preserved. New display content uses an appropriate existing revision or sidecar rather than blind replacement of immutable historical bytes.

## Phase C — Final regression and release
15. Validate the fully aligned final candidate: check complete coverage, no remaining learning-blocking errors, exact content/media binding, updated language layout, affected and full release checks, both browser engines/four widths, nonempty history/backup/legacy flows and student-build constraints. Freeze exact tested bytes, produce the final reviewable candidate, detailed acceptance report and rollback instructions.
16. After publication authorization, release the same frozen artifact, verify online file/resource hashes and actual critical learning flows. Deliver production URL, release identity, limitations and rollback point.

## Continuous execution and token discipline
Each unit follows source reading → edit → independent review → targeted validation → repair → checkpoint → progress update → next unit.
Parallel workers own disjoint files; authors do not mark their own work independently accepted. The primary thread controls shared changes and merges only reviewed candidates.
Use targeted checks during small edits; full suites at justified integration/release boundaries. Do not reread whole books or rerun the whole suite after every spelling correction without a reason.
Save each completed, reviewable unit and its provenance. Small intermediate local saves are more frequent; durable Git synchronization occurs at accepted units and before a long test or phase transition. Never call a save durable before remote success is verified.
A checkpoint records UTC/Asia-Shanghai time, branch/commit, active phase/sub-batch, exact accepted/remaining page and item coverage, unresolved questions, tests with passed/failed/not-run status and run links, independent-review status, and the next executable action.
Update status to running, blocked, awaiting-release-approval or complete only when supported by actual execution. If Git synchronization fails, state the last verified durable checkpoint and local unsynced work.
Progress messages explain what was verified, what remains and what starts next. They do not request routine approval and do not imply a stopped session continues in the background.
On recovery, read this plan and latest verified checkpoint, inspect actual files/remote jobs, retain accepted work and resume at the first unverified item.
