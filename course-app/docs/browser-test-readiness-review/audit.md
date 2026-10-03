# New HSK3 browser tests: readiness and interaction audit

This is an author audit, awaiting independent review and browser execution. It does not turn the failed runs into passes.

## Prior findings retained

- Run 37121310489: two source-specific hint groups were incorrectly assumed to be one; open-task buttons were incorrectly assumed to use the survey save label. Final outcome: 96 full tests passed, 172 not run; preflight 18 passed and 6 failed.
- Run 37121778453: Chromium enumerated a not-yet-mounted reading field list. An empty enumeration then submitted nothing, and the app correctly refused the incomplete answer. WebKit passed that preflight but the same readiness race failed later in its full suite. Final outcome: 181 full tests passed, 1 failed, 86 not run; preflight 23 passed and 1 failed.
- Run 37122087391 exercises the bounded readiness fix at the exact remote commit 6e522f20. The helper refactor below is a later local candidate, not part of that run.

## Common protocol

1. `openLesson` / `expectLessonReady` checks the source title, selected level, requested section and settled initial save state before normal interaction.
2. `activityReady` checks one exact activity, its full control count, every expected field ID and input element type, and its source-kind-specific submit button. `sourceActivity` rejects absent or ambiguous source suffixes.
3. Normal `submitSaved` first verifies every required text/select is populated, clicks the verified button, checks saved status, then compares the durable stored values and a positive checkedAt to the actual submitted controls. Feedback must be present only after this confirmation.
4. Incomplete submission is a separate explicit path. It verifies the complete field inventory first, then requires the bilingual incomplete message and no correctness feedback.
5. After a normal reload, the correct source lesson/section must be ready before persisted-value assertions.

## Scenario inventory

- Four viewport widths: exact source activity IDs, full section navigation, expected text-question counts, source-specific illustrations, no page overflow, image loading and screenshot capture.
- Practice hints: exact two/one source containers, exact two-plus-one/one paragraph counts, full bilingual source text, correct placement after the associated picture/group activity, and hidden/open/closed behavior.
- Menu: exact five official single-answer fields, fixed foods and four quadrants, keyboard navigation, incomplete/correct/incorrect/stale feedback, durable save and reload.
- Group support: exactly three original pictures, no duplicate field images, keyboard zoom, Escape and focus restoration, an open response preserved through save/reload, and source-specific reading references.
- L3 practice: two exact five-word banks, separate textbook and answer-page boundaries, five independent open group responses, and durable feedback and response restoration.
- L3 review: two independent vocabulary categories, nine independent pairs of checkboxes, an effort field, both printed page numbers and unavailable culture video status.

## Intentional races stay separate

The native HSK3 Web Lock scenario deliberately submits while a real lock is held, edits before release, verifies empty feedback and cleared checkedAt, releases the lock, and checks durable reload plus a nonempty HSK2 sentinel. It does not call `submitSaved` while the lock is held. Its final explicit resubmit still verifies one wrong and four correct answers.

The established HSK2 rapid refresh, level switch, Back/Forward, beforeunload, quota failure and retry scenarios are unchanged. No fixed timeout, fake storage success, removed test identity or shortened coverage was introduced.

## Local evidence

The focused strict TypeScript check now covers both the helper and the new HSK3 browser file, rather than relying on Playwright's transpilation alone. All 268 native test identities remain exactly equal to the pre-refactor collection; the 196-, 220- and 244-case frozen baselines also remain enforced. Full independent review and final browser execution are still required.
