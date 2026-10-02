# Shared course engine checkpoint

The HSK2 and HSK3 2026 editions are configuration/data inputs to one `course-app` engine. The HSK1 live artifact is untouched. Shared authentication and audio are imported directly from HSK1; its atomic persistence engine gains optional identity parameters with original HSK1 defaults unchanged. The full existing 324-unit HSK1 suite was rerun and passed, not borrowed from an earlier report.

New tests verify independent course/edition IDs, nonempty old HSK1/2/3 records untouched, first/latest submission immutability, exact manual text and profile snapshots, no automatic marks on manual writing, invalid ordering rejection, quota failures with drafts retained, multi-tab conflicts, backup preview/import/recovery, stale previews, corrupt original protection and HSK3 lesson20 rejection. Twelve new unit tests pass. TypeScript passes. Pilot bundle builds from actual lesson1/2 content, with release content-completeness gates disabled only by explicit `HSK_PILOT=1`.

Local Chromium execution could not launch because the managed process environment forbids its local socket, including the approved escalation attempt. The cloud UI browser independently returned `ERR_BLOCKED_BY_CLIENT` for localhost. WebKit downloaded but its OS libraries are absent. These are never reported as passing browser checks. Exact-commit GitHub Actions will test Chromium and WebKit against one shared frozen build, with new test counts.

New stores are `ran_hsk2_fltrp_2026_v1` and `ran_hsk3_fltrp_2026_v1`; both have explicit new app/backup identity. The old keys are only read and included as read-only raw history in backups. No lesson-number or score migration is performed. New-edition reset/restore/import use atomic replacement and recovery, and preserve old keys and other-course stores.

Phase3 remains in progress until the first dual-engine browser run verifies the shared pilot flows; content review is a separate phase4 gate.
